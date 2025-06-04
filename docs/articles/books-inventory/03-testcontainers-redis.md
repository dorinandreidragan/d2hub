---
title: "hybridcache & redis: cache smarter, not harder for asp.net apis"
date: 2025-05-01
category:
  - systemdesign
series:
  name: "a hands-on guide to modern software development"
  episode: 3
order: 3
tag:
  - webdev
  - testing
  - redis
  - aspnet
summary: "Learn to boost ASP.NET API performance by integrating HybridCache and Redis for smarter caching."
---

<ArticleStatusBadge />

<img class="cover-image" src="../../.assets/books-inventory/architecture-caching.svg"/>

# hybridCache & Redis: Cache smarter, not harder for ASP.NET APIs 🚀

## cache smarter, not harder

If your ASP.NET API slows down under frequent database queries, smarter caching can make all the difference. In this article, we'll show you how to integrate HybridCache and Redis to boost performance efficiently. You'll learn how a two-tier caching strategy—a fast in-memory layer complemented by a distributed Redis cache—can cut down on latency and offload your database. We'll walk through the code changes and testing improvements that help you cache smarter, not harder.

> This article builds on the previous two articles where we covered **[testing minimal web apis][episode-01]** and adding **[postgresql with testcontainers][episode-02]**.

## hybridCache: A smarter approach to API caching

HybridCache bridges the gaps between `IMemoryCache` and `IDistributedCache` by offering a unified API for both in-process and out-of-process caching. It combines a fast, local in-memory cache with a durable distributed cache—in our project, powered by Redis—giving you the best of both worlds.

**Key Benefits:**

- **Unified API:** Write caching logic once to work with both local memory and a durable distributed cache.
- **Built-In Stampede Protection:** Prevents multiple simultaneous cache misses from triggering duplicate, expensive operations.
- **Configurable Serialization:** Uses System.Text.Json by default, with easy options to switch to other serializers if needed.
- **Simplified Code:** Replace complex caching patterns with a single, elegant `GetOrCreateAsync` method.

For example, instead of manually managing cache keys, serialization, and concurrency, you simply write:

```csharp
return await cache.GetOrCreateAsync(
    $"someinfo:{name}:{id}",
    async cancel => await SomeExpensiveOperationAsync(name, id, cancel),
    token: token
);
```

This streamlined approach helps you cache smarter, not harder, making your ASP.NET API more responsive and easier to maintain. See [HybridCache library in ASP.NET Core].

## upgraded API endpoints for smart caching

Before diving into the code, here’s a quick overview of our caching strategy for each endpoint:

- **GET Endpoints:**
  These endpoints are read-heavy, so caching saves the cost of frequent database queries. When a book is requested, we first check the in-memory cache for lightning-fast results. In case of an application restart (which clears the in-memory cache), our durable Redis layer (used as a distributed cache) ensures data persistence. This two-tier (HybridCache) approach improves responsiveness without sacrificing consistency.

- **DELETE Endpoints:**
  Deleting data requires us to invalidate any cached copies. This ensures that once a book is removed from the database, no stale data is served from either cache layer—even in a distributed environment.

- **PUT Endpoints:**
  Update operations need to synchronize both the database and cache. When a book is updated, the cache should also reflect these changes (either by refreshing or invalidating the stale data), so that future GET requests always see the most recent version.

- **POST and Search/Get-All Endpoints:**
  For **POST requests**, we avoid caching because creating new records introduces consistency challenges in distributed caches. Similarly, for **search and get-all endpoints**, caching dynamic query results (especially when pagination is involved) can lead to stale or inconsistent data. Instead, we rely on pagination to manage load and ensure freshness.

Now, let’s see how we implemented these strategies in our code:

### **prerequisites for caching**

#### **get the libraries**

Install the required NuGet packages.

```bash
dotnet add package Microsoft.Extensions.Caching.Hybrid --version 9.4.0
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis --version 9.0.2
```

#### **register the services**

In `Program.cs` add the services to the dependency injection (DI) container:

```csharp
// Add StackExchangeRedisCache service for Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("RedisConnection");
    options.InstanceName = "BooksInventoryCache:";
});

// Add HybridCache service
builder.Services.AddHybridCache();
```

