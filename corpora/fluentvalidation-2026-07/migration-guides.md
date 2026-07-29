# Migration Guides

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/upgrading-to-9.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md)
- [docs/upgrading-to-10.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md)
- [docs/upgrading-to-11.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md)
- [docs/aspnet.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md)
- [docs/upgrading-to-12.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md)
- [docs/upgrading-to-8.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md)
- [src/FluentValidation/DefaultValidatorOptions.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/DefaultValidatorOptions.cs)
- [docs/index.rst](https://github.com/FluentValidation/FluentValidation/blob/main/docs/index.rst)
- [docs/testing.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/testing.md)
- [docs/cascade.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md)
- [docs/localization.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md)
- [src/FluentValidation/README.md](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/README.md)
- [docs/mvc5.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/mvc5.md)
- [docs/transform.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/transform.md)
- [docs/webapi.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/webapi.md)
- [docs/inheritance.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/inheritance.md)
- [src/FluentValidation.DependencyInjectionExtensions/README.md](https://github.com/FluentValidation/FluentValidation.DependencyInjectionExtensions/README.md)
- [docs/custom-validators.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/custom-validators.md)
- [docs/advanced.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/advanced.md)
- [docs/built-in-validators.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/built-in-validators.md)
- [docs/configuring.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/configuring.md)
- [src/FluentValidation.Tests/UserSeverityTester.cs](https://github.com/FluentValidation/FluentValidation.Tests/UserSeverityTester.cs)
</details>

## Overview

Migrating between major versions of FluentValidation requires careful attention to breaking changes, deprecated API retirements, platform target updates, and core structural revisions. Each major upgrade guide documents the necessary steps to transition your validation logic safely across library versions.

Sources: [docs/upgrading-to-8.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L3-L6), [docs/upgrading-to-9.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L3-L6), [docs/upgrading-to-10.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L3-L6), [docs/upgrading-to-11.md#L4-L7](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L4-L7), [docs/upgrading-to-12.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L3-L6)

## Upgrading to Version 8

### Overview

FluentValidation 8.0 introduces several breaking changes, deprecations of legacy collection and validation patterns, and structural reorganizations across asynchronous workflows and property configuration APIs. Reviewing these updates ensures a smooth migration path from version 7.x to 8.

Sources: [docs/upgrading-to-8.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L3-L6)

### Asynchronous Validation and Property Path Updates

Asynchronous validation workflows replace internal dependencies on Microsoft `TaskHelper` classes with native `async/await` execution. While existing asynchronous code remains unaffected, several methods now accept an explicit `CancellationToken`. Additionally, validation callers can validate specific properties using a full property path string:

```csharp
validator.Validate(customer, "Address.Line1", "Address.Line2");
```

Sources: [docs/upgrading-to-8.md#L7-L12](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L7-L12), [docs/upgrading-to-8.md#L47-L53](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L47-L53)

### Deprecated and Removed API Members

FluentValidation 8 eliminates several legacy methods and structural properties that were previously marked obsolete. 

| Component / Method | Action Taken | Migration Path / Replacement |
| :--- | :--- | :--- |
| `SetCollectionValidator` | Deprecated and replaced | Use `RuleForEach(x => x.AddressLines).SetValidator(new AddressLineValidator())` |
| `Custom` / `CustomAsync` | Removed | Use `RuleFor(x => x).Custom()` instead |
| `RemoveRule`, `ReplaceRule`, `ClearRules` | Removed | No replacement; runtime modification of rules is unsupported |
| `WithLocalizedName`, `WithLocalizedMessage` | Removed | Use updated localization mechanisms |
| `CustomStateProvider`, `Severity`, `ErrorMessageSource`, `ErrorCodeSource` | Removed from `PropertyValidator` | Access via the `Options` property on `PropertyValidator` |

Sources: [docs/upgrading-to-8.md#L13-L25](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L13-L25), [docs/upgrading-to-8.md#L31-L37](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L31-L37), [docs/upgrading-to-8.md#L64-L71](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L64-L71)

### Package Reorganizations and Ruleset Scoping

The `ValidatorAttribute` and `AttributedValidatorFactory` have been extracted into a separate `FluentValidation.ValidatorAttribute` package. Framework integrations handle attribute wiring differently depending on project type: ASP.NET Core projects rely on the built-in service provider, desktop and mobile applications recommend IoC containers, and legacy ASP.NET projects (MVC 5 and WebApi 2) automatically install the attribute package for compatibility. Furthermore, child validators configured via `SetValidator` now accept explicit ruleset scoping:

```csharp
RuleFor(x => x.Address).SetValidator(new AddressValidator(), "myRuleset");
```

Sources: [docs/upgrading-to-8.md#L39-L46](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L39-L46), [docs/upgrading-to-8.md#L55-L62](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-8.md#L55-L62)

## Upgrading to Version 9

### Overview

FluentValidation 9.0 is a major release introducing significant framework target updates, breaking API changes, default behavioral adjustments, and the removal of deprecated members. Reviewing these changes ensures a clean upgrade path from version 8.x to 9.

Sources: [docs/upgrading-to-9.md#L3-L6](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L3-L6)

### Framework Target Updates and Platform Support

Support for legacy frameworks and older integration packages has been dropped in version 9. The dropped targets include `netstandard1.1`, `netstandard1.6`, and `net45`. FluentValidation continues to support `netstandard2.0` and `net461`, running on .NET Core 2.0 or higher (3.1 recommended) or .NET Framework 4.6.1 or higher. Additionally, `FluentValidation.AspNetCore` requires .NET Core 2.1 or 3.1. MVC 5 and WebAPI 2 integrations (`FluentValidation.Mvc5` and `FluentValidation.WebApi`) no longer receive updates.

Sources: [docs/upgrading-to-9.md#L7-L19](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L7-L19)

### Breaking API Changes and Removals

Version 9 removes several deprecated types, non-generic overloads, and legacy attributes to enforce stricter type safety and align with ASP.NET Core behaviors.

| Removed or Changed Member | Affected Component | Migration Path / Replacement |
| :--- | :--- | :--- |
| `IValidator.Validate(object model)` | `IValidator` | Use `validator.Validate(new ValidationContext<object>(model))` |
| Non-generic `ValidationContext` | Core Validation | Use `ValidationContext<T>` or `IValidationContext` |
| `SetCollectionValidator` | Validation Rules | Use `RuleForEach` with `SetValidator` |
| `WithLocalizedMessage` | Localization | Use `.WithMessage(x => MyLocalizedMessages.Property)` callback syntax |
| `[Display]` / `[DisplayName]` inference | Property Name Resolution | Register a custom `ValidatorOptions.DisplayNameResolver` during startup |
| `Instance` | `PropertyValidatorContext` | Use `InstanceToValidate` instead |

Sources: [docs/upgrading-to-9.md#L55-L67](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L55-L67), [docs/upgrading-to-9.md#L94-L104](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L94-L104), [docs/upgrading-to-9.md#L115-L128](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L115-L128), [docs/upgrading-to-9.md#L132-L146](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L132-L146)

> [!WARNING]
> The non-generic `ValidationContext` and `IValidator.Validate(object model)` overload have been completely removed. Calling validation without a generic context requires wrapping the model in a `ValidationContext<object>`.

Sources: [docs/upgrading-to-9.md#L55-L67](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L55-L67)

### Behavior Updates and Configuration Changes

Several internal validators and helper behaviors have been revised for consistency. The default email validation mode now uses the ASP.NET Core-compatible validator checking for an `@` character, replacing the previous `Net4xRegex` default. String comparisons for `Equal` and `NotEqual` now perform ordinal string comparisons instead of culture-specific checks. Furthermore, severity assignment now supports dynamic callbacks (`WithSeverity(x => Severity.Warning)`), and the `ScalePrecision` validator algorithm has been updated to match SQL Server by checking digits to the left of the decimal point.

Sources: [docs/upgrading-to-9.md#L20-L29](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L20-L29), [docs/upgrading-to-9.md#L49-L53](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L49-L53), [docs/upgrading-to-9.md#L72-L89](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-9.md#L72-L89)

## Upgrading to Version 10

### Overview

FluentValidation 10.0 is a major release focused on improving performance and type safety through the introduction of generics across the internal model. While the public-facing fluent interface and API remain largely unaffected for standard usage, developers utilizing custom property validators, internal APIs, or specific integration overloads must make targeted updates.

Sources: [docs/upgrading-to-10.md#L3-L8](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L3-L8)

### Property Validator and Metadata Changes

The deprecated `PropertyValidatorContext` class has been replaced by `ValidationContext<T>`, eliminating the need to access `context.ParentContext` when retrieving root context data. Additionally, property validators and their configurations have been decoupled: the validator itself implements `IPropertyValidator<T,TProperty>` or `IAsyncPropertyValidator<T,TProperty>`, while configuration details are exposed via `RuleComponent`. 

| Affected Method or Property | Old Type / Behavior | New Type / Behavior |
| :--- | :--- | :--- |
| `ValidationResult.Errors` | `IList<ValidationFailure>` | `List<ValidationFailure>` |
| `IValidatorDescriptor.GetMembersWithValidators` | Returns `IPropertyValidator` | Returns `(IPropertyValidator Validator, IRuleComponent Options)` |
| `IValidatorDescriptor.GetValidatorsForMember` | Returns `IPropertyValidator` | Returns `(IPropertyValidator Validator, IRuleComponent Options)` |
| Rule validator iteration | `rule.Validators` | `rule.Componetnts` via `component.Validator` |
| Rule current validator | `rule.CurrentValidator` | `rule.Current` via `component.CurrentValidator` |

Sources: [docs/upgrading-to-10.md#L9-L11](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L9-L11), [docs/upgrading-to-10.md#L68-L110](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L68-L110)

> [!WARNING]
> Accessing property validators directly from a rule instance now requires iterating through `rule.Componetnts` to obtain the `IRuleComponent`, from which the `Validator` can be retrieved. Direct access via `rule.Validators` or `rule.CurrentValidator` has changed.

Sources: [docs/upgrading-to-10.md#L81-L110](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L81-L110)

### Custom Validators and Interceptor Updates

Custom property validators must now inherit from the generic classes `PropertyValidator<T,TProperty>` or `AsyncPropertyValidator<T,TProperty>`. Non-generic `PropertyValidator` classes generate deprecation warnings and are scheduled for complete removal in version 11, while `AsyncValidatorBase` classes require immediate migration. Furthermore, dependency injection registrations in ASP.NET integration now default validators to `Scoped` rather than `Transient`. Interceptor interfaces `IValidatorInterceptor` and `IActionContextValidatorInterceptor` have been combined into `IValidatorInterceptor`, accepting an `ActionContext` instead of a `ControllerContext`.

Sources: [docs/upgrading-to-10.md#L28-L37](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L28-L37), [docs/upgrading-to-10.md#L116-L124](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L116-L124)

### Removal of Obsolete Members and Overloads

Version 10 removes several deprecated classes, interfaces, and helper methods, including string source generators (`IStringSource`, `LazyStringSource`, `LanguageStringSource`, `StaticStringSource`), `Language`, `ICommonContext`, `ValidationFailure.FormattedMessageArguments`, `MessageFormatter.AppendAdditionalArguments`, `MemberNameValidatorSelector.FromExpressions`, and internal utility methods like `CoerceToNonGeneric`. Specific validation method overloads have also been replaced by builder configuration delegates.

| Removed Member / Overload | Replacement Pattern |
| :--- | :--- |
| `validator.Validate(instance, x => x.SomeProperty)` | `validator.Validate(instance, v => v.IncludeProperties(x => x.SomeProperty))` |
| `validator.Validate(instance, "SomeProperty")` | `validator.Validate(instance, v => v.IncludeProperties("SomeProperty"))` |
| `validator.Validate(instance, ruleSet: "Set1,Set2")` | `validator.Validate(instance, v => v.IncludeRuleSets("Set1", "Set2"))` |

Sources: [docs/upgrading-to-10.md#L201-L252](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L201-L252)

> [!NOTE]
> The internal API classes `RuleBuilder`, `PropertyRule`, `CollectionPropertyRule`, and `IncludeRule` are now marked `internal`. Use public metadata interfaces such as `IValidationRule`, `IValidationRule<T>`, `IValidationRule<T,TProperty>`, `ICollectionRule<T, TElement>`, and `IIncludeRule` to query rule structures instead.

Sources: [docs/upgrading-to-10.md#L180-L196](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-10.md#L180-L196)

## Upgrading to Version 11

### Overview

FluentValidation 11.0 introduces significant changes to ASP.NET integration configuration and internal APIs, most notably removing deprecated configuration properties and updating integration behaviors.

Sources: [docs/upgrading-to-11.md#L122-L125](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L122-L125)

### ASP.NET Core Integration Changes

The deprecated configuration property `RunDefaultMvcValidationAfterFluentValidationExecutes` has been removed entirely. Developers migrating from earlier versions must switch to using `DisableDataAnnotationsValidation`, noting that the boolean logic of this new property is the exact inverse of its predecessor.

```csharp
// Before:
services.AddFluentValidation(fv => {
  fv.RunDefaultMvcValidationAfterFluentValidationExecutes = false;
});

// After:
services.AddFluentValidation(fv => {
  fv.DisableDataAnnotationsValidation = true;
});
```

Sources: [docs/upgrading-to-11.md#L122-L139](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L122-L139)

> [!WARNING]
> `DisableDataAnnotationsValidation` has an inverse meaning compared to the removed `RunDefaultMvcValidationAfterFluentValidationExecutes` property. Setting it to `true` disables default data annotations validation after FluentValidation runs.

Sources: [docs/upgrading-to-11.md#L125-L139](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L125-L139)

### Internal API and Type Revisions

Version 11 refines several internal and public interfaces to properly support covariance and contravariance, standardizing method signatures and property accessibility across rule components and message builders.

| Member / Property | Previous Type / Behavior | New Type / Behavior |
| :--- | :--- | :--- |
| `IValidationRule<T,TProperty>.Current` | Returns `RuleComponent<T,TProperty>` | Returns `IRuleComponent<T,TProperty>` |
| `IValidationRule<T,TProperty>.CurrentValidator` | Has getter and setter | Removed (use `Current` instead) |
| `IValidationRule<T,TProperty>.MessageBuilder` argument | `MessageBuilderContext<T,TProperty>` class | `IMessageBuilderContext<T,TProperty>` interface |
| `IValidationRule<T,TProperty>.MessageBuilder` accessibility | Has getter and setter | Set-only (single message builder per rule chain) |
| `IRuleComponent<T,TProperty>.CustomStateProvider` | Has getter and setter | Set-only |
| `IRuleComponent<T,TProperty>.SeverityProvider` | Has getter and setter | Set-only |
| `GetErrorMessage` | Exposed on `IRuleComponent<T,TProperty>` | Removed |
| `RuleComponent.Options` | Present | Removed |
| `MemberAccessor` | Present | Removed |

Sources: [docs/upgrading-to-11.md#L145-L157](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L145-L157)

## Upgrading to Version 12

### Overview

FluentValidation 12.0 is a major release featuring the removal of obsolete platforms, deprecated methods, and legacy APIs. .NET 8 is now the minimum supported runtime version, requiring upgrades from older .NET SDKs prior to adoption.

Sources: [docs/upgrading-to-12.md#L3-L20](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L3-L20)

### Framework Compatibility Changes

Support for several end-of-life frameworks and platform targets has been completely dropped. Applications must target .NET 8 or newer to compile against version 12 libraries.

| Platform / Target | Support Status in v12 | Notes / Replacement |
| :--- | :--- | :--- |
| .NET Core 3.1 | Removed | Microsoft support ended December 2022 |
| .NET 5 | Removed | Microsoft support ended November 2022 |
| .NET 6 | Removed | Microsoft support ended November 2024 |
| .NET 7 | Removed | Microsoft support ended November 2024 |
| .NET Standard 2.0 / 2.1 | Removed | Remain on FluentValidation 11.x if required |
| .NET 8+ | Supported | Minimum required runtime version |

Sources: [docs/upgrading-to-12.md#L9-L21](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L9-L21)

> [!CAUTION]
> .NET Standard 2.0 and 2.1 compatibility has been dropped. Projects requiring .NET Standard 2.0 must stay on FluentValidation 11.x until upgrading to .NET 8 or higher.

Sources: [docs/upgrading-to-12.md#L17-L21](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L17-L21)

### Modernizing Deprecated APIs and Cascade Modes

The `Transform` and `TransformForEach` methods deprecated in 11.x are now removed; developers should utilize computed model properties instead. Additionally, `CascadeMode.StopOnFirstFailure` along with `AbstractValidator.CascadeMode` and `ValidatorOptions.Global.CascadeMode` have been removed in favor of separate class-level and rule-level cascade configurations.

To migrate global or class-level cascade configurations, assign default modes independently:

```csharp
ValidatorOptions.Global.DefaultClassLevelCascadeMode = CascadeMode.Continue;
ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;
```

Sources: [docs/upgrading-to-12.md#L23-L42](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L23-L42)

> [!WARNING]
> When replacing `CascadeMode.StopOnFirstFailure` in rule chains, substitute `Stop` in place of `StopOnFirstFailure`.

Sources: [docs/upgrading-to-12.md#L58-L59](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L58-L59)

### Removal of Implicit Injection and Root Null Checks

Implicit child validator resolution via `.InjectValidator()` has been removed. Traditional constructor injection should be used instead to pass typed validators explicitly into validator constructors. Furthermore, overriding `AbstractValidator.EnsureInstanceNotNull` to disable root-model null checks is no longer supported.

```csharp
public class PersonValidator : AbstractValidator<Person> 
{
  public PersonValidator(IValidator<Address> addressValidator) 
  {
    RuleFor(x => x.Address).SetValidator(addressValidator);
  }
}
```

Sources: [docs/upgrading-to-12.md#L60-L93](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L60-L93)

## Related

- [[Quick Start]]

