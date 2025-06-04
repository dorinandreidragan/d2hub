---
title: "get ready for testcontainers: taking minimal web api testing to the next level"
date: 2025-04-09
category:
  - systemdesign
series:
  name: "a hands-on guide to modern software development"
  episode: 2
order: 2
tag:
  - webdev
  - programming
  - aspnet
  - unittest
summary: "Upgrade your API tests by using PostgreSQL and Testcontainers for isolated, repeatable integration testing."
---

<ArticleStatusBadge />

<img class="cover-image" src="../../.assets/books-inventory/testcontainers-postgresql.png"/>

# get ready for Testcontainers: Taking minimal web API testing to the next level

In the [first article] of this series, we explored **how to test minimal web APIs in ASP.NET** using an in-memory dictionary. But now, it's time to level up!

Instead of relying on a simple in-memory store, we’ll integrate a [**PostgreSQL**][postgreSQL] database and use [**Testcontainers**][Testcontainers] to run isolated, repeatable integration tests in containers. In this article, we will:

1. Set up testing with [Testcontainers].
2. Adjust our tests to use a real database.
3. Watch our tests fail and fix them step-by-step.
4. Create and apply migrations using `dotnet ef`.

---

## from in-memory to containers

In the first iteration, we tested using:

- A `ConcurrentDictionary` to store books.
- Lightweight [xUnit] tests with no external dependencies.

Now, we’re upgrading to:

- **Centralized NuGet package versioning** for cleaner dependency management.
- **Testcontainers** to isolate tests in containers.
- **PostgreSQL** using **EF Core** for persistence.

## centralizing package versions with Directory.Packages.props

First, ensure that you manage package versions centrally across all projects. Run this command in the root of your repository:

```bash
dotnet new packagesprops
```

This creates a `Directory.Packages.props` file. Then, add the following content:

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="coverlet.collector" Version="6.0.2" />
    <PackageVersion Include="FluentAssertions" Version="8.2.0" />
    <PackageVersion Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.3" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageVersion Include="xunit" Version="2.9.2" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.2" />
  </ItemGroup>
</Project>
```

After updating, run a `dotnet restore` to ensure your solution picks up the centralized versioning.

See [Central Package Management | Microsoft Learn] for more details.

## project setup

Ensure your project files no longer include version information, since this is now defined in `Directory.Packages.props`. Your `*.csproj` files should look like this:

### web api (`BooksInventory.WebApi.csproj`)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

### tests (`BooksInventory.WebApi.Tests.csproj`)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="coverlet.collector" />
    <PackageReference Include="FluentAssertions" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\BooksInventory.WebApi\BooksInventory.WebApi.csproj" />
  </ItemGroup>
</Project>
```

## writing tests with Testcontainers

This section shows how to write tests using [Testcontainers] while leveraging [xUnit] features for management of asynchronous initialization and shared setups. We use the following concepts from xUnit:

- **IAsyncLifetime**: For asynchronous setup and teardown of test resources.
- **CollectionDefinition**: To group tests that share the same setup/teardown logic.
- **Collection**: To associate test classes with the shared collection, ensuring tests run in an isolated, consistent environment.

See [Shared Context between Tests | xUnit.net] for more details.

### adding required NuGet packages

**For the Test Project:**

Add the [Testcontainers NuGet package] (which supports PostgreSQL) via:

```bash
dotnet add package TestContainers.PostgreSql --version 4.3.0
```

**For the Web API Project:**

Add the following packages to integrate EF Core with PostgreSQL:

```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 9.0.4
dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.0.4
dotnet add package Microsoft.EntityFrameworkCore --version 9.0.4
```

## setting up the database context

First, update your `Book` record to include an immutable `Id` property and use `init` accessors for all properties. The updated version looks like this:

```csharp
public record Book
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Author { get; init; }
    public required string ISBN { get; init; }
}
```

> **Note**: After updating the `Book` class, ensure that any code referencing it is modified accordingly so that the project compiles.

Then, add the `BooksInventoryDbContext` class to the Web API project:

```csharp
using Microsoft.EntityFrameworkCore;

namespace BooksInventory.WebApi;

public class BooksInventoryDbContext : DbContext
{
    public DbSet<Book> Books { get; set; }

    public BooksInventoryDbContext(DbContextOptions<BooksInventoryDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>()
            .HasKey(u => u.Id);
        modelBuilder.Entity<Book>()
            .HasIndex(u => u.Title)
            .IsUnique();
    }
}
```

## integration test setup

To prepare for integration testing, we introduce several helper classes and attributes.

### PostgreSqlContainerFixture

This fixture starts a PostgreSQL container using Testcontainers and applies all pending migrations to initialize the database schema.