### **GET endpoint: fast and durable retrieval**

For GET requests, we cache the book data with HybridCache. On a cache miss, the data is fetched from PostgreSQL, then stored in both the in-memory and Redis layers (used for durability in distributed scenarios).

```csharp
app.MapGet("/books/{id}", async (int id, BooksInventoryDbContext db, HybridCache cache) =>
{
    var book = await cache.GetOrCreateAsync($"book_{id}", async (cancellationToken) =>
    {
        return await db.Books.FindAsync([id], cancellationToken);
    });

    return book is not null
        ? Results.Ok(book)
        : Results.NotFound(new { Message = "Book not found", BookId = id });
});
```

_Explanation:_

- **Cache Miss:** The first request fetches the book from the database and then caches it.

  ![Cache miss]

- **Cache Hit:** Subsequent requests serve the book data from the much faster in-memory cache—falling back to Redis if the app has restarted.

  ![Cache hit]

### **DELETE endpoint: ensuring consistency by invalidation**

When deleting a book, it's crucial to remove its cached version to prevent serving stale data later on.

```csharp
app.MapDelete("/books/{id}", async (int id, BooksInventoryDbContext db, HybridCache cache) =>
{
    var book = await db.Books.FindAsync(id);
    if (book is null)
    {
        return Results.NotFound(new { Message = "Book not found", BookId = id });
    }

    db.Books.Remove(book);
    await db.SaveChangesAsync();

    // Remove the entry from the cache
    await cache.RemoveAsync($"book_{id}");

    return Results.NoContent();
});
```

_Explanation:_

- Once the book is deleted from the database, we explicitly remove the cache entry from Redis. This helps ensure that even in a distributed scenario—with multiple app instances—the cache remains consistent.

### **PUT endpoint: updating and refreshing the cache**

When updating a book, we make sure the cache reflects the latest changes by either refreshing or invalidating the cached value.

```csharp
app.MapPut("/books/{id}", async (int id, AddBookRequest request, BooksInventoryDbContext db, HybridCache cache) =>
{
    var book = await db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
    if (book is null)
    {
        return Results.NotFound(new { Message = "Book not found", BookId = id });
    }

    book = book with
    {
        Title = request.Title,
        Author = request.Author,
        ISBN = request.ISBN
    };

    db.Books.Update(book);
    await db.SaveChangesAsync();

    // Update the cache
    await cache.SetAsync($"book_{id}", book);

    return Results.Ok(book);
});
```

_Explanation:_

- After successfully updating the record, we update the existing cache entry so that the next GET will fetch updated information.

### **POST & Search/Get-All endpoints: caching exclusions**

For **POST requests**, we avoid caching new entries because:

- The creation process might involve multiple distributed components.
- Ensuring immediate consistency is challenging.

Similarly, **Search and Get-All endpoints** aren’t cached due to:

- The dynamic nature of query results.
- The added complexity and risk of stale data when working with numerous filters and pagination.

Instead, we rely on efficient pagination to limit data volume, ensuring a balanced load without the pitfalls of caching complex queries.

Below is the updated section that covers our testing approach in depth, from containerized fixtures to automated and manual cache verification. This revised piece explains how we integrated Testcontainers for Redis, outlines our composite fixture setup (including the individual PostgreSql and Redis fixtures), and highlights the cool benefits of verifying two-level caching with HybridCache.

## enhanced testing with Testcontainers and automated validation

To ensure our caching strategy functions as expected in a real-world scenario, we containerized our dependencies and wrote automated tests to inspect every caching layer. Here’s how we did it:

### containerized testing with composite fixtures

We use a composite fixture to spin up both PostgreSQL and Redis containers automatically. This setup uses Testcontainers to simulate a production-like environment—even for the distributed cache.

**1. Adding the Redis Testcontainer Package:**
To add Redis container support for integration tests, we installed the following NuGet package:

```bash
dotnet add package Testcontainers.Redis --version 4.4.0
```

**2. Our Fixture Composition:**
Each container is encapsulated in its own fixture:

