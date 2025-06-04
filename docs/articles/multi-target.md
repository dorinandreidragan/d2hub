---
title: "target different .net versions in test projects"
date: 2024-02-04
category:
  - programming
order: 3
tag:
  - dotnet
summary: "Learn how to target and test multiple .NET versions in your test projects."
---

<ArticleStatusBadge />

# target different .net versions in test projects

This document explains how to target different .Net versions in test projects.
It mainly focuses on the `net48` and `net8` frameworks.

## net48 test projects

The `net48` test projects **cannot** reference `net8` class libraries. The only
way to do that, would be to convert the old project format to
`Microsoft.Net.Sdk` format and target multiple frameworks. See [Multi Target
Test Projects](#multi-target-tests-projects).

```mermaid
flowchart LR
  net48_tests(net48 tests) --> net48
  net48_tests --> netstandard_client
  net48_tests -- not possible --> net8

  style net8_client fill:red,stroke:#333,stroke-width:1px
```

## net8 test projects

The `net8` test projects **can** reference `net48`, `netstandard` and `net8`
class libraries without any other adjustments.

```mermaid
flowchart LR
  net8_tests(net48 tests) --> net48
  net8_tests --> netstandard
  net8_tests --> net8
```

## multi-target test projects

A project that has the `Microsoft.Net.Sdk` format for its `*.csproj` file can
target multiple frameworks. In the diagram and code snippets below, it is
illustrated how we can multi-target `net481` and `net8.0`.

```mermaid
flowchart LR
  subgraph not_netframework [ ]
    netstandard
    net8
  end
  multi(net48, net8 tests) -- #if NETFRAMEWORK --> net48
  multi -- #if !NETFRAMEWORK --> not_netframework
```

- Change the `*.csproj` as below in order to target `net8.0` and `net481`
  frameworks.

```xml
<!-- *.csproj -->
<PropertyGroup>
  <TargetFrameworks>net8.0;net481</TargetFrameworks>
</PropertyGroup>

...

<!-- conditionaly target the net481 project -->
<ItemGroup Condition=" '$(TargetFramework)' == 'net481'">
  <ProjectReference Include="..\Net48Client\Net48Client.csproj" />
</ItemGroup>

<!-- conditionaly target the net8.0 project -->
<ItemGroup Condition=" '$(TargetFramework)' == 'net8.0'">
  <ProjectReference Include="..\Net8Client\Net8Client.csproj" />
</ItemGroup>
```

- Change the unit tests classes as below in order to run the corresponding code
  for the targeted framework, considering this:
  - The `using` statement **needs** compiler directive
  - The `netstandard` code **does not need** any compiler directive
  - The `net481` and `net8` code **needs** compiler directive

```cs
// The using section needs directives
#if !NETFRAMEWORK
using Net8Client;
#else
using Net48Client;
#endif

namespace NetMultiTargetTests;

[TestClass]
public class NetCalculatorTests
{
    // Method that runs with netstandard doesn't need any directive
    [TestMethod]
    public void NetStandard20SumTest()
    {
        Assert.AreEqual(3, new NetStandard20Calculator().Sum(1, 2));
    }


// Methods that run with net8 needs directive
#if !NETFRAMEWORK

    [TestMethod]
    public void Net8SumTest()
    {
        Assert.AreEqual(3, new Net8Calculator().Sum(1, 2));
    }

// Methods that run with net48 needs directive
#else

    [TestMethod]
    public void Net48SumTest()
    {
        Assert.AreEqual(3, new Net48Calculator().Sum(1, 2));
    }


#endif
}
```