```csharp
public class PostgreSqlContainerFixture : IAsyncLifetime
{
    public PostgreSqlContainer Postgres { get; private set; }

    public PostgreSqlContainerFixture()
    {
        Postgres = new PostgreSqlBuilder()
            .WithImage("postgres:latest")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await Postgres.StartAsync();

        // Ensure that the database schema is created by applying migrations.
        var options = new DbContextOptionsBuilder<BooksInventoryDbContext>()
            .UseNpgsql(Postgres.GetConnectionString())
            .Options;

        using var context = new BooksInventoryDbContext(options);
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync() => Postgres.DisposeAsync().AsTask();
}
```

_Usage Explanation_:

The `PostgreSqlContainerFixture` sets up a PostgreSQL container for the test run and applies migrations so that the database mirrors the production schema.

### CustomWebApplicationFactory

By extending `WebApplicationFactory`, this class configures the test host to use PostgreSQL instead of the default in-memory store. The override in `ConfigureWebHost` replaces the default DB context registration with one that uses the container’s connection string.

```csharp
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string postgreSqlConnectionString;

    public CustomWebApplicationFactory(string postgreSqlConnectionString)
    {
        this.postgreSqlConnectionString = postgreSqlConnectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Overwrite the existing DB context registration so that tests use the PostgreSQL container.
        builder.ConfigureServices(services =>
        {
            services.AddDbContext<BooksInventoryDbContext>(options =>
            {
                options.UseNpgsql(this.postgreSqlConnectionString);
            });
        });
    }
}
```

_Usage Explanation_:

This abstraction hides the details of database registration during tests, keeping test classes clean while ensuring that the Web API connects to the proper PostgreSQL instance.

### test collection and class setup

We then define a collection to share our PostgreSQL container fixture and apply it to our test classes:

```csharp
[CollectionDefinition(nameof(IntegrationTestsCollection))]
public class IntegrationTestsCollection : ICollectionFixture<PostgreSqlContainerFixture> {}

[Collection(nameof(IntegrationTestsCollection))]
public class BooksInventoryTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory factory;
    private readonly HttpClient client;
    private readonly BooksInventoryDbContext dbContext;

    public BooksInventoryTests(PostgreSqlContainerFixture fixture)
    {
        this.factory = new CustomWebApplicationFactory(fixture.Postgres.GetConnectionString());
        this.client = this.factory.CreateClient();

        // Create a scope to retrieve a scoped instance of the DB context.
        // This allows direct interaction with the database for setup and teardown.
        var scope = this.factory.Services.CreateScope();
        dbContext = scope.ServiceProvider.GetRequiredService<BooksInventoryDbContext>();
    }

    public async Task InitializeAsync()
    {
        // Clean the database to ensure test isolation.
        dbContext.Books.RemoveRange(dbContext.Books);
        await dbContext.SaveChangesAsync();
    }

    // Dispose resources to maintain isolation after each test run.
    public Task DisposeAsync()
    {
        this.client.Dispose();
        this.factory.Dispose();
        return Task.CompletedTask;
    }

    // ... your tests go here
}
```

_Usage Explanation_:

- **[CollectionDefinition] and [Collection] Attributes**: These group test classes that share the same PostgreSQL fixture so that the container is started once per collection.
- **IAsyncLifetime**: Implements asynchronous setup and cleanup of test resources.

Phew! That’s a lot of setup, but it’s crucial for ensuring that our tests run in a clean, isolated environment.

## watch the tests fail

At this point, running the tests will **fail** because the application is still using an in-memory store. For example, you might see an error like:

```
BooksInventory/tests/BooksInventory.WebApi.Tests/BooksInventoryTests.cs(91): error TESTERROR:
      BooksInventory.WebApi.Tests.BooksInventoryTests.AddBook_ReturnsBookId (1ms): Error Message: Npgsql.PostgresException : 42P01: relation "Books" does not exist
```

## update `Program.cs` to use EF Core

Now let's update `Program.cs` to make the application use EF Core with PostgreSQL.

```csharp
using BooksInventory.WebApi;

var builder = WebApplication.CreateBuilder(args);

// Register the PostgreSQL service with EF Core.
// This replaces any default in-memory service configuration.
builder.Services.AddDbContext<BooksInventoryDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

var app = builder.Build();

// Inject the DB context to add a new book asynchronously.
app.MapPost("/addBook", async (AddBookRequest request, BooksInventoryDbContext db) =>
{
    var book = new Book
    {
        Title = request.Title,
        Author = request.Author,
        ISBN = request.ISBN
    };
    db.Books.Add(book);
    await db.SaveChangesAsync();
    return Results.Ok(new AddBookResponse(book.Id));
});

// Inject the DB context to get a book asynchronously.
app.MapGet("/books/{id}", async (int id, BooksInventoryDbContext db) =>
{
    var book = await db.Books.FindAsync(id);
    return book is not null
        ? Results.Ok(book)
        : Results.NotFound(new { Message = "Book not found", BookId = id });
});

app.Run();

public record AddBookRequest(string Title, string Author, string ISBN);
public record AddBookResponse(int BookId);
public record Book
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Author { get; init; }
    public required string ISBN { get; init; }
};

// Explicitly define Program as partial for integration tests.
public partial class Program { }
```

