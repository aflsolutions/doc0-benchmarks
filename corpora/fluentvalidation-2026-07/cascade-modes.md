# Cascade Modes

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/FluentValidation.Tests/CascadingFailuresTester.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/CascadingFailuresTester.cs)
- [docs/cascade.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md)
- [src/FluentValidation/DefaultValidatorOptions.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/DefaultValidatorOptions.cs)
- [src/FluentValidation/AbstractValidator.cs](https://github.com/FluentValidation/AbstractValidator.cs)
- [src/FluentValidation/Internal/RuleBase.cs](https://github.com/FluentValidation/Internal/RuleBase.cs)
- [docs/upgrading-to-11.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md)
- [src/FluentValidation.Tests.Benchmarks/ValidationBenchmark.cs](https://github.com/FluentValidation.Tests.Benchmarks/ValidationBenchmark.cs)
- [src/FluentValidation/Internal/IncludeRule.cs](https://github.com/FluentValidation/Internal/IncludeRule.cs)
- [src/FluentValidation/Internal/MemberNameValidatorSelector.cs](https://github.com/FluentValidation/Internal/MemberNameValidatorSelector.cs)
- [src/FluentValidation/IValidationRule.cs](https://github.com/FluentValidation/IValidationRule.cs)
- [src/FluentValidation.Tests/ChainedValidationTester.cs](https://github.com/FluentValidation.Tests/ChainedValidationTester.cs)
- [src/FluentValidation/Enums.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Enums.cs)
- [src/FluentValidation/ValidatorOptions.cs](https://github.com/FluentValidation/ValidatorOptions.cs)
- [docs/upgrading-to-12.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md)
- [src/FluentValidation.Tests/UserSeverityTester.cs](https://github.com/FluentValidation.Tests/UserSeverityTester.cs)
- [docs/start.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/start.md)
</details>

## Overview

Cascade modes in FluentValidation control how execution flows when a validation rule or validator fails, allowing you to choose between continuing through subsequent checks or short-circuiting immediately. By configuring these modes globally, at the validator class level, or on individual rule chains, you can fine-tune your validation logic for comprehensive error reporting or fail-fast performance.

Sources: [docs/cascade.md:3-4](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L3-L4), [docs/cascade.md:46-49](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L46-L49)

## CascadeMode Enum and Global Configuration

### CascadeMode Enum and Global Configuration

FluentValidation exposes public configuration types that dictate how validation execution cascades upon encountering failures. The primary building blocks consist of the `CascadeMode` enumeration and the global configuration container `ValidatorOptions.Global`.

Sources: [src/FluentValidation/Enums.cs:23-26](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Enums.cs#L23-L26), [src/FluentValidation/ValidatorOptions.cs:140-145](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L140-L145)

The `CascadeMode` enum defines two explicit members that determine whether execution proceeds when a check fails.

| Enum Member | Integer Value | Purpose and Meaning |
| --- | --- | --- |
| `CascadeMode.Continue` | `0` | When a rule or validator fails, execution continues to the next rule or validator. This is the default setting. |
| `CascadeMode.Stop` | `2` | When a rule or validator fails, validation stops for the current rule or validator. (Note: `Stop` is explicitly assigned `2` for backwards compatibility; a prior `StopOnFirstFailure` option used `1` and was removed in version 12.0). |

Sources: [src/FluentValidation/Enums.cs:26-38](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Enums.cs#L26-L38)

To establish application-wide defaults for these cascading behaviors without configuring each validator instance individually, developers can set properties on `ValidatorOptions.Global` (an instance of `ValidatorConfiguration`) during the application startup routine.

```csharp
ValidatorOptions.Global.DefaultClassLevelCascadeMode = CascadeMode.Stop;
ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;
```

Sources: [docs/cascade.md:53-55](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L53-L55), [src/FluentValidation/ValidatorOptions.cs:33-55](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L33-L55), [src/FluentValidation/ValidatorOptions.cs:140-145](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L140-L145)

> [!NOTE]
> `ValidatorConfiguration` initializes both `DefaultClassLevelCascadeMode` and `DefaultRuleLevelCascadeMode` to `CascadeMode.Continue` by default.

Sources: [src/FluentValidation/ValidatorOptions.cs:46-54](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L46-L54)

## Validator and Rule Level Overrides

### Overview

Beyond global defaults, FluentValidation allows finer control by overriding cascade behavior at the validator class level using `AbstractValidator.ClassLevelCascadeMode`, at the rule level using `AbstractValidator.RuleLevelCascadeMode`, or on individual property rule chains via the `.Cascade()` extension method.

Sources: [docs/cascade.md:34-49](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L34-L49), [src/FluentValidation/AbstractValidator.cs:38-81](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L38-L81)

### Validator Class-Level Cascade Settings

The `AbstractValidator<T>` base class maintains internal tracking fields for `_classLevelCascadeMode` and `_ruleLevelCascadeMode`, each defaulting to retrieve the respective global setting from `ValidatorOptions.Global`. 

Sources: [src/FluentValidation/AbstractValidator.cs:37-40](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L37-L40)

```csharp
public abstract partial class AbstractValidator<T> : IValidator<T>, IEnumerable<IValidationRule> {
	internal TrackingCollection<IValidationRuleInternal<T>> Rules { get; } = new();
	private Func<CascadeMode> _classLevelCascadeMode = () => ValidatorOptions.Global.DefaultClassLevelCascadeMode;
	private Func<CascadeMode> _ruleLevelCascadeMode = () => ValidatorOptions.Global.DefaultRuleLevelCascadeMode;

	public CascadeMode ClassLevelCascadeMode {
		get => _classLevelCascadeMode();
		set => _classLevelCascadeMode = () => value;
	}

	public CascadeMode RuleLevelCascadeMode {
		get => _ruleLevelCascadeMode();
		set => _ruleLevelCascadeMode = () => value;
	}
}
```

Sources: [src/FluentValidation/AbstractValidator.cs:36-81](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L36-L81)

Setting `ClassLevelCascadeMode` on an inherited validator class controls the execution flow *in between* separate property rules. When set to `CascadeMode.Stop`, the validation engine evaluates rules iteratively and halts immediately upon detecting that a rule has added one or more new errors to the context failure count.

Sources: [docs/cascade.md:46-49](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L46-L49), [src/FluentValidation/AbstractValidator.cs:160-170](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L160-L170)

### Rule-Level and Fluent Overrides

Setting `RuleLevelCascadeMode` on the validator instance establishes the default cascade behavior *within* each rule chain defined via `RuleFor` or `RuleForEach`. 

Sources: [docs/cascade.md:34-41](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L34-L41), [src/FluentValidation/AbstractValidator.cs:62-81](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L62-L81), [src/FluentValidation/AbstractValidator.cs:210-230](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L210-L230)

When `RuleFor` or `RuleForEach` executes, it instantiates property rules by passing a delegate referencing the validator's `RuleLevelCascadeMode`:

```csharp
public IRuleBuilderInitial<T, TProperty> RuleFor<TProperty>(Expression<Func<T, TProperty>> expression) {
	ArgumentNullException.ThrowIfNull(expression);
	var rule = PropertyRule<T, TProperty>.Create(expression, () => RuleLevelCascadeMode);
	Rules.Add(rule);
	OnRuleAdded(rule);
	return new RuleBuilder<T, TProperty>(rule, this);
}
```

Sources: [src/FluentValidation/AbstractValidator.cs:210-216](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/AbstractValidator.cs#L210-L216)

Furthermore, individual rule chains can override this setting explicitly by invoking the `.Cascade()` extension method on the rule builder:

```csharp
public static IRuleBuilderInitial<T, TProperty> Cascade<T, TProperty>(this IRuleBuilderInitial<T, TProperty> ruleBuilder, CascadeMode cascadeMode) {
	Configurable(ruleBuilder).CascadeMode = cascadeMode;
	return ruleBuilder;
}
```

Sources: [src/FluentValidation/DefaultValidatorOptions.cs:92-96](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/DefaultValidatorOptions.cs#L92-L96), [src/FluentValidation/DefaultValidatorOptions.cs:108-112](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/DefaultValidatorOptions.cs#L108-L112)

> [!TIP]
> Setting `RuleLevelCascadeMode = CascadeMode.Stop` combined with class-level `CascadeMode.Continue` allows your validator to check complex sequential validators within a single property (stopping at the first property failure) while still evaluating all other independent property rules on the model.

Sources: [docs/cascade.md:34-42](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L34-L42), [docs/cascade.md:46-49](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L46-L49)

## Short Circuit Execution Engine

### Overview

The short-circuit execution engine controls the evaluation flow inside rule components through `RuleBase`, determining whether validation proceeds or halts when a rule component fails under `CascadeMode.Stop`.

Sources: [src/FluentValidation/Internal/RuleBase.cs:31-44](https://github.com/FluentValidation/Internal/RuleBase.cs#L31-L44), [src/FluentValidation/Internal/RuleBase.cs:320-343](https://github.com/FluentValidation/Internal/RuleBase.cs#L320-L343)

### Call-Chain Execution Walkthrough

When a validation failure occurs during component execution, the rule pipeline constructs and populates a `ValidationFailure` instance through specific internal steps:

`MessageBuilder` check / `component.GetErrorMessage()` → `new ValidationFailure()` → `failure.FormattedMessagePlaceholderValues` assignment → `ErrorCode` resolution → `Severity` assignment → `CustomStateProvider` invocation → `ValidatorOptions.Global.OnFailureCreated` hook.

Sources: [src/FluentValidation/Internal/RuleBase.cs:320-343](https://github.com/FluentValidation/Internal/RuleBase.cs#L320-L343)

> [!WARNING]
> When executing `IncludeRule`, the engine temporarily injects `DisableCascadeKey` into `context.RootContextData` to prevent member-name selectors from interfering with the cascade behavior of included child rules.

Sources: [src/FluentValidation/Internal/IncludeRule.cs:56-75](https://github.com/FluentValidation/Internal/IncludeRule.cs#L56-L75)

### RuleBase Properties and Methods Reference

| Member Name | Member Type | Description |
| :--- | :--- | :--- |
| `_components` | `List<RuleComponent<T, TValue>>` | Stores validation components assigned to the rule. |
| `CascadeMode` | Property | Gets or sets the cascade mode via a thunk delegate. |
| `PrepareMessageFormatterForValidationError` | Method | Populates property path, display name, property value, and collection index placeholders. |
| `CreateValidationError` | Method | Instantiates and configures a `ValidationFailure` object with error code, severity, and custom state. |

Sources: [src/FluentValidation/Internal/RuleBase.cs:31-44](https://github.com/FluentValidation/Internal/RuleBase.cs#L31-L44), [src/FluentValidation/Internal/RuleBase.cs:116-120](https://github.com/FluentValidation/Internal/RuleBase.cs#L116-L120), [src/FluentValidation/Internal/RuleBase.cs:295-343](https://github.com/FluentValidation/Internal/RuleBase.cs#L295-L343)

## Cascading in Child Rules and Collections

### Overview

Cascading behavior extends across collection-iterating rules defined via `RuleForEach`, rule-composition boundaries handled by `IncludeRule`, and nested validator invocations. When child rules or collections are evaluated under a stop cascade configuration, failure counting logic must account for errors originating from specific elements without prematurely terminating sibling element evaluation.

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:452-477](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L452-L477), [src/FluentValidation/AbstractValidator.cs:343-360](https://github.com/FluentValidation/AbstractValidator.cs#L343-L360), [src/FluentValidation/Internal/IncludeRule.cs:16-75](https://github.com/FluentValidation/Internal/IncludeRule.cs#L16-L75)

### IncludeRule Validation Flow

When an `IncludeRule` is evaluated, it wraps target rules via a `ChildValidatorAdaptor` and executes them within the parent context. To ensure nested include rules inherit correct cascade behavior and prevent member selectors from disrupting child rule execution, the `ValidateAsync` method intercepts the call to manage selector states.

`IncludeRule.ValidateAsync()` → `context.RootContextData.ContainsKey(MemberNameValidatorSelector.DisableCascadeKey)` → `context.RootContextData[MemberNameValidatorSelector.DisableCascadeKey] = true` → `base.ValidateAsync(context, cancellation)` → `context.RootContextData.Remove(MemberNameValidatorSelector.DisableCascadeKey)`

Sources: [src/FluentValidation/Internal/IncludeRule.cs:56-75](https://github.com/FluentValidation/Internal/IncludeRule.cs#L56-L75)

> [!WARNING]
> Only the root `IncludeRule` adds and removes `DisableCascadeKey`. In nested include scenarios, subsequent child include rules find the key already present and leave context data intact.

Sources: [src/FluentValidation/Internal/IncludeRule.cs:60-63](https://github.com/FluentValidation/Internal/IncludeRule.cs#L60-L63)

### Child Rules and RuleForEach Collection Evaluation

When using `RuleForEach` alongside a child validator configured with `ClassLevelCascadeMode = CascadeMode.Stop`, validation iterates across items in the collection (such as `Orders`). 

```csharp
var childValidator = new InlineValidator<Order>();
childValidator.ClassLevelCascadeMode = CascadeMode.Stop;
childValidator.RuleFor(x => x.ProductName).NotNull();
childValidator.RuleFor(x => x.Amount).GreaterThan(0);

var parentValidator = new InlineValidator<Person>();
parentValidator.RuleForEach(x => x.Orders).SetValidator(childValidator);
```

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:455-462](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L455-L462)

> [!NOTE]
> Early implementations suffered from a bug where cascade stops triggered incorrectly if total failures exceeded zero globally across all elements rather than checking failures introduced per item. FluentValidation evaluates failure count deltas per iteration step so that an error in `Orders[0]` halts further rules for `Orders[0]`, but processing still proceeds independently to `Orders[1]`.

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:471-476](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L471-L476)

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:452-477](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L452-L477), [src/FluentValidation/AbstractValidator.cs:343-360](https://github.com/FluentValidation/AbstractValidator.cs#L343-L360), [src/FluentValidation/Internal/IncludeRule.cs:16-75](https://github.com/FluentValidation/Internal/IncludeRule.cs#L16-L75)

## Testing Cascade Behaviors and Scenarios

### Testing Cascade Behaviors and Scenarios

### Overview

The `CascadingFailuresTester` test suite validates the integration of global, class-level, and rule-level cascade configurations across synchronous and asynchronous execution paths. It verifies that settings applied through `ValidatorOptions.Global`, validator instances, and fluent `.Cascade()` overrides interact correctly.

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:28-496](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L28-L496)

### Test Matrix and Override Scenarios

Tests in `CascadingFailuresTester` cover numerous configuration combinations to ensure cascade behavior complies with expected precedence rules. The test suite exercises both `CascadeMode.Continue` and `CascadeMode.Stop` settings across diverse execution scenarios.

| Test Method Name | Global / Instance Configuration | Rule Override | Target Execution | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `Validation_continues_on_failure` | Defaults (`Continue`) | None | Synchronous | 2 failures recorded |
| `Validation_stops_on_first_rule_level_failure` | Both set to `Stop` | None | Synchronous | 1 failure recorded |
| `Validation_stops_on_first_failure_when_globaldefault_both_Continue_and_ruleleveloverride_Stop` | Both set to `Continue` | `Cascade(CascadeMode.Stop)` | Synchronous | 1 failure recorded |
| `Validation_continues_on_failure_when_globaldefault_both_Stop_and_ruleleveloverride_Continue` | Both set to `Stop` | `Cascade(CascadeMode.Continue)` | Synchronous | 2 failures recorded |
| `Validation_stops_on_first_failure_async` | Both set to `Stop` | None | Asynchronous (`MustAsync`) | 1 failure recorded |

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:40-120](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L40-L120), [src/FluentValidation.Tests/CascadingFailuresTester.cs:229-308](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L229-L308)

> [!IMPORTANT]
> Legacy integer values for `CascadeMode` are explicitly verified by tests to ensure backward compatibility. `CascadeMode.Continue` evaluates to integer `0`, while `CascadeMode.Stop` equates to integer `2`, preserving wire and persistence contracts after the removal of the legacy `StopOnFirstFailure` option.

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:480-485](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L480-L485)

### Setup and Fixture Lifecycle

The test class implements `IDisposable` to reset global and instance cascade configurations between test executions, preventing state leakage across test cases.

```csharp
public class CascadingFailuresTester : IDisposable {
	TestValidator _validator;

	public CascadingFailuresTester() {
		SetBothGlobalCascadeModes(CascadeMode.Continue);
		_validator = new TestValidator();
	}

	public void Dispose() {
		SetBothGlobalCascadeModes(CascadeMode.Continue);
	}
    // ...
}
```

Sources: [src/FluentValidation.Tests/CascadingFailuresTester.cs:28-38](https://github.com/FluentValidation.Tests/CascadingFailuresTester.cs#L28-L38)

## Version Upgrades and Deprecation History

### Version Upgrades and Deprecation History

### Overview

FluentValidation's cascade mode system underwent major architectural changes in versions 11.0 and 12.0 to remove API ambiguity and separate rule-level behavior from class-level behavior. In FluentValidation 10.x and older, a single `AbstractValidator.CascadeMode` property controlled both levels simultaneously, which required repetitive fluent configuration and hindered fine-grained error collection strategies.

Sources: [docs/cascade.md:61-66](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L61-L66), [docs/upgrading-to-11.md:43-45](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L43-L45)

### Migration Paths for Major Releases

FluentValidation 11.0 introduced `RuleLevelCascadeMode` and `ClassLevelCascadeMode` on `AbstractValidator` alongside their global counterparts under `ValidatorOptions.Global`, deprecating the legacy single-property approach and the `StopOnFirstFailure` enum value. FluentValidation 12.0 completed this transition by removing `CascadeMode.StopOnFirstFailure`, `AbstractValidator.CascadeMode`, and `ValidatorOptions.Global.CascadeMode` entirely.

| Legacy Property / Setting | FluentValidation 11.0 Status | FluentValidation 12.0 Replacement |
| :--- | :--- | :--- |
| `AbstractValidator.CascadeMode` | Deprecated | Removed (use `RuleLevelCascadeMode` and `ClassLevelCascadeMode`) |
| `ValidatorOptions.Global.CascadeMode` | Deprecated | Removed (use `DefaultRuleLevelCascadeMode` and `DefaultClassLevelCascadeMode`) |
| `CascadeMode.StopOnFirstFailure` | Deprecated (mapped to `Stop`) | Removed (use `CascadeMode.Stop`) |

Sources: [docs/cascade.md:68-73](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L68-L73), [docs/upgrading-to-11.md:44-45](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L44-L45), [docs/upgrading-to-12.md:27-29](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L27-L29)

> [!WARNING]
> Attempting to assign the deprecated `StopOnFirstFailure` value to the newer `RuleLevelCascadeMode` or `ClassLevelCascadeMode` properties in version 11 will not throw an error; the library silently falls back to `CascadeMode.Stop`.

Sources: [docs/upgrading-to-11.md:90-91](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L90-L91)

Sources: [docs/cascade.md:61-73](https://github.com/FluentValidation/FluentValidation/blob/main/docs/cascade.md#L61-L73), [docs/upgrading-to-11.md:43-91](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-11.md#L43-L91), [docs/upgrading-to-12.md:27-59](https://github.com/FluentValidation/FluentValidation/blob/main/docs/upgrading-to-12.md#L27-L59)

## Related

- [[Validation Core]]
- [[Conditional Validation]]

