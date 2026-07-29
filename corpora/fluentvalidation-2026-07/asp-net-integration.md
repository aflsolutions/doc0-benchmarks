# ASP.NET Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/aspnet.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md)
- [src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs)
- [docs/upgrading-to-9.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md)
- [docs/di.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/di.md)
- [docs/upgrading-to-10.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md)
- [docs/index.rst](https://github.com/FluentValidation/FluentValidation/blob/main/docs/index.rst)
- [docs/upgrading-to-8.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md)
- [docs/upgrading-to-11.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md)
- [docs/built-in-validators.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/built-in-validators.md)
- [docs/start.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md)
- [docs/webapi.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/webapi.md)
- [docs/mvc5.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/mvc5.md)
- [src/FluentValidation/README.md](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/README.md)
- [src/FluentValidation.DependencyInjectionExtensions/README.md](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/README.md)
- [docs/localization.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md)
- [docs/upgrading-to-12.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md)
- [docs/blazor.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/blazor.md)
- [docs/testing.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/testing.md)
- [docs/async.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md)
- [src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs)
- [docs/advanced.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/advanced.md)
</details>

## Overview

FluentValidation integrates natively and through third-party packages into ASP.NET web applications to validate incoming models across various architectural patterns. It solves the challenge of connecting strongly-typed server-side validation rules with HTTP request lifecycles, offering flexibility from manual controller injection to automated pipeline execution. Key design decisions balance ease-of-use with asynchronous support and architectural decoupling, allowing integration with modern ASP.NET Core controllers, minimal APIs, Blazor components, and legacy web pipelines. Sources: [docs/aspnet.md:3-11](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L3-L11), [docs/aspnet.md:173-198](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L173-L198), [docs/aspnet.md:208-258](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L208-L258)

## ASP.NET Core Auto Validation

### Overview

ASP.NET Core automatic validation removes the need for repetitive manual validator invocations inside every controller action by intercepting incoming HTTP requests prior to action execution. Incoming models are validated automatically, populating `ModelState` or returning structured validation problem details before your custom endpoint logic runs. Depending on your architectural needs, you can choose between ASP.NET's built-in MVC validation pipeline or third-party action filter integrations.

Sources: [docs/aspnet.md:11-12](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L11-L12), [docs/aspnet.md:171-198](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L171-L198)

### Pipeline versus Filter Integration

Choosing an automatic validation strategy involves understanding how each mechanism hooks into the ASP.NET request lifecycle. The legacy built-in validation pipeline integrates directly into ASP.NET Core MVC model-binding, whereas modern action filters delegate execution asynchronously via third-party packages like `SharpGrip.FluentValidation.AutoValidation`.

| Integration Approach | Supported Runtimes | Asynchronous Support | Debugging Complexity | Recommended Usage |
|----------------------|--------------------|----------------------|----------------------|-------------------|
| ASP.NET Validation Pipeline | MVC Controllers, Razor Pages | No (Synchronous only) | High (hidden behind MVC internals) | Legacy implementations only |
| Action Filter (`SharpGrip.FluentValidation.AutoValidation`) | MVC Controllers, Minimal APIs | Yes (Fully asynchronous) | Low (Explicit filter middleware) | New projects and modern endpoints |

Sources: [docs/aspnet.md:175-198](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L175-L198)

> [!WARNING]
> Attempting to use an asynchronous validator within ASP.NET's built-in validation pipeline will throw an exception at runtime because the underlying MVC model-binding pipeline does not support asynchronous execution. Use an action filter package if your rules require `Async` database checks or remote calls.

Sources: [docs/aspnet.md:183-184](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L183-L184), [docs/aspnet.md:195-198](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md#L195-L198)

## Dependency Injection Registration

### Overview

Registering validators with the dependency injection container enables them to be resolved automatically by services, controllers, or validation factories. The `FluentValidation.DependencyInjectionExtensions` package provides `IServiceCollection` extension methods that scan assemblies for validator implementations and register them alongside the `IValidator<T>` interface and as their own concrete implementation types. Alternatively, `ServiceProviderValidatorFactory` bridges legacy infrastructure by resolving validator instances directly from an `IServiceProvider`.

Sources: [src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs:27-111](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs#L27-L111), [src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs:23-34](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs#L23-L34), [docs/di.md:1-4](https://github.com/FluentValidation/FluentValidation/blob/main/docs/di.md#L1-L4)

### ServiceCollection Registration Extensions

Assembly scanning methods traverse assemblies to locate validation classes and register each discovered validator with configurable lifetimes and filtering options.

| Extension Method | Parameter Signature | Default Lifetime | Description |
|------------------|---------------------|------------------|-------------|
| `AddValidatorsFromAssemblies` | `IEnumerable<Assembly> assemblies, ServiceLifetime lifetime = ServiceLifetime.Scoped, Func<AssemblyScanner.AssemblyScanResult, bool> filter = null, bool includeInternalTypes = false` | `Scoped` | Scans multiple specified assemblies for validators. |
| `AddValidatorsFromAssembly` | `Assembly assembly, ServiceLifetime lifetime = ServiceLifetime.Scoped, Func<AssemblyScanner.AssemblyScanResult, bool> filter = null, bool includeInternalTypes = false` | `Scoped` | Scans a single specified assembly for validators. |
| `AddValidatorsFromAssemblyContaining` (Type) | `Type type, ServiceLifetime lifetime = ServiceLifetime.Scoped, Func<AssemblyScanner.AssemblyScanResult, bool> filter = null, bool includeInternalTypes = false` | `Scoped` | Scans the assembly containing the specified `Type`. |
| `AddValidatorsFromAssemblyContaining<T>` (Generic) | `ServiceLifetime lifetime = ServiceLifetime.Scoped, Func<AssemblyScanner.AssemblyScanResult, bool> filter = null, bool includeInternalTypes = false` | `Scoped` | Scans the assembly containing generic type parameter `T`. |

Sources: [src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs:37-83](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs#L37-L83)

> [!WARNING]
> Registering a validator as a `Singleton` service requires extreme caution if that validator depends on transient or request-scoped dependencies, such as an Entity Framework DbContext. `Transient` is the safest default choice to avoid captive dependency bugs.

Sources: [docs/di.md:89-92](https://github.com/FluentValidation/FluentValidation/blob/main/docs/di.md#L89-L92)

### Registration Execution Walkthrough

When an assembly scanning extension method runs, it executes a deterministic sequence of calls to discover and register types into the service collection:

1. `AddValidatorsFromAssembly()` calls `AssemblyScanner.FindValidatorsInAssembly(assembly, includeInternalTypes)` to collect all valid validator types.
2. For each discovered result, it invokes `AddScanResult(scanResult, lifetime, filter)`.
3. Inside `AddScanResult`, the optional `filter?.Invoke(scanResult)` delegate evaluates whether the type should be registered. If `shouldRegister` evaluates to true, two service descriptors are added:
   - First, `services.TryAddEnumerable(new ServiceDescriptor(serviceType: scanResult.InterfaceType, implementationType: scanResult.ValidatorType, lifetime: lifetime))` registers the validator against `IValidator<T>`.
   - Second, `services.TryAdd(new ServiceDescriptor(serviceType: scanResult.ValidatorType, implementationType: scanResult.ValidatorType, lifetime: lifetime))` registers the validator as its own concrete type.

Sources: [src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs:53-111](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceCollectionExtensions.cs#L53-L111)

### ServiceProviderValidatorFactory Implementation

For legacy codebases or components requiring `IValidatorFactory`, `ServiceProviderValidatorFactory` wraps an `IServiceProvider` to resolve validator instances on demand.

```csharp
public class ServiceProviderValidatorFactory : ValidatorFactoryBase {
	private readonly IServiceProvider _serviceProvider;

	public ServiceProviderValidatorFactory(IServiceProvider serviceProvider)
		=> _serviceProvider = serviceProvider;

	public override IValidator CreateInstance(Type validatorType)
		=> _serviceProvider.GetService(validatorType) as IValidator;
}
```

Sources: [src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs:26-34](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs#L26-L34)

> [!CAUTION]
> `IValidatorFactory` and its implementors are deprecated and marked with `[Obsolete]`. New development should resolve `IValidator<T>` or specific validator types directly from the service provider or via dependency injection constructor injection.

Sources: [src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs:25](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.DependencyInjectionExtensions/ServiceProviderValidatorFactory.cs#L25)

## Legacy Web API and MVC Pipelines

### Overview

Integration with ASP.NET Web API 2 and ASP.NET MVC 5 was provided in FluentValidation 8.x but is no longer maintained, supported, or compatible with FluentValidation 9 or newer. Applications using these legacy pipelines must migrate to ASP.NET Core.

Sources: [docs/webapi.md:1-8](https://github.com/FluentValidation/FluentValidation/blob/main/docs/webapi.md#L1-L8), [docs/mvc5.md:1-8](https://github.com/FluentValidation/FluentValidation/blob/main/docs/mvc5.md#L1-L8)

### Legacy Component Resources

For instructions on using these unsupported legacy components with FluentValidation 8, review the dedicated legacy wiki documentation pages:

- ASP.NET Web API 2 Integration: [WebApi-2-Integration](https://github.com/FluentValidation/FluentValidation-LegacyWeb/wiki/WebApi-2-Integration)
- ASP.NET MVC 5 Integration: [MVC-5-Integration](https://github.com/FluentValidation/FluentValidation-LegacyWeb/wiki/MVC-5-Integration)

Sources: [docs/webapi.md:10](https://github.com/FluentValidation/FluentValidation/blob/main/docs/webapi.md#L10), [docs/mvc5.md:10](https://github.com/FluentValidation/FluentValidation/blob/main/docs/mvc5.md#L10)

> [!WARNING]
> Integration with ASP.NET Web API 2 and ASP.NET MVC 5 is no longer supported as of FluentValidation 9. Please migrate to ASP.NET Core.

Sources: [docs/webapi.md:3-6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/webapi.md#L3-L6), [docs/mvc5.md:3-6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/mvc5.md#L3-L6)

## Blazor and Async Validation Pipelines

### Overview

FluentValidation does not provide built-in integration with Blazor out of the box, requiring developers to rely on community-maintained third-party libraries for component form integration.

Sources: [docs/blazor.md:1-3](https://github.com/FluentValidation/FluentValidation/blob/main/docs/blazor.md#L1-L3)

### Third-Party Blazor Integration Libraries

The following third-party libraries provide integration between FluentValidation and Blazor forms:

- [Blazilla](https://github.com/loresoft/Blazilla)
- [Blazored.FluentValidation (Archived)](https://github.com/Blazored/FluentValidation)
- [Blazor-Validation](https://github.com/mrpmorris/blazor-validation)
- [Accelist.FluentValidation.Blazor](https://github.com/ryanelian/FluentValidation.Blazor)
- [vNext.BlazorComponents.FluentValidation](https://github.com/Liero/vNext.BlazorComponents.FluentValidation)
- [Tenekon.FluentValidation.Extensions.AspNetCore.Components](https://github.com/tenekon/Tenekon.FluentValidation.Extensions.AspNetCore.Components)

Sources: [docs/blazor.md:5-10](https://github.com/FluentValidation/FluentValidation/blob/main/docs/blazor.md#L5-L10)

### Asynchronous Validation Rules

When working with scenarios such as checking an external API, asynchronous rules can be defined using `MustAsync`, `CustomAsync`, or asynchronous conditions with `WhenAsync`.

```csharp
public class CustomerValidator : AbstractValidator<Customer> 
{
  SomeExternalWebApiClient _client;

  public CustomerValidator(SomeExternalWebApiClient client) 
  {
    _client = client;

    RuleFor(x => x.Id).MustAsync(async (id, cancellation) => 
    {
      bool exists = await _client.IdExists(id);
      return !exists;
    }).WithMessage("ID Must be unique");
  }
}
```

Sources: [docs/async.md:1-23](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md#L1-L23)

Validators containing asynchronous rules must be invoked using `ValidateAsync` rather than `Validate`.

```csharp
var validator = new CustomerValidator(new SomeExternalWebApiClient());
var result = await validator.ValidateAsync(customer);
```

Sources: [docs/async.md:25-30](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md#L25-L30)

> [!NOTE]
> Calling `ValidateAsync` executes both synchronous and asynchronous rules.

Sources: [docs/async.md:32-35](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md#L32-L35)

> [!WARNING]
> If a validator contains asynchronous validators or asynchronous conditions, calling `Validate` instead of `ValidateAsync` will throw an exception. Additionally, asynchronous rules should not be used with automatic validation in ASP.NET because the ASP.NET validation pipeline is synchronous.

Sources: [docs/async.md:37-42](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md#L37-L42)

## Version Migration and Pipeline Evolution

### Overview

The evolution of FluentValidation across major version releases (9.0 through 12.0) has introduced significant architectural refinements to its ASP.NET integration pipeline, dependency injection registrations, interceptors, and client-side validator adaptors. Understanding these changes is critical when upgrading applications between major versions.

Sources: [docs/upgrading-to-9.md:1-5](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L1-L5), [docs/upgrading-to-10.md:1-7](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L1-L7), [docs/upgrading-to-11.md:1-6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L1-L6), [docs/upgrading-to-12.md:1-6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L1-L6)

### Pipeline Evolution and Breaking Changes Across Versions

As FluentValidation progressed from version 9 through version 12, platform support and integration mechanics underwent continuous modernization. Version 9 dropped legacy targets such as `netstandard1.1`, `netstandard1.6`, and `net45`, while formally deprecating MVC 5 and Web API 2 integrations. Version 10 shifted dependency injection registrations for validators from `Transient` to `Scoped` when using ASP.NET integration, combined interceptor interfaces, and updated client-side validator adaptor factory signatures. Version 11 removed support for .NET Core 2.1 and introduced exceptions for synchronous invocations of asynchronous validators. Version 12 dropped support for .NET Core 3.1, .NET 5, .NET 6, .NET 7, and .NET Standard 2.0/2.1, setting .NET 8 as the minimum supported version, alongside removing `InjectValidator` and `Transform`.

Sources: [docs/upgrading-to-9.md:7-19](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L7-L19), [docs/upgrading-to-10.md:116-178](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L116-L178), [docs/upgrading-to-11.md:15-30](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L15-L30), [docs/upgrading-to-12.md:9-26](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L9-L26)

| Version | Key ASP.NET / Pipeline Breaking Change | Migration Action |
| :--- | :--- | :--- |
| **9.0** | MVC 5 and Web API 2 packages deprecated without further updates. | Migrate to ASP.NET Core. |
| **10.0** | Validators registered as `Scoped` instead of `Transient` in DI. | Update service lifetime expectations if required. |
| **10.0** | `IValidatorInterceptor` and `IActionContextValidatorInterceptor` combined. | Update interceptor implementations to accept `ActionContext`. |
| **10.0** | Client-side validator adaptor factory receives `IRuleComponent` instead of `IPropertyValidator`. | Update adaptor constructors and lookup keys to use non-generic interfaces like `IMyCustomPropertyValidator`. |
| **11.0** | `RunDefaultMvcValidationAfterFluentValidationExecutes` removed. | Use `fv.DisableDataAnnotationsValidation = true` instead. |
| **12.0** | `InjectValidator` removed. | Use standard constructor injection with `SetValidator(addressValidator)`. |

Sources: [docs/upgrading-to-9.md:18-19](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L18-L19), [docs/upgrading-to-10.md:116-178](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L116-L178), [docs/upgrading-to-11.md:122-139](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L122-L139), [docs/upgrading-to-12.md:60-88](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L60-L88)

> [!WARNING]
> In version 10.0, ASP.NET integration automatically registers validator types in the DI container as `Scoped` rather than `Transient`.

Sources: [docs/upgrading-to-10.md:116-119](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L116-L119)

### Client-Side Validator Adaptor Migration Example

When upgrading client-side validation adaptors from FluentValidation 9 to 10+, factories must accept an `IRuleComponent` and use non-generic property validator interfaces as lookup keys:

```csharp
// Before (v9 style):
services.AddMvc().AddFluentValidation(fv =>
{
  fv.ConfigureClientsideValidation(clientSide =>
  {
    clientSide.Add(typeof(MyCustomPropertyValidator), (context, rule, validator) => new MyCustomClientsideAdaptor(rule, validator));
  });
});

// After (v10+ style):
services.AddMvc().AddFluentValidation(fv =>
{
  fv.ConfigureClientsideValidation(clientSide =>
  {
    clientSide.Add(typeof(IMyCustomPropertyValidator), (context, rule, component) => new MyCustomClientsideAdaptor(rule, component));
  });
});
```

Sources: [docs/upgrading-to-10.md:146-176](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L146-L176)

## Related

- [[Dependency Injection]]
- [[Blazor Integration]]