**Additional Instructions:**

- Update `appsettings.Development.json` with the following connection string:

  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=books_inventory;Username=user;Password=password"
  }
  ```

## add migrations

Now that the application has been updated to use PostgreSQL, add the initial migrations with:

```bash
dotnet ef migrations add InitialCreate --project src/BooksInventory.WebApi/BooksInventory.WebApi.csproj
```

This command generates the migration files necessary to set up your PostgreSQL database schema.

After adding the migrations, run your tests using:

```bash
dotnet test
```

Your tests should now run smoothly within the containerized environment.

## developer setup for manual testing

For **manual testing in a development environment**, be sure to apply the migrations after starting the database. Use the following `docker-compose.yml` configuration to start PostgreSQL:

```yaml
services:
  database:
    image: postgres:15-alpine
    container_name: books_inventory_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: books_inventory
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user", "-d", "books_inventory"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

1. **Start the database container:**

   ```bash
   docker-compose up -d
   ```

2. **Apply migrations:**

   Right after the service is up, run:

   ```bash
   dotnet ef database update --project src/BooksInventory.WebApi/BooksInventory.WebApi.csproj
   ```

3. **Test the database connection:**

   Install the PostgreSQL client (for example, on Ubuntu use `sudo apt install postgresql-client`), then connect using:

   ```bash
   psql -h localhost -U user -d books_inventory

   # Enter "password" as password when prompted.
   ```

   If you see an error message such as:

   ```
   Failed executing DbCommand (10ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
   SELECT "MigrationId", "ProductVersion"
   FROM "__EFMigrationsHistory"
   ORDER BY "MigrationId";
   ```

   this is normal since this error appears when no migrations have been applied yet. You may safely ignore it.

4. **Verify the Database Schema:**

   In the `psql` terminal, run:

   ```bash
   \dt
   ```

   The expected output should be similar to:

   ```
    Schema |         Name          | Type  | Owner
   --------+-----------------------+-------+-------
    public | Books                 | table | user
    public | __EFMigrationsHistory | table | user
   (2 rows)
   ```

### manual testing in VSCode using a REST Client

For a quick manual test of your API endpoints:

- Open the project in VSCode.
- Use the [REST client] extension and create an `*.http` file with the following content:

  ```
  # Base URL
  @baseUrl = http://localhost:5000

  # Test POST /addBook
  POST {{baseUrl}}/addBook HTTP/1.1
  Content-Type: application/json

  {
      "Title": "The Pragmatic Programmer",
      "Author": "Andy Hunt and Dave Thomas",
      "ISBN": "9780135957059"
  }

  ###

  # Test GET /books/{id} (replace {id} with a valid BookId from the POST response)
  GET {{baseUrl}}/{id} HTTP/1.1
  Accept: application/json
  ```

- Send these requests to verify that the API routes are functioning as expected.

## final thoughts

By following these steps, we’ve:

- Set up **Testcontainers** for isolated, reproducible integration tests.
- Switched our storage from an in-memory dictionary to a real **PostgreSQL** database.
- Applied migrations to ensure that our tests run against a schema identical to production.

**next steps:**

- Setting up a **CI pipeline**.
- Explore integrating **Redis** for caching.
- Add **RabbitMQ** for messaging.
- Implement **OpenTelemetry** for distributed tracing.

Stay tuned for more in-depth articles into system design and testing strategies!

**your turn**: Try this approach in your own projects and see how much smoother your testing workflow becomes. Got a cool testing trick? Share it in the comments or hit me up on GitHub [here](https://github.com/dorinandreidragan/books-inventory/tree/episode/02-testcontainers-postgresql). 📬

[Central Package Management | Microsoft Learn]: https://learn.microsoft.com/en-us/nuget/consume-packages/Central-Package-Management
[first article]: ./01-testing-minimal-web-api.md
[postgreSQL]: https://www.postgresql.org/
[REST client]: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
[Shared Context between Tests | xUnit.net]: https://xunit.net/docs/shared-context
[Testcontainers]: https://www.testcontainers.org/
[Testcontainers NuGet package]: https://www.nuget.org/packages/TestContainers.PostgreSql
[xUnit]: https://xunit.net/