- **PostgreSqlContainerFixture:**
  Configures and starts a PostgreSQL container using the `postgres:15-alpine` image.

- **RedisContainerFixture:**
  Configures and starts a Redis container using the `redis:7-alpine` image.

- **CompositeFixture:**
  Combines these fixtures into one:

  ```csharp
  public class CompositeFixture : IAsyncLifetime
  {
    public PostgreSqlContainerFixture Postgres { get; private set; }
    public RedisContainerFixture Redis { get; private set; }

    public CompositeFixture()
    {
        Postgres = new PostgreSqlContainerFixture();
        Redis = new RedisContainerFixture();
    }

    public async Task InitializeAsync()
    {
        await Task.WhenAll(
            Postgres.InitializeAsync(),
            Redis.InitializeAsync()
        );
    }

    public async Task DisposeAsync()
    {
        await Task.WhenAll(
            Postgres.DisposeAsync(),
            Redis.DisposeAsync()
        );
    }
  }
  ```

**3. CustomWebApplicationFactory and Test Injection:**
Our `CustomWebApplicationFactory` now accepts the composite fixture as a parameter. This allows dependency injection of both containers to configure connection strings and services seamlessly.

For example, the constructor of our integration tests shows the composite fixture being injected:

```csharp
[Collection(nameof(IntegrationTestsCollection))]
public class BooksInventoryCacheTests : IAsyncLifetime
{

    private readonly CustomWebApplicationFactory factory;
    private readonly HttpClient client;
    private readonly BooksInventoryDbContext db;
    private readonly IDistributedCache redis;
    private readonly CompositeFixture fixture;

    public BooksInventoryCacheTests(CompositeFixture fixture)
    {
        this.fixture = fixture;
        this.factory = new CustomWebApplicationFactory(fixture);
        this.client = this.factory.CreateClient();

        // Create a scope to retrieve scoped instances of DB context and Redis cache
        // for direct database and cache interactions during tests
        var scope = this.factory.Services.CreateScope();
        this.db = scope.ServiceProvider.GetRequiredService<BooksInventoryDbContext>();
        this.redis = scope.ServiceProvider.GetRequiredService<IDistributedCache>();
    }
    // ...
}
```

This setup, along with similar implementations for `PostgreSqlContainerFixture` and `RedisContainerFixture`, ensures our tests run in a consistent and realistic environment.

### automated cache behavior verification

It's a super cool part of our implementation—by verifying HybridCache’s two-level caching behavior, we get intimate visibility into its inner guts.

#### BooksInventoryCacheTests

- **In-Memory Cache Verification:** The test simulates a warmup (fetching a book for the first time) that stores a value in the in-memory cache. Then, we deliberately update the underlying data in PostgreSQL and Redis to see if the in-memory layer still returns the original data, confirming that the in-memory cache is effective.

  ```csharp
  [Fact]
  public async Task InMemoryCacheHit_AfterWarmup()
  {
      var book = new Book
      {
          Title = "t1",
          Author = "a1",
          ISBN = "isbn1"
      };
      db.Books.Add(book);
      await db.SaveChangesAsync();

      // Cache warm-up (should populate both in-memory and Redis cache)
      await this.client.GetAsync($"/books/{book.Id}");

      // Mutate db and Redis to differ from the in-memory cache.
      await db.UpdateBookAsync(book with { Title = "t1_db_updated" });
      await redis.UpdateBookAsync(book with { Title = "t1_redis_updated" });

      // Request the book again (should return stale value from in-memory cache).
      var response = await this.client.GetAsync($"/books/{book.Id}");

      // Assert
      var bookFromInMemory = await response.DeserializeAsync<Book>();
      bookFromInMemory!.Title.Should().Be("t1");

      Book bookFromDb = await db.GetByIdAsync(book.Id);
      bookFromDb!.Title.Should().Be("t1_db_updated");

      var json = await redis.GetStringAsync(book.Id.GetCacheKey());
      json.Should().Contain("t1_redis_updated");
  }
  ```

