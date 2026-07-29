# Project Structure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt)
- [CONTRIBUTING.md](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md)
- [gradle/artifacts/publishLinuxPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt)
- [AGENTS.md](https://github.com/ktorio/ktor/blob/main/AGENTS.md)
- [README.md](https://github.com/ktorio/ktor/blob/main/README.md)
- [gradle/artifacts/publishJsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt)
- [gradle/artifacts/publishWindowsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt)
- [build-logic/README.md](https://github.com/ktorio/ktor/blob/main/build-logic/README.md)
- [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt)
- [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt)
- [build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt)
- [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt)
- [build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt)
- [ktor-test-server/README.md](https://github.com/ktorio/ktor/blob/main/ktor-test-server/README.md)
</details>

## Overview

The project structure of Ktor is engineered around a unified, platform-agnostic multiplatform architecture managed through custom Gradle build logic. At its core, the repository resolves platform targets dynamically based on local directory presence and Gradle properties, while enforcing strict source set consistency and preventing unapproved manual registrations. By standardizing subsystem organization across server, client, shared, and test modules alongside a platform-centric source set layout, the build system streamlines compilation, testing, and multiplatform artifact publishing across JVM, Android, JavaScript, WebAssembly, and various Native environments. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:34-38](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L34-L38), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:302-308](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L302-L308), [AGENTS.md:25-42](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L25-L42).

## Repository Layout and Subsystem Organization

Ktor is organized around a flattened Gradle project structure where nested directory paths do not translate to nested Gradle project names. For example, `ktor-client/ktor-client-curl` corresponds to the flattened Gradle project `:ktor-client-curl`. Across the repository, core project modules are divided into distinct subsystems—including client modules, server modules, and test infrastructure such as `ktor-test-server`, which hosts the server used for integration testing of Ktor itself. Sources: [AGENTS.md:25-27](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L25-L27), [ktor-test-server/README.md:1-3](https://github.com/ktorio/ktor/blob/main/ktor-test-server/README.md#L1-L3).

The build configuration and test execution environment incorporate specific module naming rules and Gradle properties to manage subsystem execution. Module names must start with `ktor-`, and integration testing relies on dedicated test server modules configurable through Gradle properties. Sources: [AGENTS.md:109-111](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L109-L111), [ktor-test-server/README.md:5-10](https://github.com/ktorio/ktor/blob/main/ktor-test-server/README.md#L5-L10).

| Gradle Property | Description | Sources: [ktor-test-server/README.md:7-9](https://github.com/ktorio/ktor/blob/main/ktor-test-server/README.md#L7-L9) |
|-----------------|-------------|-----------------------------------------------------------------------------------------------------------------|
| `ktorbuild.testServer.verbose` | Print server-side exception stack traces to the build log. | Sources: [ktor-test-server/README.md:7-9](https://github.com/ktorio/ktor/blob/main/ktor-test-server/README.md#L7-L9) |

> [!NOTE]
> The flattened Gradle module structure means module identifiers like `:ktor-client-curl` are referenced directly without intermediate namespace qualifiers in build tasks. Sources: [AGENTS.md:25-27](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L25-L27)

## Build Logic Extension Architecture

The custom Gradle build-logic module in Ktor is organized as a composite build located in the `build-logic` directory, avoiding the staleness issues associated with traditional `buildSrc` implementations. Root projects integrate this composite build via `includeBuild("build-logic")` in `settings.gradle.kts` and apply plugins using identifiers such as `ktorbuild.base`. Within this module, `KtorBuildExtension` defines project-level properties, environment detection, and toolchain configurations, while `Accessors.kt` bridges Kotlin and Gradle extension APIs to expose type-safe extensions for multiplatform projects. Sources: [build-logic/README.md:5-19](https://github.com/ktorio/ktor/blob/main/build-logic/README.md#L5-L19), [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt:17-36](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L17-L36), [build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt:17-20](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt#L17-L20).

`KtorBuildExtension` exposes companion constants and provider-backed properties that evaluate build environments and testing toolchains dynamically. The primary extension name is registered as `ktorBuild`, and the default minimum JDK version used for building is set to `8`. Sources: [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt:54-59](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L54-L59).

| Property Name | Return Type | Default Value / Fallback Resolution | Sources: [ktorbuild/KtorBuildExtension.kt:28-52](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L28-L52) |
|---------------|-------------|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `isCI` | `Provider<Boolean>` | Evaluated via `TEAMCITY_VERSION` environment variable, falling back to `CI` environment variable, defaulting to `false` | Sources: [ktorbuild/KtorBuildExtension.kt:28-35](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L28-L35) |
| `jvmTestToolchain` | `Provider<JavaLanguageVersion>` | Gradle property `test.jdk`, falling back to current Gradle major Java version | Sources: [ktorbuild/KtorBuildExtension.kt:46-49](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L46-L49) |
| `os` | `Provider<OperatingSystem>` | Current operating system via `OperatingSystem.current()` | Sources: [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt:51-53](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L51-L53) |

> [!TIP]
> To run tests against a specific JDK version like JDK 8 without modifying build files, pass the `-Ptest.jdk=8` flag to the Gradle test task or configure `test.jdk=8` in `gradle.properties`. Sources: [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt:43-44](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L43-L44)

Because Gradle does not automatically generate type-safe accessors for plugins defined inside the `build-logic` composite build module, internal extension getters and configuration functions are explicitly declared in `Accessors.kt`. These accessors cast and retrieve extensions for `Project`, `KotlinMultiplatformExtension`, and `KotlinProjectExtension`. Sources: [build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt:17-20](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt#L17-L20).

```kotlin
internal val Project.ktorBuild: KtorBuildExtension get() = extensions.getByType()

internal val Project.java: JavaPluginExtension get() = extensions.getByType()

internal val Project.kotlin: KotlinMultiplatformExtension get() = extensions.getByType()

internal fun Project.kotlin(configure: KotlinMultiplatformExtension.() -> Unit) =
    extensions.configure("kotlin", configure)

internal fun KotlinProjectExtension.abiValidation(configure: AbiValidationVariantSpec.() -> Unit) =
    extensions.configure("abiValidation", configure)

internal fun KotlinMultiplatformExtension.android(action: KotlinMultiplatformAndroidLibraryTarget.() -> Unit) {
    (this as ExtensionAware).extensions.configure("android", action)
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt:22-37](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt#L22-L37)

## Target Resolution and Platform Hierarchy

The Ktor build logic manages Kotlin Multiplatform (KMP) targets dynamically using the `KtorTargets` class and project layout analysis. By default, targets are enabled automatically if their corresponding source set directory exists at the project root, or if they are explicitly configured via Gradle properties starting with the `target.` prefix (e.g., `target.jvm=true` or `target.watchosDeviceArm64=false`). Sub-targets for `js` and `wasmJs` (such as `browser` and `nodeJs`) inherit their parent target's state unless overridden. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:33-66](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L33-L66)

Target directory discovery is implemented by `ProjectTargetDirectories`, which inspects the project directory up to a maximum depth of 1 and filters subdirectories matching `KtorTargets.knownSourceSets`. Sources: [build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt:13-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt#L13-L24)

The hierarchy template defines grouped target hierarchies, including POSIX, web, desktop, and non-JVM target collections. The `resolveTargets` function resolves any group name or individual target to its constituent source sets using `hierarchyTracker.groups`. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:170-237](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L170-L237)

| Target Group / Source Set | Sub-targets / Nested Groups | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:173-229](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L173-L229) |
|---------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `posix` | `windows`, `nix` (`linux`, `darwin`, `androidNative`) | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:174-199](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L174-L199) |
| `darwin` | `ios`, `tvos`, `watchos`, `macos` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:180-185](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L180-L185) |
| `androidNative` | `androidNative64` (X64, Arm64), `androidNative32` (X86, Arm32) | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:187-197](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L187-L197) |
| `web` | `withJs()`, `withWasmJs()` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:201-204](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L201-L204) |
| `desktop` | `linux`, `windows`, `macos` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:211-215](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L211-L215) |
| `nonJvm` | `posix`, `web` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:217-220](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L217-L220) |
| `nonDarwinPosix` | `windows`, `linux`, `androidNative` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:222-226](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L222-L226) |

Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:173-229](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L173-L229)

When configuring a Kotlin Multiplatform extension, `addTargets` executes a deterministic configuration pipeline. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:240-292](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L240-L292)

1. `targets.finalize()` freezes the target filter predicate, preventing further modifications. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:241-241](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L241-L241)
2. If light sync mode is active, `targets.ensureTargetsNotEmpty()` evaluates `KtorTargets.resolveTargets("common")` to check if all targets are disabled; if none are enabled, it defaults to registering `kotlin.jvm()`. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:242-242](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L242-L242), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:296-299](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L296-L299)
3. Platform builders execute conditional registration checks via `targets.isEnabled(targetName)` for JVM, Android, JS, Wasm, and Native tiers (Tier 1: `macosX64`, `macosArm64`, `iosArm64`, `iosX64`, `iosSimulatorArm64`; Tier 2: `linuxArm64`, `linuxX64`, `watchosArm32`, `watchosArm64`, `watchosX64`, `watchosSimulatorArm64`, `tvosArm64`, `tvosX64`, `tvosSimulatorArm64`; Tier 3: `androidNativeArm32`, `androidNativeArm64`, `androidNativeX86`, `androidNativeX64`, `mingwX64`, `watchosDeviceArm64`). Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:244-289](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L244-L289)
4. `freezeSourceSets(targets.isLightSync)` attaches a `whenObjectAdded` listener to source sets and validates at `afterEvaluate` whether un-registered manual source sets were added. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:290-290](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L290-L290), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:309-330](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L309-L330)
5. `flattenSourceSetsStructure()` runs across non-default source sets, transforming directory paths into a platform-centric layout (`latform>/src`, `latform>/resources`, `latform>/test`, and `latform>/test-resources`). Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:291-291](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L291-L291), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:398-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L398-L409)

> [!WARNING]
> Manual source set registration or declaring dependencies that implicitly create source sets will throw an `IllegalStateException` during `afterEvaluate` unless `ktorbuild.ignoreExtraSourceSets=true` is set or light sync mode is active. Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:318-329](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L318-L329)

| Design Choice | Benefit | Cost | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:72-150](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L72-L150), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:398-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L398-L409) |
|---------------|---------|------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Directory-based default target enabling | Eliminates boilerplate configuration in subprojects where targets match folder presence | Requires strict adherence to naming conventions and folder layout matching `knownSourceSets` | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:33-38](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L33-L38), [build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt:16-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/gradle/ProjectTargetDirectories.kt#L16-L24) |
| Flattened source set directory structure | Organizes source folders by platform directory (`jvm/src`, `jvm/test`) rather than nested source set hierarchies | Requires custom path redirection logic applied to every non-standard source set during evaluation | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:388-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L388-L409) |
| Strict source set freezing (`afterEvaluate`) | Prevents accidental or unauthorized manual source set creation outside the build logic framework | Blocks ad-hoc custom source set additions unless explicitly suppressed via Gradle properties | Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:309-330](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L309-L330) |

## Source Set Configuration and Dependencies

Ktor's build logic extends the Kotlin Multiplatform plugin's source set container (`NamedDomainObjectContainer<KotlinSourceSet>`) with custom delegate properties, inline type aliases, and optional source set helpers. These abstractions establish consistent naming conventions and dependency handlers across multiplatform modules. Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:15-28](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L15-L28)

The build logic defines private type aliases targeting Gradle's domain object API, mapping `KotlinSourceSets` to `NamedDomainObjectContainer<KotlinSourceSet>`, `KotlinSourceSetProvider` to `NamedDomainObjectProvider<KotlinSourceSet>`, and `OptionalKotlinSourceSetProvider` to `NamedDomainObjectSet<KotlinSourceSet>`. Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:15-17](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L15-L17)

Delegated properties using `KotlinSourceSetConvention` instantiate platform and target group source sets directly on the container: Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:21-28](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L21-L28)

| Property Name | Return Type | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:21-27](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L21-L27) |
|---------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `posixMain` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:21-21](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L21-L21) |
| `darwinMain` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:22-22](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L22-L22) |
| `darwinTest` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:23-23](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L23-L23) |
| `desktopMain` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:24-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L24-L24) |
| `desktopTest` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:25-25](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L25-L25) |
| `windowsMain` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:26-26](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L26-L26) |
| `windowsTest` | `KotlinSourceSetProvider` | Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:27-27](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L27-L27) |

Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:21-27](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L21-L27)

Android source sets are handled conditionally via the `OptionalSourceSets` inline value class. The `optional` property wraps the source set container to expose lazily queried providers that avoid failing when the Android plugin is absent. Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:29-38](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L29-L38)

> [!NOTE]
> `OptionalSourceSets` provides lazy domain object providers for `androidMain`, `androidTest`, and `androidDeviceTest` via `sourceSets.named { it == name }`, preventing eager instantiation errors in non-Android modules. Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:31-37](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L31-L37)

The configuration extension function `OptionalKotlinSourceSetProvider.dependencies` invokes `configureEach` on the underlying set to apply dependency blocks safely: Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:40-42](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L40-L42)

```kotlin
fun OptionalKotlinSourceSetProvider.dependencies(handler: KotlinDependencyHandler.() -> Unit) {
    configureEach { dependencies(handler) }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt:40-42](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/dsl/KotlinSourceSets.kt#L40-L42)

Project-level common source sets are configured through `configureCommon()`, which hooks into the Kotlin extension block to wire standard library and coroutine dependencies: Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L24)

```kotlin
internal fun Project.configureCommon() {
    kotlin {
        sourceSets {
            commonMain.dependencies {
                api(libs.kotlinx.coroutines.core)
            }

            commonTest.dependencies {
                implementation(libs.kotlin.test)
            }
        }
    }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt:12-24](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/CommonConfig.kt#L12-L24)

## Multiplatform Artifact Publication Structure

The publication manifests dictate the precise structure of artifacts emitted for Kotlin Multiplatform targets across Linux, JavaScript, WebAssembly, and Windows. Each target publishes a `.klib` metadata/binary archive alongside documentation (`javadoc.jar`) and source attachments (`sources.jar`). Furthermore, modules with platform-specific interop declarations include specialized `.klib` cinterop bundles. Sources: [gradle/artifacts/publishLinuxPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L1-L442), [gradle/artifacts/publishJsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt#L1-L433), [gradle/artifacts/publishWindowsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L1-L224)

Linux publications encompass both 64-bit architectures (`linuxx64`) and ARM 64-bit architectures (`linuxarm64`). Modules targeting low-level operations bundle native bridge libraries. For instance, `ktor-client-curl` produces `cinterop-libcurl.klib`, `ktor-io` publishes `cinterop-mutex.klib`, `ktor-network` publishes `cinterop-network.klib`, and `ktor-utils` includes `cinterop-threadUtils.klib`. Sources: [gradle/artifacts/publishLinuxPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L44-L134)

Similarly, Windows publications targeting `mingwx64` bundle MinGW-specific interop libraries alongside standard publication artifacts. The `ktor-client-curl` module publishes `cinterop-libcurl.klib`, `ktor-client-winhttp` includes `cinterop-winhttp.klib`, `ktor-io` provides `cinterop-mutex.klib`, and `ktor-network` includes `cinterop-afunix.klib`. Sources: [gradle/artifacts/publishWindowsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L23-L74)

The JavaScript and WebAssembly publication structure mirrors the native layout by generating parallel artifacts for standard ECMAScript targets (`js`) and WebAssembly targets (`wasm-js`). Every published artifact set adheres strictly to the module naming convention `io.ktor:<module>-<target>`, paired with `.klib`, `javadoc.jar`, and `sources.jar` descriptors. Sources: [gradle/artifacts/publishJsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishJsPublications.txt#L1-L433)

## Related

- [[Overview]]
- [[Build Infrastructure]]

