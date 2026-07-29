# Localization Management

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/FluentValidation/Resources/LanguageManager.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs)
- [docs/localization.md](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md)
- [src/FluentValidation.Tests/LocalisedMessagesTester.cs](https://github.com/FluentValidation.Tests/LocalisedMessagesTester.cs)
- [src/FluentValidation/Resources/Languages/GermanLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/GermanLanguage.cs)
- [src/FluentValidation/Resources/Languages/EnglishLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/EnglishLanguage.cs)
- [src/FluentValidation/Resources/Languages/ChineseSimplifiedLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ChineseSimplifiedLanguage.cs)
- [src/FluentValidation.Tests/TestMessages.Designer.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/TestMessages.Designer.cs)
- [src/FluentValidation/Resources/Languages/ChineseTraditionalLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ChineseTraditionalLanguage.cs)
- [src/FluentValidation/Resources/Languages/KhmerLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/KhmerLanguage.cs)
- [src/FluentValidation/Resources/ILanguageManager.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/ILanguageManager.cs)
- [src/FluentValidation/Resources/Languages/ArabicLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ArabicLanguage.cs)
- [src/FluentValidation/Resources/Languages/JapaneseLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/JapaneseLanguage.cs)
- [src/FluentValidation/ValidatorOptions.cs](https://github.com/FluentValidation/ValidatorOptions.cs)
- [src/FluentValidation.Tests/LocalisedNameTester.cs](https://github.com/FluentValidation.Tests/LocalisedNameTester.cs)
- [src/FluentValidation/Resources/Languages/HebrewLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/HebrewLanguage.cs)
- [src/FluentValidation/Resources/Languages/RomanshLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/RomanshLanguage.cs)
- [src/FluentValidation/Resources/Languages/KoreanLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/KoreanLanguage.cs)
- [src/FluentValidation/Resources/Languages/PersianLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/PersianLanguage.cs)
- [src/FluentValidation/Resources/Languages/AzerbaijaneseLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/AzerbaijaneseLanguage.cs)
- [src/FluentValidation/Resources/Languages/AlbanianLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/AlbanianLanguage.cs)
- [src/FluentValidation/Resources/Languages/BulgarianLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/BulgarianLanguage.cs)
- [src/FluentValidation/Resources/Languages/WelshLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/WelshLanguage.cs)
- [src/FluentValidation/Resources/Languages/TeluguLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/TeluguLanguage.cs)
- [src/FluentValidation/Resources/Languages/NorwegianBokmalLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/NorwegianBokmalLanguage.cs)
- [src/FluentValidation/Resources/Languages/SerbianCyrillicLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/SerbianCyrillicLanguage.cs)
- [src/FluentValidation/Resources/Languages/TamilLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/TamilLanguage.cs)
- [src/FluentValidation/Resources/Languages/ItalianLanguage.cs](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ItalianLanguage.cs)
</details>

## Overview

Localization management in FluentValidation provides a robust framework for handling and customizing error message translations across multiple cultures. By integrating with .NET culture resolution mechanisms, it automatically selects appropriate messages based on the current UI culture while supporting fallback strategies for neutral and parent cultures. The architecture centers around the `ILanguageManager` interface and concrete translation providers, offering comprehensive extensibility for overriding default messages, registering custom resource dictionaries, and verifying localized validation rules through targeted testing strategies.

Sources: [docs/localization.md:1-78](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md#L1-L78), [src/FluentValidation/Resources/ILanguageManager.cs:22-44](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/ILanguageManager.cs#L22-L44), [src/FluentValidation/Resources/LanguageManager.cs:30-168](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L30-L168)

## Language Manager API and Core Architecture

### Language Manager API and Core Architecture

The public interface for localization management is defined by `ILanguageManager`, which exposes two primary configuration properties—`Enabled` (a boolean controlling whether localization is active) and `Culture` (an optional `CultureInfo` instance representing the default culture for all requests)—alongside the core translation retrieval method `GetString(string key, CultureInfo culture = null)`. The concrete implementation of this interface is provided by the `LanguageManager` class, which manages translated error messages using an internal thread-safe `ConcurrentDictionary<string, string>` named `_languages`.

Sources: [src/FluentValidation/Resources/ILanguageManager.cs:25-44](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/ILanguageManager.cs#L25-L44), [src/FluentValidation/Resources/LanguageManager.cs:30-31](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L30-L31)

Global configuration and access to the language manager are routed through `ValidatorOptions.Global`, an instance of `ValidatorConfiguration`. The configuration class instantiates a default `LanguageManager` upon initialization and exposes it via a property accessor that throws an `ArgumentNullException` if assigned a `null` value.

Sources: [src/FluentValidation/ValidatorOptions.cs:33-39](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L33-L39), [src/FluentValidation/ValidatorOptions.cs:67-72](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L67-L72), [src/FluentValidation/ValidatorOptions.cs:140-145](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/ValidatorOptions.cs#L140-L145)

### Core Methods and Signatures

| Member | Return Type | Parameters | Purpose |
| :--- | :--- | :--- | :--- |
| `ILanguageManager.Enabled` | `bool` | *None* (get/set) | Gets or sets whether localization is enabled. |
| `ILanguageManager.Culture` | `CultureInfo` | *None* (get/set) | Gets or sets the default culture for all requests. |
| `ILanguageManager.GetString` | `string` | `string key`, `CultureInfo culture = null` | Retrieves a translated string based on its key and culture. |
| `LanguageManager.Clear` | `void` | *None* | Removes all registered languages except the default. |
| `LanguageManager.AddTranslation` | `void` | `string language`, `string key`, `string message` | Explicitly adds or overrides a translation entry in the dictionary. |
| `ValidatorConfiguration.LanguageManager` | `ILanguageManager` | *None* (get/set) | Gets or sets the global language manager instance. |

Sources: [src/FluentValidation/Resources/ILanguageManager.cs:25-44](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/ILanguageManager.cs#L25-L44), [src/FluentValidation/Resources/LanguageManager.cs:106-167](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L106-L167), [src/FluentValidation/ValidatorOptions.cs:67-72](https://github.com/FluentValidation/ValidatorOptions.cs#L67-L72)

> [!NOTE]
> Assigning a `null` value to `ValidatorOptions.Global.LanguageManager` will immediately throw an `ArgumentNullException`. The property setter explicitly guards against `null` references to ensure a valid manager is always present.

Sources: [src/FluentValidation/ValidatorOptions.cs:67-72](https://github.com/FluentValidation/ValidatorOptions.cs#L67-L72)

## Culture Resolution and Fallback Control Flow

### Culture Resolution and Flow

### Overview

When a translation is requested via `LanguageManager.GetString(string key, CultureInfo culture = null)`, the internal resolution mechanism follows a strict hierarchical evaluation path. If localization is disabled (`Enabled` is set to `false`), the lookup bypasses culture checks entirely and immediately returns the English translation. When localization is enabled, the active culture is resolved via the expression `culture ?? Culture ?? CultureInfo.CurrentUICulture`, prioritizing the explicitly passed parameter, followed by the manager-level `Culture` property, and finally defaulting to the thread's `CurrentUICulture`.

Sources: [src/FluentValidation/Resources/LanguageManager.cs:130-156](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L130-L156)

### Resolution Call-Chain Walkthrough

The lookup proceeds through a sequence of steps executed inside the `GetString` method:

1. `Culture Resolution` — Determines the target culture using `culture ?? Culture ?? CultureInfo.CurrentUICulture`.
2. `ConcurrentDictionary Lookup` — Constructs the cache key via `culture.Name + ":" + key` and queries `_languages.GetOrAdd(...)`, which invokes `GetTranslation(culture.Name, key)` if the entry is missing.
3. `Parent Culture Traversal` — If the resulting value is `null`, a `while` loop iterates through `currentCulture.Parent` as long as the parent is not `CultureInfo.InvariantCulture`, constructing parent cache keys (`currentCulture.Name + ":" + key`) and querying `_languages.GetOrAdd(...)` for each ancestral level.
4. `English Fallback` — If the value remains `null` after parent traversal and `culture.Name != EnglishLanguage.Culture`, a final check confirms that `!culture.IsNeutralCulture && culture.Parent.Name != EnglishLanguage.Culture` before querying the English fallback translation via `EnglishLanguage.Culture + ":" + key`.
5. `Empty String Coalescing` — Returns the resolved string value, or `string.Empty` if all lookup stages return `null`.

Sources: [src/FluentValidation/Resources/LanguageManager.cs:130-159](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L130-L159)

> [!WARNING]
> If localization is disabled, the language manager completely ignores the requested culture and thread UI culture, returning the hardcoded English translation (`EnglishLanguage.Culture + ":" + key`) directly.

Sources: [src/FluentValidation/Resources/LanguageManager.cs:153-156](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L153-L156)

### Translation Dispatch Table

The internal `GetTranslation(string culture, string key)` method acts as a switch expression mapping culture string constants to their respective language translation providers.

| Culture Constant | Provider Class | Translation Source Method |
| :--- | :--- | :--- |
| `EnglishLanguage.AmericanCulture` (`en-US`) | `EnglishLanguage` | `EnglishLanguage.GetTranslation(key)` |
| `EnglishLanguage.BritishCulture` (`en-GB`) | `EnglishLanguage` | `EnglishLanguage.GetTranslation(key)` |
| `EnglishLanguage.Culture` (`en`) | `EnglishLanguage` | `EnglishLanguage.GetTranslation(key)` |
| `AlbanianLanguage.Culture` (`sq`) | `AlbanianLanguage` | `AlbanianLanguage.GetTranslation(key)` |
| `ArabicLanguage.Culture` (`ar`) | `ArabicLanguage` | `ArabicLanguage.GetTranslation(key)` |
| `AzerbaijaneseLanguage.Culture` (`az`) | `AzerbaijaneseLanguage` | `AzerbaijaneseLanguage.GetTranslation(key)` |
| `BelarusianLanguage.Culture` (`be`) | `BelarusianLanguage` | `BelarusianLanguage.GetTranslation(key)` |
| `BengaliLanguage.Culture` (`bn`) | `BengaliLanguage` | `BengaliLanguage.GetTranslation(key)` |
| `BosnianLanguage.Culture` (`bs`) | `BosnianLanguage` | `BosnianLanguage.GetTranslation(key)` |
| `BulgarianLanguage.Culture` (`bg`) | `BulgarianLanguage` | `BulgarianLanguage.GetTranslation(key)` |
| `ChineseSimplifiedLanguage.Culture` (`zh-Hans`) | `ChineseSimplifiedLanguage` | `ChineseSimplifiedLanguage.GetTranslation(key)` |
| `ChineseTraditionalLanguage.Culture` (`zh-Hant`) | `ChineseTraditionalLanguage` | `ChineseTraditionalLanguage.GetTranslation(key)` |
| `CroatianLanguage.Culture` (`hr`) | `CroatianLanguage` | `CroatianLanguage.GetTranslation(key)` |
| `CzechLanguage.Culture` (`cs`) | `CzechLanguage` | `CzechLanguage.GetTranslation(key)` |
| `DanishLanguage.Culture` (`da`) | `DanishLanguage` | `DanishLanguage.GetTranslation(key)` |
| `DutchLanguage.Culture` (`nl`) | `DutchLanguage` | `DutchLanguage.GetTranslation(key)` |
| `FinnishLanguage.Culture` (`fi`) | `FinnishLanguage` | `FinnishLanguage.GetTranslation(key)` |
| `EstonianLanguage.Culture` (`et`) | `EstonianLanguage` | `EstonianLanguage.GetTranslation(key)` |
| `FrenchLanguage.Culture` (`fr`) | `FrenchLanguage` | `FrenchLanguage.GetTranslation(key)` |
| `GermanLanguage.Culture` (`de`) | `GermanLanguage` | `GermanLanguage.GetTranslation(key)` |
| `GeorgianLanguage.Culture` (`ka`) | `GeorgianLanguage` | `GeorgianLanguage.GetTranslation(key)` |
| `GreekLanguage.Culture` (`el`) | `GreekLanguage` | `GreekLanguage.GetTranslation(key)` |
| `HebrewLanguage.Culture` (`he`) | `HebrewLanguage` | `HebrewLanguage.GetTranslation(key)` |
| `HindiLanguage.Culture` (`hi`) | `HindiLanguage` | `HindiLanguage.GetTranslation(key)` |
| `HungarianLanguage.Culture` (`hu`) | `HungarianLanguage` | `HungarianLanguage.GetTranslation(key)` |
| `IcelandicLanguage.Culture` (`is`) | `IcelandicLanguage` | `IcelandicLanguage.GetTranslation(key)` |
| `ItalianLanguage.Culture` (`it`) | `ItalianLanguage` | `ItalianLanguage.GetTranslation(key)` |
| `IndonesianLanguage.Culture` (`id`) | `IndonesianLanguage` | `IndonesianLanguage.GetTranslation(key)` |
| `JapaneseLanguage.Culture` (`ja`) | `JapaneseLanguage` | `JapaneseLanguage.GetTranslation(key)` |
| `KazakhLanguage.Culture` (`kk`) | `KazakhLanguage` | `KazakhLanguage.GetTranslation(key)` |
| `KhmerLanguage.Culture` (`km`) | `KhmerLanguage` | `KhmerLanguage.GetTranslation(key)` |
| `KoreanLanguage.Culture` (`ko`) | `KoreanLanguage` | `KoreanLanguage.GetTranslation(key)` |
| `LatvianLanguage.Culture` (`lv`) | `LatvianLanguage` | `LatvianLanguage.GetTranslation(key)` |
| `LithuanianLanguage.Culture` (`lt`) | `LithuanianLanguage` | `LithuanianLanguage.GetTranslation(key)` |
| `MacedonianLanguage.Culture` (`mk`) | `MacedonianLanguage` | `MacedonianLanguage.GetTranslation(key)` |
| `NorwegianBokmalLanguage.Culture` (`nb`) | `NorwegianBokmalLanguage` | `NorwegianBokmalLanguage.GetTranslation(key)` |
| `NorwegianNynorskLanguage.Culture` (`nn`) | `NorwegianNynorskLanguage` | `NorwegianNynorskLanguage.GetTranslation(key)` |
| `PersianLanguage.Culture` (`fa`) | `PersianLanguage` | `PersianLanguage.GetTranslation(key)` |
| `PolishLanguage.Culture` (`pl`) | `PolishLanguage` | `PolishLanguage.GetTranslation(key)` |
| `PortugueseLanguage.Culture` (`pt`) | `PortugueseLanguage` | `PortugueseLanguage.GetTranslation(key)` |
| `PortugueseBrazilLanguage.Culture` (`pt-BR`) | `PortugueseBrazilLanguage` | `PortugueseBrazilLanguage.GetTranslation(key)` |
| `RomanianLanguage.Culture` (`ro`) | `RomanianLanguage` | `RomanianLanguage.GetTranslation(key)` |
| `RomanshLanguage.Culture` (`rm`) | `RomanshLanguage` | `RomanshLanguage.GetTranslation(key)` |
| `RussianLanguage.Culture` (`ru`) | `RussianLanguage` | `RussianLanguage.GetTranslation(key)` |
| `SlovakLanguage.Culture` (`sk`) | `SlovakLanguage` | `SlovakLanguage.GetTranslation(key)` |
| `SlovenianLanguage.Culture` (`sl`) | `SlovenianLanguage` | `SlovenianLanguage.GetTranslation(key)` |
| `SpanishLanguage.Culture` (`es`) | `SpanishLanguage` | `SpanishLanguage.GetTranslation(key)` |
| `SerbianCyrillicLanguage.Culture` (`sr-Cyrl`) | `SerbianCyrillicLanguage` | `SerbianCyrillicLanguage.GetTranslation(key)` |
| `SerbianLatinLanguage.Culture` (`sr-Latn`) | `SerbianLatinLanguage` | `SerbianLatinLanguage.GetTranslation(key)` |
| `SwedishLanguage.Culture` (`sv`) | `SwedishLanguage` | `SwedishLanguage.GetTranslation(key)` |
| `ThaiLanguage.Culture` (`th`) | `ThaiLanguage` | `ThaiLanguage.GetTranslation(key)` |
| `TurkishLanguage.Culture` (`tr`) | `TurkishLanguage` | `TurkishLanguage.GetTranslation(key)` |
| `UkrainianLanguage.Culture` (`uk`) | `UkrainianLanguage` | `UkrainianLanguage.GetTranslation(key)` |
| `VietnameseLanguage.Culture` (`vi`) | `VietnameseLanguage` | `VietnameseLanguage.GetTranslation(key)` |
| `WelshLanguage.Culture` (`cy`) | `WelshLanguage` | `WelshLanguage.GetTranslation(key)` |
| `UzbekLatinLanguage.Culture` (`uz-Latn`) | `UzbekLatinLanguage` | `UzbekLatinLanguage.GetTranslation(key)` |
| `UzbekCyrillicLanguage.Culture` (`uz-Cyrl`) | `UzbekCyrillicLanguage` | `UzbekCyrillicLanguage.GetTranslation(key)` |
| `CatalanLanguage.Culture` (`ca`) | `CatalanLanguage` | `CatalanLanguage.GetTranslation(key)` |
| `TajikLanguage.Culture` (`tg`) | `TajikLanguage` | `TajikLanguage.GetTranslation(key)` |
| `TamilLanguage.Culture` (`ta`) | `TamilLanguage` | `TamilLanguage.GetTranslation(key)` |
| `TeluguLanguage.Culture` (`te`) | `TeluguLanguage` | `TeluguLanguage.GetTranslation(key)` |
| Default `_ => null` | *None* | Returns `null` |

Sources: [src/FluentValidation/Resources/LanguageManager.cs:39-104](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L39-L104)

## Built-In Language Translation Providers

### Overview

The core framework includes a robust collection of internal language classes under the `FluentValidation.Resources` namespace that encapsulate localized error messages for specific cultures. Each concrete language provider exposes a static culture identifier string (such as `Culture`, or specific variants like `AmericanCulture` and `BritishCulture`) and a static `GetTranslation(string key)` method. This method uses a C# switch expression mapping standard validation keys—such as `"EmailValidator"`, `"LengthValidator"`, and client-side integration fallbacks like `"Length_Simple"`—directly to localized format strings. If an unrecognized key is requested, the switch expression returns `null` via the `_ => null` default discard pattern, allowing the language manager to fall back to parent cultures or default English resources.

Sources: [src/FluentValidation/Resources/Languages/EnglishLanguage.cs:25-61](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/EnglishLanguage.cs#L25-L61), [src/FluentValidation/Resources/Languages/GermanLanguage.cs:25-59](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/GermanLanguage.cs#L25-L59)

### Built-In Language Translation Classes and Culture Identifiers

The framework defines dedicated internal classes for numerous regional and national languages. Each class implements the lookup contract through its `GetTranslation` member. The table below lists concrete provider implementations alongside their associated culture codes and lookup dispatch methods.

| Class Name | Culture Code Constant | Translation Dispatch Method |
| :--- | :--- | :--- |
| `AlbanianLanguage` | `"sq"` | `AlbanianLanguage.GetTranslation(key)` |
| `ArabicLanguage` | `"ar"` | `ArabicLanguage.GetTranslation(key)` |
| `AzerbaijaneseLanguage` | `"az"` | `AzerbaijaneseLanguage.GetTranslation(key)` |
| `BulgarianLanguage` | `"bg"` | `BulgarianLanguage.GetTranslation(key)` |
| `ChineseSimplifiedLanguage` | `"zh-Hans"` | `ChineseSimplifiedLanguage.GetTranslation(key)` |
| `ChineseTraditionalLanguage` | `"zh-Hant"` | `ChineseTraditionalLanguage.GetTranslation(key)` |
| `EnglishLanguage` | `"en"` (plus `"en-US"`, `"en-GB"`) | `EnglishLanguage.GetTranslation(key)` |
| `GermanLanguage` | `"de"` | `GermanLanguage.GetTranslation(key)` |
| `HebrewLanguage` | `"he"` | `HebrewLanguage.GetTranslation(key)` |
| `ItalianLanguage` | `"it"` | `ItalianLanguage.GetTranslation(key)` |
| `JapaneseLanguage` | `"ja"` | `JapaneseLanguage.GetTranslation(key)` |
| `KhmerLanguage` | `"km"` | `KhmerLanguage.GetTranslation(key)` |
| `KoreanLanguage` | `"ko"` | `KoreanLanguage.GetTranslation(key)` |
| `NorwegianBokmalLanguage` | `"nb"` | `NorwegianBokmalLanguage.GetTranslation(key)` |
| `PersianLanguage` | `"fa"` | `PersianLanguage.GetTranslation(key)` |
| `RomanshLanguage` | `"rm"` | `RomanshLanguage.GetTranslation(key)` |
| `SerbianCyrillicLanguage` | `"sr"` | `SerbianCyrillicLanguage.GetTranslation(key)` |
| `TamilLanguage` | `"ta"` | `TamilLanguage.GetTranslation(key)` |
| `TeluguLanguage` | `"te"` | `TeluguLanguage.GetTranslation(key)` |
| `WelshLanguage` | `"cy"` | `WelshLanguage.GetTranslation(key)` |

Sources: [src/FluentValidation/Resources/Languages/AlbanianLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/AlbanianLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/ArabicLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ArabicLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/AzerbaijaneseLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/AzerbaijaneseLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/BulgarianLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/BulgarianLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/ChineseSimplifiedLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ChineseSimplifiedLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/ChineseTraditionalLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ChineseTraditionalLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/EnglishLanguage.cs:25-62](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/EnglishLanguage.cs#L25-L62), [src/FluentValidation/Resources/Languages/GermanLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/GermanLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/HebrewLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/HebrewLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/ItalianLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/ItalianLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/JapaneseLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/JapaneseLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/KhmerLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/KhmerLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/KoreanLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/KoreanLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/NorwegianBokmalLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/NorwegianBokmalLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/PersianLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/PersianLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/RomanshLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/RomanshLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/SerbianCyrillicLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/SerbianCyrillicLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/TamilLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/TamilLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/TeluguLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/TeluguLanguage.cs#L25-L60), [src/FluentValidation/Resources/Languages/WelshLanguage.cs:25-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/WelshLanguage.cs#L25-L60)

### Design Architecture and Structure Trade-Offs

The built-in translation providers utilize static switch expressions compiled directly into internal class structures rather than external resource bundles (`.resx`). This architectural pattern presents specific design trade-offs:

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Static switch expression per language class (`GetTranslation`) | Zero disk I/O overhead at runtime; fast O(1) jump-table execution in the CLR | Requires recompilation and redeployment to update or add missing strings |
| Strongly typed internal class representation | Prevents missing file exceptions and ensures compile-time safety across assemblies | Increases assembly size and couples language definitions tightly to the core validation library |
| Fallback-specific keys (`*_simple`) alongside full format strings | Seamless integration points for client-side validation libraries requiring concise messages | Duplication of base string patterns across multiple language provider definitions |

Sources: [src/FluentValidation/Resources/Languages/EnglishLanguage.cs:30-61](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/EnglishLanguage.cs#L30-L61), [src/FluentValidation/Resources/Languages/GermanLanguage.cs:28-59](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/GermanLanguage.cs#L28-L59)

> [!NOTE]
> `EnglishLanguage` is unique among the language providers in defining multiple sub-culture constants—`Culture = "en"`, `AmericanCulture = "en-US"`, and `BritishCulture = "en-GB"`—to service regional variations sharing the same underlying base dictionary implementation.

Sources: [src/FluentValidation/Resources/Languages/EnglishLanguage.cs:26-28](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/Languages/EnglishLanguage.cs#L26-L28)

## Custom Translation Registration and Overrides

### Overview

FluentValidation provides extensibility mechanisms allowing developers to replace standard error messages or inject completely custom translations. By inheriting from the base `LanguageManager` class, applications can register custom strings for specific languages and locales. The `AddTranslation` method performs this registration by populating an internal concurrent dictionary using a compound key format combining the culture name and translation key.

Sources: [src/FluentValidation/Resources/LanguageManager.cs:31-167](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L31-L167), [docs/localization.md:31-59](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md#L31-L59)

### Custom Language Manager Implementation

To override default messages, implement a subclass of `LanguageManager` and invoke `AddTranslation` within its constructor for each target culture and validator key.

```csharp
public class CustomLanguageManager : FluentValidation.Resources.LanguageManager
{
  public CustomLanguageManager() 
  {
    AddTranslation("en", "NotNullValidator", "'{PropertyName}' is required.");
    AddTranslation("en-US", "NotNullValidator", "'{PropertyName}' is required.");
    AddTranslation("en-GB", "NotNullValidator", "'{PropertyName}' is required.");
  }
}
```

Sources: [docs/localization.md:37-46](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md#L37-L46)

> [!WARNING]
> When replacing messages for the neutral `en` culture, you should explicitly register overrides for regional variants such as `en-US` and `en-GB`. Because these specific cultures take precedence during resolution, failing to supply them will result in default framework messages being used for those locales instead of your custom translations.

Sources: [docs/localization.md:56-56](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md#L56-L56)

### Global Registration Walkthrough

Once the custom manager is defined, activate it during application startup by assigning an instance to the static `ValidatorOptions.Global.LanguageManager` property.

```csharp
ValidatorOptions.Global.LanguageManager = new CustomLanguageManager();
```

Sources: [docs/localization.md:50-54](https://github.com/FluentValidation/FluentValidation/blob/main/docs/localization.md#L50-L54)

### AddTranslation Execution Flow

When `AddTranslation` is invoked on a `LanguageManager` instance, it executes the following call chain and validation checks:

1. `AddTranslation(string language, string key, string message)` validates parameters:
   - Throws `ArgumentNullException` if `language` is null or empty.
   - Throws `ArgumentNullException` if `key` is null or empty.
   - Throws `ArgumentNullException` if `message` is null or empty.
2. Combines the strings into a composite cache key (`language + ":" + key`) and assigns the `message` directly into the underlying `ConcurrentDictionary<string, string> _languages` collection.

Sources: [src/FluentValidation/Resources/LanguageManager.cs:161-167](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation/Resources/LanguageManager.cs#L161-L167)

## Localized Validation Testing and Verification

### Overview

Validating culture-sensitive messages and custom resource files requires testing strategies that manage thread UI culture state and assert against resource manager outputs. Test fixtures such as `LocalisedMessagesTester` and `LocalisedNameTester` reset culture state upon initialization and disposal via `CultureScope.SetDefaultCulture()` to prevent test pollution across execution threads.

Sources: [src/FluentValidation.Tests/LocalisedMessagesTester.cs:29-39](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/LocalisedMessagesTester.cs#L29-L39), [src/FluentValidation.Tests/LocalisedNameTester.cs:27-34](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/LocalisedNameTester.cs#L27-L34)

### Culture-Sensitive Verification Fixture

When verifying localized messages across multiple languages, test implementations temporarily modify `Thread.CurrentThread.CurrentUICulture`, retrieve strings via `ValidatorOptions.Global.LanguageManager.GetString()`, build messages through `MessageFormatter`, and assert equality against validation rule outcomes.

```csharp
[Fact]
public void Correctly_assigns_default_localized_error_message() {
    var originalCulture = Thread.CurrentThread.CurrentUICulture;
    try {
        var validator = new TestValidator(v => v.RuleFor(x => x.Surname).NotEmpty());

        foreach (var culture in new[] { "en", "de", "fr", "es", "ca", "de", "it", "nl", "pl", "pt", "ru", "sv", "ar" }) {
            Thread.CurrentThread.CurrentUICulture = new CultureInfo(culture);
            var message = ValidatorOptions.Global.LanguageManager.GetString("NotEmptyValidator");
            var errorMessage = new MessageFormatter().AppendPropertyName("Surname").BuildMessage(message);
            Debug.WriteLine(errorMessage);
            var result = validator.Validate(new Person{Surname = null});
            result.Errors.Single().ErrorMessage.ShouldEqual(errorMessage);
        }
    }
    finally {
        Thread.CurrentThread.CurrentUICulture = originalCulture;
    }
}
```

Sources: [src/FluentValidation.Tests/LocalisedMessagesTester.cs:41-61](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/LocalisedMessagesTester.cs#L41-L61)

> [!NOTE]
> Resource-backed tests must always capture and restore the original `CurrentUICulture` inside a `try/finally` block to guarantee that thread culture modifications do not leak into subsequent unit tests.

Sources: [src/FluentValidation.Tests/LocalisedMessagesTester.cs:44-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/LocalisedMessagesTester.cs#L44-L60)

### Resource Management and Naming Tests

Generated resource wrappers like `TestMessages` provide strongly-typed property accessors backed by `System.Resources.ResourceManager`. Concurrently, property name localization can be verified using custom resource classes defined within test fixtures.

```csharp
public class LocalisedNameTester : IDisposable {
	public LocalisedNameTester() {
		CultureScope.SetDefaultCulture();
	}

	public void Dispose() {
		CultureScope.SetDefaultCulture();
	}

	[Fact]
	public void Uses_localized_name() {
		var validator = new TestValidator {
			v => v.RuleFor(x => x.Surname).NotNull().WithName(x => MyResources.CustomProperty)
		};

		var result = validator.Validate(new Person());
		result.Errors.Single().ErrorMessage.ShouldEqual("'foo' must not be empty.");
	}

	public static class MyResources {
		public static string CustomProperty {
			get { return "foo"; }
		}
	}
}
```

Sources: [src/FluentValidation.Tests/TestMessages.Designer.cs:19-73](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/TestMessages.Designer.cs#L19-L73), [src/FluentValidation.Tests/LocalisedNameTester.cs:27-60](https://github.com/FluentValidation/FluentValidation/blob/main/src/FluentValidation.Tests/LocalisedNameTester.cs#L27-L60)

## Related

- [[Error Customization]]