- **Redis Cache Verification (Durability):**To test Redis involvement, we simulate an application restart by disposing our factory. The in-memory cache is lost, so the following GET request should fall back on Redis, returning the cached (old) value even after the database update.

  ```csharp
  [Fact]
  public async Task RedisCacheHit_AfterWarmUp()
  {
      var book = new Book
      {
          Title = "t1",
          Author = "a1",
          ISBN = "isbn1"
      };
      db.Books.Add(book);
      await db.SaveChangesAsync();

      // Cache warm-up (should populate both in-memory and Redis cache)
      await this.client.GetAsync($"/books/{book.Id}");

      // App restart (should clear the in-memory cache)
      this.factory.Dispose();
      using var newFactory = new CustomWebApplicationFactory(this.fixture);
      using var newClient = newFactory.CreateClient();

      // Mutate db to differ from redis cache.
      await db.UpdateBookAsync(book with { Title = "t1_db_updated" });

      // Request the book again (should return stale value from redis cache).
      var response = await newClient.GetAsync($"/books/{book.Id}");

      // Assert
      var bookFromRedis = await response.DeserializeAsync<Book>();
      bookFromRedis!.Title.Should().Be("t1");
      Book bookFromDb = await db.GetByIdAsync(book.Id);
      bookFromDb!.Title.Should().Be("t1_db_updated");
  }
  ```

#### BooksInventoryTests

Other tests (like adding, updating, and deleting books) also interact with the caching layers indirectly by verifying the API responses. They ensure that our endpoints work seamlessly with HybridCache and the underlying containers, confirming both data consistency and performance gains.

### manual cache verification using a REST Client

1. Add Redis to our development environment. Update the `docker-compose.yml`:

```yaml
services:
  # ... existing PostgreSQL service ...
  redis:
    image: redis:7.0-alpine
    container_name: books_inventory_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

2. Start the infrastructure:

   ```bash
   docker-compose up -d
   ```

3. Update database:

   ```bash
   dotnet ef database update --project src/BooksInventory.WebApi/BooksInventory.WebApi.csproj
   ```

4. Start the Web API:

   ```bash
   dotnet run --project src/BooksInventory.WebApi/BooksInventory.WebApi.csproj
   ```

5. Inspect caching behavior manually:

- **Add a new book** via the `/addBook` endpoint. The log should look like this:

  ```plaintext
  info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (10ms) [Parameters=[@p0='?', @p1='?', @p2='?'], CommandType='Text', CommandTimeout='30']
      INSERT INTO "Books" ("Author", "ISBN", "Title")
      VALUES (@p0, @p1, @p2)
      RETURNING "Id";
  ```

- **First GET Request**: Should log a database SELECT, indicating a cache miss. The log should look like this:

  ```plaintext
  info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[@__p_0='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
      SELECT b."Id", b."Author", b."ISBN", b."Title"
      FROM "Books" AS b
      WHERE b."Id" = @__p_0
      LIMIT 1
  ```

- **Subsequent GET Requests**: No SELECT log should appear, confirming that the response is served from cache.

## conclusion & next steps

In this article, we explored how to boost your ASP.NET API's performance by leveraging HybridCache with Redis. We walked through our two-level caching strategy, updated API endpoints for fast retrieval and consistency, and demonstrated our robust, containerized testing approach. By using HybridCache, you get a unified caching API with built-in stampede protection and configurable serialization—making it far easier to **cache smarter, not harder**.

**next up**: Observability! We'll integrate OpenTelemetry to monitor cache hits, misses, and performance.

Ready to cache smarter, not harder 🚀? Clone the [GitHub repository], try it out, and share your experience! Did you find interesting ways to use HybridCache? I'd love to hear about them in the comments or in a GitHub discussion.

[HybridCache library in ASP.NET Core]: https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid?view=aspnetcore-9.0
[GitHub repository]: https://github.com/dorinandreidragan/books-inventory/tree/episode/03-testcontainers-redis
[Cache miss]: ../../.assets/books-inventory/cache-miss.svg
[Cache hit]: ../../.assets/books-inventory/cache-hit-in-memory.svg
[episode-01]: ./01-testing-minimal-web-api.md
[episode-02]: ./02-testcontainers-postgresql.md
