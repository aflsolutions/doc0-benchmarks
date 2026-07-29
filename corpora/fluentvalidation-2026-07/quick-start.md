# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs)
- [docs/start.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md)
- [src/FluentValidation.Tests/CascadingFailuresTester.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/CascadingFailuresTester.cs)
- [src/FluentValidation/AbstractValidator.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs)
- [src/FluentValidation.Tests/CustomValidatorTester.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/CustomValidatorTester.cs)
- [src/FluentValidation/Internal/RuleComponent.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Internal/RuleComponent.cs)
- [src/FluentValidation/DefaultValidatorExtensions_Validate.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/DefaultValidatorExtensions_Validate.cs)
- [src/FluentValidation/IValidator.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/IValidator.cs)
- [src/FluentValidation.Tests/ComplexValidationTester.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/ComplexValidationTester.cs)
- [src/FluentValidation/Internal/IncludeRule.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Internal/IncludeRule.cs)
- [src/FluentValidation/Validators/IPropertyValidator.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Validators/IPropertyValidator.cs)
- [src/FluentValidation.Tests/ValidateAndThrowTester.cs](https://github.com/FluentValidation/FluentValidation.Tests/ValidateAndThrowTester.cs)
- [src/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs)
- [docs/async.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md)
- [src/FluentValidation.Tests/ValidatorTesterTester.cs](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs)
- [src/FluentValidation.Tests/AbstractValidatorTester.cs](https://github.com/FluentValidation.Tests/AbstractValidatorTester.cs)
- [src/FluentValidation.Tests/DefaultValidatorExtensionTester.cs](https://github.com/FluentValidation.Tests/DefaultValidatorExtensionTester.cs)
- [docs/aspnet.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/aspnet.md)
- [src/FluentValidation/Validators/AsyncPropertyValidator.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Validators/AsyncPropertyValidator.cs)
</details>

## Overview

FluentValidation is a robust .NET library designed to build strongly-typed validation rules for your classes and domain models using a fluent interface. By defining validation logic within dedicated classes inheriting from `AbstractValidator<T>`, you can cleanly separate validation concerns from your core business logic while maintaining high readability and expressiveness.

Sources: [docs/start.md:1-26](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md#L1-L26)

The library provides comprehensive support for both synchronous and asynchronous rule execution, conditional validation, complex nested object hierarchies, and rich error handling capabilities. Developers can seamlessly test their rule implementations using specialized unit testing extensions, ensuring correctness across both sync and async execution pipelines.

Sources: [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:34-121](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L34-L121), [docs/start.md:144-192](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md#L144-L192), [docs/async.md:1-30](https://github.com/FluentValidation/FluentValidation/blob/main/docs/async.md#L1-L30)

## Validator Definition and Rule Setup

### Overview

To define a set of validation rules for a particular object, you create a class that inherits from `AbstractValidator<T>`, where `T` is the type of class that you wish to validate. Validation rules themselves should be defined within the validator class's constructor. To specify a validation rule for a particular property, call the `RuleFor` method, passing a lambda expression that indicates the property you wish to validate.

Sources: [docs/start.md:1-44](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md#L1-L44), [src/FluentValidation/AbstractValidator.cs:32-37](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L32-L37), [src/FluentValidation/AbstractValidator.cs:210-216](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L210-L216)

### Rule Building and Chaining

When `RuleFor` is invoked, it creates a property rule via `PropertyRule<T, TProperty>.Create(expression, () => RuleLevelCascadeMode)`, adds it to the internal rules collection, triggers `OnRuleAdded(rule)`, and returns a `RuleBuilder<T, TProperty>` instance. For collections, `RuleForEach` creates a `CollectionPropertyRule<T, TElement>`. You can chain multiple validators together for the same property, such as combining `NotNull()` and `NotEqual("foo")` on a single property rule chain.

Sources: [src/FluentValidation/AbstractValidator.cs:37](https://github.com/FluentValidation/AbstractValidator.cs#L37), [src/FluentValidation/AbstractValidator.cs:210-230](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L210-L230), [src/FluentValidation/AbstractValidator.cs:393-397](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L393-L397), [docs/start.md:88-104](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md#L88-L104)

> [!TIP]
> Use `RuleForEach` when validating properties that implement `IEnumerable<TElement>`, ensuring that each element in the collection is evaluated against the subsequent validator chain.
> Sources: [src/FluentValidation/AbstractValidator.cs:224-230](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L224-L230), [src/FluentValidation.Tests/AbstractValidatorTester.cs:240-249](https://github.com/FluentValidation.Tests/AbstractValidatorTester.cs#L240-L249)

### Property Validation Methods

The `RuleBuilder` exposes a wide range of extension methods that instantiate underlying property validator objects. Each method corresponds to specific rule types and validation conditions.

| Extension Method | Created Validator Type | Description |
| :--- | :--- | :--- |
| `NotNull()` | `NotNullValidator<T, TProperty>` | Ensures the property value is not null. |
| `NotEmpty()` | `NotEmptyValidator<T, TProperty>` | Ensures the property value is not null, empty, or whitespace. |
| `Empty()` | `EmptyValidator<T, TProperty>` | Ensures the property value is null, empty, or default. |
| `Length(min, max)` | `LengthValidator<T>` | Validates string length within specified bounds. |
| `Length(exact)` | `ExactLengthValidator<T>` | Validates string length equals an exact value. |
| `MaximumLength(max)` | `MaximumLengthValidator<T>` | Validates maximum string length. |
| `MinimumLength(min)` | `MinimumLengthValidator<T>` | Validates minimum string length. |
| `Equal(value)` / `Equal(x => ...)` | `EqualValidator<T, TProperty>` | Ensures property equals a specified value or other property. |
| `NotEqual(value)` / `NotEqual(x => ...)` | `NotEqualValidator<T, TProperty>` | Ensures property does not equal a specified value or other property. |
| `Must(predicate)` | `PredicateValidator<T, TProperty>` | Validates property using a custom predicate function. |
| `MustAsync(predicate)` | `AsyncPredicateValidator<T, TProperty>` | Validates property asynchronously using a custom predicate function. |
| `LessThan(value)` | `LessThanValidator<T, TProperty>` | Ensures property is less than a value or property. |
| `LessThanOrEqualTo(value)` | `LessThanOrEqualValidator<T, TProperty>` | Ensures property is less than or equal to a value or property. |
| `GreaterThan(value)` | `GreaterThanValidator<T, TProperty>` | Ensures property is greater than a value or property. |
| `GreaterThanOrEqualTo(value)` | `GreaterThanOrEqualValidator<T, TProperty>` | Ensures property is greater than or equal to a value or property. |
| `PrecisionScale(scale, precision, ignore)` | `PrecisionScaleValidator<T>` | Validates decimal scale and precision. |

Sources: [src/FluentValidation.Tests/DefaultValidatorExtensionTester.cs:38-225](https://github.com/FluentValidation.Tests/DefaultValidatorExtensionTester.cs#L38-L225)

## Synchronous and Asynchronous Execution Options

### Overview

FluentValidation supports executing validation either synchronously via `Validate` or asynchronously via `ValidateAsync`. The execution flow is driven by the methods exposed on both the `IValidator<T>` interface and the `AbstractValidator<T>` base class, complemented by extension methods in `DefaultValidatorExtensions`.

Sources: [src/FluentValidation/AbstractValidator.cs:98-108](https://github.com/FluentValidation/AbstractValidator.cs#L98-L108), [src/FluentValidation/IValidator.cs:36-44](https://github.com/FluentValidation/IValidator.cs#L36-L44), [src/FluentValidation/DefaultValidatorExtensions_Validate.cs:37-50](https://github.com/FluentValidation/DefaultValidatorExtensions_Validate.cs#L37-L50)

### Execution Methods and Overloads

Validators can be invoked by passing the instance directly, supplying a custom `ValidationContext<T>`, or using options callbacks to configure behavior such as rule sets or failure throwing.

| Method Signature | Return Type | Description |
| :--- | :--- | :--- |
| `Validate(T instance)` | `ValidationResult` | Synchronously validates an instance using a default validator selector. |
| `Validate(ValidationContext<T> context)` | `ValidationResult` | Synchronously validates an instance using an explicit validation context. |
| `Validate(T instance, Action<ValidationStrategy<T>> options)` | `ValidationResult` | Synchronously validates an instance with inline configuration options. |
| `ValidateAsync(T instance, CancellationToken cancellation)` | `Task<ValidationResult>` | Asynchronously validates an instance. |
| `ValidateAsync(ValidationContext<T> context, CancellationToken cancellation)` | `Task<ValidationResult>` | Asynchronously validates an instance using an explicit validation context. |
| `ValidateAsync(T instance, Action<ValidationStrategy<T>> options, CancellationToken cancellation)` | `Task<ValidationResult>` | Asynchronously validates an instance with inline configuration options. |

Sources: [src/FluentValidation/AbstractValidator.cs:98-138](https://github.com/FluentValidation/AbstractValidator.cs#L98-L138), [src/FluentValidation/DefaultValidatorExtensions_Validate.cs:37-50](https://github.com/FluentValidation/DefaultValidatorExtensions_Validate.cs#L37-L50)

### Validation Execution Flow

When execution begins, the validation pipeline follows a precise sequence through `AbstractValidator<T>` and its internal helper routines.

1. **Context Initialization**: Non-generic `IValidator` calls (`Validate(IValidationContext)` and `ValidateAsync(IValidationContext, CancellationToken)`) wrap or convert the context via `ValidationContext<T>.GetFromNonGenericContext(context)`.
Sources: [src/FluentValidation/AbstractValidator.cs:83-91](https://github.com/FluentValidation/AbstractValidator.cs#L83-L91)

2. **Pre-Validation**: `ValidateAsync` (and its synchronous counterpart generated via `CreateSyncVersion`) sets `context.IsAsync = true` (for asynchronous execution) and invokes `PreValidate(context, result)`. If `PreValidate` returns `false`, execution halts immediately.
Sources: [src/FluentValidation/AbstractValidator.cs:134-143](https://github.com/FluentValidation/AbstractValidator.cs#L134-L143), [src/FluentValidation/AbstractValidator.cs:380](https://github.com/FluentValidation/AbstractValidator.cs#L380)

3. **Null Check**: The root model `context.InstanceToValidate` is checked; if it is `null`, an `InvalidOperationException` is thrown ("Cannot pass a null model to Validate/ValidateAsync. The root model must be non-null.").
Sources: [src/FluentValidation/AbstractValidator.cs:153-155](https://github.com/FluentValidation/AbstractValidator.cs#L153-L155)

4. **Rule Iteration**: The engine iterates through the registered rules collection (`Rules`) using a performance-optimized `for` loop rather than `foreach` to minimize allocations.
Sources: [src/FluentValidation/AbstractValidator.cs:157-160](https://github.com/FluentValidation/AbstractValidator.cs#L157-L160)

5. **Cancellation & Cascade Evaluation**: Inside the loop, `cancellation.ThrowIfCancellationRequested()` is evaluated. Each rule's asynchronous validation (`await Rules[i].ValidateAsync(context, cancellation)`) is executed. If `ClassLevelCascadeMode == CascadeMode.Stop` and the error count increases during that rule evaluation, execution breaks out of the loop early.
Sources: [src/FluentValidation/AbstractValidator.cs:161-170](https://github.com/FluentValidation/AbstractValidator.cs#L161-L170)

6. **Finalization**: Executed rule sets are recorded via `SetExecutedRuleSets(result, context)`. If validation failed and `context.ThrowOnFailures` is enabled, `RaiseValidationException(context, result)` throws a `ValidationException`. Finally, the `ValidationResult` is returned.
Sources: [src/FluentValidation/AbstractValidator.cs:173-179](https://github.com/FluentValidation/AbstractValidator.cs#L173-L179), [src/FluentValidation/AbstractValidator.cs:182-189](https://github.com/FluentValidation/AbstractValidator.cs#L182-L189)

> [!WARNING]
> Passing a null root model to `Validate` or `ValidateAsync` throws an `InvalidOperationException` rather than returning a validation failure.
> Sources: [src/FluentValidation/AbstractValidator.cs:153-155](https://github.com/FluentValidation/AbstractValidator.cs#L153-L155)

## Synchronous Runtime Execution Exception Safeguards

### Overview

When a rule is defined with asynchronous components such as `MustAsync` or `CustomAsync`, it registers an `IAsyncPropertyValidator<T, TProperty>` within its `RuleComponent<T, TProperty>`. If the validator is subsequently executed via the synchronous `Validate()` method rather than `ValidateAsync()`, the library prevents silent failures or blocking deadlocks by throwing an `AsyncValidatorInvokedSynchronouslyException`.

Sources: [src/FluentValidation/Internal/RuleComponent.cs:33-48](https://github.com/FluentValidation/Internal/RuleComponent.cs#L33-L48), [src/FluentValidation/Internal/RuleComponent.cs:79-89](https://github.com/FluentValidation/Internal/RuleComponent.cs#L79-L89)

### Execution Guard Mechanics

The guard check resides inside `RuleComponent<T, TProperty>.Validate()`. The method inspects whether the underlying property validator supports synchronous execution (`SupportsSynchronousValidation`).

```csharp
internal bool Validate(ValidationContext<T> context, TProperty value) {
    if (SupportsSynchronousValidation) {
        return InvokePropertyValidator(context, value);
    }

    throw new AsyncValidatorInvokedSynchronouslyException();
}
```

Sources: [src/FluentValidation/Internal/RuleComponent.cs:79-89](https://github.com/FluentValidation/Internal/RuleComponent.cs#L79-L89)

> [!WARNING]
> Calling `Validate()` on a validator containing asynchronous rules triggers an `AsyncValidatorInvokedSynchronouslyException`. Always invoke validators containing async rules using `ValidateAsync()`.
> Sources: [src/FluentValidation/Internal/RuleComponent.cs:86-89](https://github.com/FluentValidation/Internal/RuleComponent.cs#L86-L89), [docs/async.md:38-42](https://github.com/FluentValidation/docs/async.md#L38-L42)

### Exception Properties and Message Construction

`AsyncValidatorInvokedSynchronouslyException` inherits from `InvalidOperationException` and exposes a `ValidatorType` property alongside internal constructors that tailor the error message depending on whether the invocation originated from ASP.NET's automatic validation pipeline or direct code calls.

| Constructor / Member | Type / Signature | Description |
| :--- | :--- | :--- |
| `ValidatorType` | `Type` (get) | Exposes the specific validator type that caused the exception. |
| `AsyncValidatorInvokedSynchronouslyException()` | Parameterless | Internal default constructor. |
| `AsyncValidatorInvokedSynchronouslyException(Type validatorType, bool wasInvokedByAspNet)` | Internal ctor | Builds an error message tailored for ASP.NET integration or direct synchronous calls. |
| `AsyncValidatorInvokedSynchronouslyException(string message)` | Internal ctor | Initializes the exception with a custom error string. |

Sources: [src/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs:26-39](https://github.com/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs#L26-L39)

The static message builder differentiates between direct code invocation and ASP.NET MVC automatic validation integration:

```csharp
private static string BuildMessage(Type validatorType, bool wasInvokedByMvc) {
    if (wasInvokedByMvc) {
        return $"Validator \"{validatorType.Name}\" can't be used with ASP.NET automatic validation as it contains asynchronous rules. ASP.NET's validation pipeline is not asynchronous and can't invoke asynchronous rules. Remove the asynchronous rules in order for this validator to run.";
    }

    return $"Validator \"{validatorType.Name}\" contains asynchronous rules but was invoked synchronously. Please call ValidateAsync rather than Validate.";
}
```

Sources: [src/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs:40-46](https://github.com/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs#L40-L46)

> [!NOTE]
> ASP.NET's built-in automatic validation pipeline executes synchronously. Attempting to use asynchronous rules within an automatic validation context will fail because the pipeline cannot await asynchronous rules.
> Sources: [src/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs:41-43](https://github.com/FluentValidation/AsyncValidatorInvokedSynchronouslyException.cs#L41-L43), [docs/async.md:41](https://github.com/FluentValidation/docs/async.md#L41)

## Validation Failure Exceptions and Handling

### Overview

FluentValidation provides extension methods that combine execution and exception-throwing behavior into single calls: `ValidateAndThrow` and `ValidateAndThrowAsync`. These methods act as convenience shortcuts that invoke standard validation and automatically throw a `ValidationException` when validation fails.

Sources: [src/FluentValidation/DefaultValidatorExtensions_Validate.cs:52-75](https://github.com/FluentValidation/DefaultValidatorExtensions_Validate.cs#L52-L75)

### Execution and Shortcut Flow

`ValidateAndThrow` and `ValidateAndThrowAsync` wrap the underlying validation call by supplying a strategy callback configured with `ThrowOnFailures()`.

```csharp
public static void ValidateAndThrow<T>(this IValidator<T> validator, T instance) {
    validator.Validate(instance, options => {
        options.ThrowOnFailures();
    });
}

public static async Task ValidateAndThrowAsync<T>(this IValidator<T> validator, T instance, CancellationToken cancellationToken = default) {
    await validator.ValidateAsync(instance, options => {
        options.ThrowOnFailures();
    }, cancellationToken);
}
```

Sources: [src/FluentValidation/DefaultValidatorExtensions_Validate.cs:58-75](https://github.com/FluentValidation/DefaultValidatorExtensions_Validate.cs#L58-L75)

> [!TIP]
> `ValidateAndThrow` is directly equivalent to calling `validator.Validate(instance, options => options.ThrowOnFailures())`.
> Sources: [src/FluentValidation/DefaultValidatorExtensions_Validate.cs:53-54](https://github.com/FluentValidation/DefaultValidatorExtensions_Validate.cs#L53-L54)

### ValidationException Handling and Serialization

When validation fails under `ValidateAndThrow`, the thrown `ValidationException` populates an `Errors` collection containing `ValidationFailure` instances. The exception supports JSON serialization and customizable messages.

| Constructor / Member | Signature / Type | Description |
| :--- | :--- | :--- |
| `Errors` | `IEnumerable<ValidationFailure>` (get) | Holds the collection of validation failures collected during execution. |
| `ValidationException(IEnumerable<ValidationFailure> errors)` | Public ctor | Initializes the exception with a collection of validation failures. |
| `ValidationException(string message, IEnumerable<ValidationFailure> errors, bool appendDefaultMessage)` | Public ctor | Configures the exception message with an optional user message prefix and default message formatting. |

Sources: [src/FluentValidation.Tests/ValidateAndThrowTester.cs:137-143](https://github.com/FluentValidation.Tests/ValidateAndThrowTester.cs#L137-L143), [src/FluentValidation.Tests/ValidateAndThrowTester.cs:146-162](https://github.com/FluentValidation.Tests/ValidateAndThrowTester.cs#L146-L162)

> [!WARNING]
> When validating object graphs containing child validators via `.SetValidator()`, only the root validator instance throws `ValidationException`. Child failures are collected and bubbled up to the root result.
> Sources: [src/FluentValidation.Tests/ValidateAndThrowTester.cs:165-186](https://github.com/FluentValidation.Tests/ValidateAndThrowTester.cs#L165-L186)

## Complex Object and Child Validation

### Overview

Validating complex properties and nested child objects is achieved by pairing property rules with the `.SetValidator()` extension method or via composition rules like `IncludeRule`. FluentValidation inspects nested structures synchronously or asynchronously, bubbling child failures up to the parent result with correct dot-notation property names.

Sources: [src/FluentValidation.Tests/ComplexValidationTester.cs:48-56](https://github.com/FluentValidation.Tests/ComplexValidationTester.cs#L48-L56), [src/Internal/IncludeRule.cs:16-38](https://github.com/FluentValidation/Internal/IncludeRule.cs#L16-L38)

### Nested Object Validation and Property Pathing

When a parent validator defines a rule pointing to a complex property using `.SetValidator()`, child validation errors are prefixed with the parent property name (e.g., `"Address.Postcode"` or `"Address.Country.Name"`). If the nested property value is `null`, the child validator is skipped automatically rather than throwing a null-reference exception.

```csharp
public class PersonValidator : InlineValidator<Person> {
    public PersonValidator() {
        RuleFor(x => x.Forename).NotNull();
        RuleFor(x => x.Address).SetValidator(new AddressValidator());
    }
}

public class AddressValidator : AbstractValidator<Address> {
    public AddressValidator() {
        RuleFor(x => x.Postcode).NotNull();
        RuleFor(x => x.Country).SetValidator(new CountryValidator());
    }
}
```

Sources: [src/FluentValidation.Tests/ComplexValidationTester.cs:71-74](https://github.com/FluentValidation.Tests/ComplexValidationTester.cs#L71-L74), [src/FluentValidation.Tests/ComplexValidationTester.cs:248-266](https://github.com/FluentValidation.Tests/ComplexValidationTester.cs#L248-L266)

> [!NOTE]
> Complex child validators are skipped when the target child property evaluates to `null`. However, normal rules (such as `.NotNull()`) chained directly on the same property execute independently.
> Sources: [src/FluentValidation.Tests/ComplexValidationTester.cs:71-81](https://github.com/FluentValidation.Tests/ComplexValidationTester.cs#L71-L81)

### Include Rules and Property Inclusion Propagation

The `IncludeRule` class enables composition by incorporating rules from another validator inline into the current validator as if they were defined directly. During execution of `IncludeRule.ValidateAsync()`, the engine manages validator selectors by toggling `MemberNameValidatorSelector.DisableCascadeKey` in `RootContextData` to ensure cascade behavior treats nested rules as direct descendants.

```csharp
internal partial class IncludeRule<T> : PropertyRule<T, T>, IIncludeRule {
    public IncludeRule(IValidator<T> validator, Func<CascadeMode> cascadeModeThunk, Type typeToValidate)
        : base(null, x => x, null, cascadeModeThunk, typeToValidate) {
        var adaptor = new ChildValidatorAdaptor<T, T>(validator, validator.GetType());
        AddAsyncValidator(adaptor, adaptor);
    }
}
```

Sources: [src/FluentValidation/Internal/IncludeRule.cs:16-27](https://github.com/FluentValidation/Internal/IncludeRule.cs#L16-L27), [src/FluentValidation/Internal/IncludeRule.cs:56-75](https://github.com/FluentValidation/Internal/IncludeRule.cs#L56-L75)

> [!WARNING]
> Explicitly included properties via `IncludeProperties()` propagate down to nested child validators, filtering evaluated properties across the entire object hierarchy.
> Sources: [src/FluentValidation.Tests/ComplexValidationTester.cs:84-97](https://github.com/FluentValidation.Tests/ComplexValidationTester.cs#L84-L97)

### Property Validator Interfaces

FluentValidation defines core interfaces for property and asynchronous property validation, supporting both synchronous and asynchronous implementations.

| Interface | Method Signature | Purpose |
| :--- | :--- | :--- |
| `IPropertyValidator` | `string GetDefaultMessageTemplate(string errorCode)` | Base marker interface defining validator name and default error message retrieval. |
| `IPropertyValidator<T, in TProperty>` | `bool IsValid(ValidationContext<T> context, TProperty value)` | Validates a specific property value synchronously within a given context. |
| `IAsyncPropertyValidator<T, in TProperty>` | `Task<bool> IsValidAsync(ValidationContext<T> context, TProperty value, CancellationToken cancellation)` | Validates a specific property value asynchronously with cancellation support. |

Sources: [src/FluentValidation/Validators/IPropertyValidator.cs:24-64](https://github.com/FluentValidation/Validators/IPropertyValidator.cs#L24-L64)

## Unit Testing Validator Rule Implementations

### Unit Testing Validator Rule Implementations

FluentValidation provides built-in unit testing extensions in the `FluentValidation.TestHelper` namespace that allow you to test your validators thoroughly without manual controller orchestration or mock framework boilerplate. Using extension methods on `IValidator<T>`, you can test validation rules either synchronously via `TestValidate()` or asynchronously via `TestValidateAsync()`, obtaining a `TestValidationResult<T>` object that exposes assertion helpers like `ShouldHaveValidationErrorFor()` and `ShouldNotHaveValidationErrorFor()`.

Sources: [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:86-120](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L86-L120), [src/FluentValidation.Tests/ValidatorTesterTester.cs:41-61](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs#L41-L61)

### Execution Walkthrough and Assertion Continuations

When `TestValidate()` is invoked, the extension method creates a `ValidationContext<T>`, executes `validator.Validate(context)`, and catches any `AsyncValidatorInvokedSynchronouslyException` to rethrow it with a clear diagnostic message directing you to use asynchronous test methods. The resulting `TestValidationResult<T>` enables fluent assertion chains that inspect specific property failures, error codes, severity levels, custom state, and message arguments.

1. **Test Initiation**: `validator.TestValidate(objectToTest, options)` wraps the target object in a `ValidationContext<T>` and calls `validator.Validate(context)`.
2. **Result Wrapping**: The underlying `ValidationResult` is wrapped inside `TestValidationResult<T>`.
3. **Property Targeting**: Calling `ShouldHaveValidationErrorFor(expression)` filters failures matching the specified property member or indexer path.
4. **Continuation Filtering**: Methods such as `WithErrorCode()`, `WithErrorMessage()`, `WithSeverity()`, and `WithCustomState()` apply predicates via `When()` or `WhenAll()` to ensure exact match criteria.
5. **Strict Boundary Control**: Calling `Only()` on the continuation verifies that no unexpected validation errors remain across any other properties.

Sources: [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:86-104](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L86-L104), [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:141-232](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L141-L232), [src/FluentValidation.Tests/ValidatorTesterTester.cs:516-522](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs#L516-L522)

### Test Assertion Helpers Reference

| Extension Method | Description |
| :--- | :--- |
| `TestValidate(object, options)` | Executes validation synchronously and returns a `TestValidationResult<T>`. |
| `TestValidateAsync(object, options, ct)` | Executes validation asynchronously, returning a `Task<TestValidationResult<T>>`. |
| `ShouldHaveValidationErrorFor(expression)` | Asserts that a validation failure exists for the given property expression. |
| `ShouldNotHaveValidationErrorFor(expression)` | Asserts that no validation failure exists for the given property expression. |
| `WithErrorCode(expectedCode)` | Narrows matched failures to those matching the expected error code string. |
| `WithErrorMessage(expectedMessage)` | Narrows matched failures to those matching the expected error message string. |
| `WithSeverity(expectedSeverity)` | Narrows matched failures to those matching the expected `Severity` enumeration. |
| `WithCustomState(expectedState, comparer)` | Narrows matched failures to those matching the expected custom state object. |
| `Only()` | Asserts that no unmatched validation failures exist anywhere else in the result. |

Sources: [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:86-120](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L86-L120), [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:170-232](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L170-L232)

> [!WARNING]
> Calling `TestValidate()` on a validator containing asynchronous rules (such as `MustAsync` or `CustomAsync`) will throw an `AsyncValidatorInvokedSynchronouslyException`. You must use `TestValidateAsync()` for asynchronous validators.
> Sources: [src/FluentValidation/TestHelper/ValidatorTestExtensions.cs:96-101](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/TestHelper/ValidatorTestExtensions.cs#L96-L101)

### Full Worked Example of Validator Unit Testing

The following test class demonstrates synchronous and asynchronous rule verification using `TestValidate`, `TestValidateAsync`, child validator verification via `ShouldHaveChildValidator`, and strict error isolation using `.Only()`:

```csharp
public class PersonValidatorTests {
	[Fact]
	public void Should_validate_forename_and_address_child_validator() {
		var validator = new TestValidator();
		validator.RuleFor(x => x.Forename).NotNull();
		validator.RuleFor(x => x.Address).SetValidator(new AddressValidator());

		var person = new Person { Forename = null, Address = new Address() };

		var result = validator.TestValidate(person);

		// Assert specific property failure
		result.ShouldHaveValidationErrorFor(x => x.Forename)
			.WithErrorCode("NotNullValidator");

		// Verify child validator registration directly
		validator.ShouldHaveChildValidator(x => x.Address, typeof(AddressValidator));
	}

	[Fact]
	public async Task Should_validate_async_rules() {
		var validator = new InlineValidator<Person>();
		validator.RuleFor(x => x.Surname).MustAsync((surname, ct) => Task.FromResult(surname == "Smith"));

		var person = new Person { Surname = "Jones" };

		var result = await validator.TestValidateAsync(person);

		result.ShouldHaveValidationErrorFor(x => x.Surname)
			.WithErrorMessage("The specified condition was not met for 'Surname'.")
			.Only();
	}
}
```

Sources: [src/FluentValidation.Tests/ValidatorTesterTester.cs:33-45](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs#L33-L45), [src/FluentValidation.Tests/ValidatorTesterTester.cs:163-166](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs#L163-L166), [src/FluentValidation.Tests/ValidatorTesterTester.cs:834-840](https://github.com/FluentValidation.Tests/ValidatorTesterTester.cs#L834-L840)

## Related

- [[Overview]]
- [[Validator Definition]]

