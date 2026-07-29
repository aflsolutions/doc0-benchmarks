# Build Infrastructure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt)
- [gradle/artifacts/publishWindowsPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt)
- [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt)
- [gradle/libs.versions.toml](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml)
- [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt)
- [CONTRIBUTING.md](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md)
- [gradle/artifacts/publishLinuxPublications.txt](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt)
- [build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt)
- [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt)
- [AGENTS.md](https://github.com/ktorio/ktor/blob/main/AGENTS.md)
- [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt)
- [build-logic/src/main/kotlin/ktorbuild/CInterop.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt)
- [build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt)
- [build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/Accessors.kt)
- [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt)
- [build-logic/README.md](https://github.com/ktorio/ktor/blob/main/build-logic/README.md)
- [README.md](https://github.com/ktorio/ktor/blob/main/README.md)
</details>

## Overview

The Ktor build infrastructure is structured as a dedicated composite build project located in `build-logic`, separating shared build logic from the main source code to prevent out-of-date build issues and mirror patterns seen in large-scale projects like Gradle and Dokka.
Sources: [build-logic/README.md:1-13](https://github.com/ktorio/ktor/blob/main/build-logic/README.md#L1-L13)

By relying on Gradle composite builds and custom Kotlin plugins referenced through version catalogs, this infrastructure standardizes multiplatform target configurations, native toolchains, CInterop integrations, artifact aggregation, and rigorous publication verification across all subprojects.
Sources: [build-logic/README.md:1-13](https://github.com/ktorio/ktor/blob/main/build-logic/README.md#L1-L13), [gradle/libs.versions.toml:1-267](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L1-L267)

## Multiplatform Target Configuration

### Overview

The Ktor build system relies on `KtorTargets` and helper extensions to dynamically configure Kotlin Multiplatform targets, source set hierarchies, and JVM-specific parameters based on project directories and `gradle.properties`.
Targets are automatically enabled if their source set directory exists, unless explicitly overridden via properties prefixed with `target.`.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:33-76](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L33-L76)

### Target Resolution and Hierarchy Template

Target discovery uses a tracked Kotlin hierarchy template (`hierarchyTemplate`) that establishes parent-child groupings for POSIX, Windows, Linux, Darwin (`ios`, `tvos`, `watchos`, `macos`), Android native, and web targets (`js`, `wasmJs`).
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:169-230](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L169-L230)

| Group Name | Member Targets / Sub-groups | Sources |
| :--- | :--- | :--- |
| `posix` | `windows`, `nix` (`linux`, `darwin`, `androidNative`) | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:174-198](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L174-L198) |
| `windows` | `withMingw()` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:175-175](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L175-L175) |
| `linux` | `withLinux()` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:178-178](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L178-L178) |
| `darwin` | `ios`, `tvos`, `watchos`, `macos` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:180-185](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L180-L185) |
| `androidNative` | `androidNative64` (x64, arm64), `androidNative32` (x86, arm32) | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:187-197](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L187-L197) |
| `web` | `withJs()`, `withWasmJs()` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:201-204](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L201-L204) |
| `jvmAndPosix` | `withJvm()`, `posix` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:206-209](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L206-L209) |
| `desktop` | `linux`, `windows`, `macos` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:211-215](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L211-L215) |
| `nonJvm` | `posix`, `web` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:217-220](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L217-L220) |
| `nonDarwinPosix` | `windows`, `linux`, `androidNative` | [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:222-226](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L222-L226) |

Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:174-226](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L174-L226)

> [!NOTE]
> Sub-targets like `js.browser` and `wasmJs.browser` inherit their parent target's activation state unless overridden explicitly in `gradle.properties`.
> Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:51-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L51-L57)

### Target Configuration Walkthrough

When configuring a Kotlin Multiplatform extension, `addTargets` executes a sequence of checks and target registrations:
1. `targets.finalize()` freezes the filter predicate.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:241-241](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L241-L241)
2. If `isLightSync` is active, `targets.ensureTargetsNotEmpty()` evaluates whether all common targets are disabled and forces `kotlin.jvm()` if necessary to prevent empty target sets.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:242-242](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L242-L242), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:295-299](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L295-L299)
3. Platform evaluations (`targets.hasJvm`, `targets.hasAndroidJvm`, `targets.hasJs`, `targets.hasWasmJs`) conditionally invoke `jvm()`, `android(...)`, `js(...)`, and `wasmJs(...)`.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:244-259](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L244-L259)
4. Native targets across Tiers 1 through 3 (`macosX64`, `iosArm64`, `linuxX64`, `mingwX64`, etc.) are registered if enabled.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:261-289](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L261-L289)
5. `freezeSourceSets(targets.isLightSync)` validates that no unexpected extra source sets were manually registered.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:290-290](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L290-L290), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:309-331](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L309-L331)
6. `flattenSourceSetsStructure()` reorganizes default source directories into a platform-centric layout.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:291-291](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L291-L291), [build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt:398-409](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/KtorTargets.kt#L398-L409)

### JVM Configuration and Testing Setup

The `configureJvm` extension registers the `Jvm` project tag, adds dependencies such as `slf4j.api` to `jvmMain`, and configures JUnit 5 test libraries alongside coroutines debuggers in `jvmTest`.
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt:22-37](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt#L22-L37)

```kotlin
internal fun Project.configureJvm() {
    addProjectTag(ProjectTag.Jvm)

    kotlin {
        sourceSets {
            jvmMain.dependencies {
                api(libs.slf4j.api)
            }

            jvmTest.dependencies {
                implementation(libs.kotlin.test.junit5)
                implementation(libs.junit)
                implementation(libs.kotlinx.coroutines.debug)
            }
        }
    }

    configureTests()
    configureJarManifest()
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt:22-41](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt#L22-L41)

> [!WARNING]
> Test execution automatically configures Java toolchains based on the `test.jdk` property and injects JVM arguments `--add-opens` for JDK 16+ and `-XX:+EnableDynamicAgentLoading` for JDK 21+ to support coroutines debugging agents.
> Sources: [build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt:78-104](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/targets/JvmConfig.kt#L78-L104), [build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt:46-50](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/KtorBuildExtension.kt#L46-L50)

## Native CInterop Compilation Integration

### Overview

Ktor provides integration for compiling CInterop definitions across Kotlin Multiplatform native targets through the `createCInterop` extension function and native compilation configuration workarounds.
Sources: [build-logic/src/main/kotlin/ktorbuild/CInterop.kt:34-86](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt#L34-L86)

### CInterop Configuration and Workarounds

The `disableNativeCompileConfigurationCache` extension function disables the Gradle configuration cache for metadata compilation tasks and Dokka generation tasks to work around known configuration cache issues (`KT-76147`).
Sources: [build-logic/src/main/kotlin/ktorbuild/CInterop.kt:19-32](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt#L19-L32)

```kotlin
fun KotlinMultiplatformExtension.disableNativeCompileConfigurationCache() {
    project.tasks.withType<KotlinNativeCompile>()
        .named { it.endsWith("MainKotlinMetadata") }
        .configureEach { notCompatibleWithConfigurationCache("Workaround for KT-76147") }

    project.tasks.withType<DokkaGeneratePublicationTask>()
        .named { it == "dokkaGeneratePublicationHtml" }
        .configureEach { notCompatibleWithConfigurationCache("Workaround for KT-76147") }
    project.tasks.withType<DokkaGenerateModuleTask>()
        .named { it == "dokkaGenerateModuleHtml" }
        .configureEach { notCompatibleWithConfigurationCache("Workaround for KT-76147") }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/CInterop.kt:19-32](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt#L19-L32)

The `createCInterop` function resolves target groups using `KtorTargets.resolveTargets(sourceSet)` and verifies that each matched target is an instance of `KotlinNativeTarget` before creating the CInterop setting on its `main` compilation.
Sources: [build-logic/src/main/kotlin/ktorbuild/CInterop.kt:64-86](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt#L64-L86)

> [!WARNING]
> Attempting to invoke `createCInterop` on a non-native target throws an immediate `IllegalStateException` with the message `"Can't create cinterop for non-native target $targetName"`.
> Sources: [build-logic/src/main/kotlin/ktorbuild/CInterop.kt:75-77](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/CInterop.kt#L75-L77)

## Native Dependency Management via Vcpkg

### Overview

Native dependency management in the build infrastructure integrates `vcpkg` to acquire and build native libraries for Kotlin/Native targets.
The build logic defines `VcpkgInstall` tasks and registration helpers that map Kotlin/Native targets to corresponding `vcpkg` triplets, configure native toolchains, and expose output directories for headers and binaries.
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:29-74](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L29-L74), [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt:16-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt#L16-L57)

### Target Triplets and Task Execution

The `VcpkgInstall` task maps each supported `KonanTarget` to its corresponding `vcpkg` triplet string.
Unsupported targets trigger an error during triplet resolution.
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:76-83](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L76-L83)

| Kotlin Native Target | vcpkg Triplet | Sources |
|----------------------|---------------|---------|
| `MACOS_ARM64` | `arm64-osx` | [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:77-77](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L77-L77) |
| `MACOS_X64` | `x64-osx` | [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:78-78](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L78-L78) |
| `LINUX_ARM64` | `arm64-linux` | [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:79-79](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L79-L79) |
| `LINUX_X64` | `x64-linux` | [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:80-80](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L80-L80) |
| `MINGW_X64` | `x64-mingw-static` | [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:81-81](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L81-L81) |
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:76-83](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L76-L83)

During execution, `VcpkgInstall.run()` locates the executable (`vcpkg` on Mingw hosts, or via `execOps.which("vcpkg")` on other hosts), builds the command line with options including `--triplet`, `--x-install-root`, `--x-manifest-root`, and `--no-print-usage`, and executes the process with toolchain environment configurations.
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:85-117](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L85-L117)

> [!NOTE]
> `VcpkgInstall` is marked with `@DisableCachingByDefault(because = "We rely on vcpkg's caches")`, and execution enforces a maximum parallelism of 1 task via `withLimitedParallelism("vcpkg", maxParallelTasks = 1)`.
> Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt:28-61](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgInstall.kt#L28-L61)

### Task Registration and Synchronization Helpers

Projects register installation and synchronization tasks using extension functions defined in `VcpkgTasks.kt`.
The `registerVcpkgInstallTask` function locates the Kotlin/Native download task, configures the target installation, and skips toolchain configuration on Apple families.
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt:16-34](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt#L16-L34)

```kotlin
fun Project.registerVcpkgInstallTask(
    library: String,
    target: KonanTarget,
    configure: VcpkgInstall.() -> Unit = {}
): TaskProvider<VcpkgInstall> {
    val downloadKotlinNative = tasks.maybeNamed<KotlinNativeDownloadTask>("downloadKotlinNativeDistribution")
    return tasks.register<VcpkgInstall>("${library}Install") {
        val kotlinNativeDistributionAvailable = downloadKotlinNative != null
        onlyIf("Kotlin distribution should be available") { kotlinNativeDistributionAvailable }
        if (!kotlinNativeDistributionAvailable) return@register

        install(library, target)
        if (!target.family.isAppleFamily) {
            nativeDirectoryLocation.set(downloadKotlinNative.flatMap { it.nativeDirectoryLocation })
        }
        configure()
    }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt:16-34](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt#L16-L34)

Additional helper functions sync headers and binaries from the `VcpkgInstall` output directory into designated project locations.
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt:36-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt#L36-L57)

```kotlin
fun Project.registerSyncHeadersTask(
    taskName: String,
    from: TaskProvider<VcpkgInstall>,
    into: File,
    library: String,
): TaskProvider<Sync> = tasks.register<Sync>(taskName) {
    from(from.map { it.outputDir.get().dir("include/$library") })
    into(into.resolve(library))
}

fun Project.registerSyncBinariesTask(
    taskName: String,
    from: TaskProvider<VcpkgInstall>,
    into: File,
    configure: Sync.() -> Unit = {}
): TaskProvider<Sync> = tasks.register<Sync>(taskName) {
    from(from.map { it.outputDir.get().dir("lib") }) {
        exclude("pkgconfig")
    }
    into(into)
    configure()
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt:36-57](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/vcpkg/VcpkgTasks.kt#L36-L57)

## Publication Tasks and Artifact Aggregation

### Overview

Build logic registers aggregating publish tasks and package.json aggregation tasks across targets to simplify multi-target publishing.
The `PublishTasks.kt` module defines publication groups including `jvmAndCommonPublications`, `webPublications`, `linuxPublications`, `windowsPublications`, `darwinPublications`, and `androidNativePublications`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:20-34](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L20-L34)

### Publication Availability and Aggregation

The `isAvailableForPublication` extension checks whether an `AbstractPublishToMaven` task matches the host operating system for target-specific platforms, while standard and web platforms remain universally available.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:36-50](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L36-L50)

```kotlin
internal fun AbstractPublishToMaven.isAvailableForPublication(publicationName: String, os: OperatingSystem): Boolean {
    return when (publicationName) {
        in linuxPublications -> os.isLinux
        in windowsPublications -> os.isWindows
        in darwinPublications -> os.isMacOsX
        in jvmAndCommonPublications,
        in webPublications,
        in androidNativePublications -> true

        else -> {
            logger.warn("Unknown publication: $publicationName (project ${project.path})")
            false
        }
    }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:36-50](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L36-L50)

Projects register aggregating publish tasks dynamically based on active targets through `registerTargetsPublishTasks` and `registerCommonPublishTask`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:52-70](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L52-L70)

```kotlin
internal fun Project.registerTargetsPublishTasks(targets: KtorTargets) = with(targets) {
    if (hasWeb) {
        val publishWebPublications = registerAggregatingPublishTask("Web", webPublications)
        // Add an alias for the old task name
        tasks.register("publishJsPublications") { dependsOn(publishWebPublications) }
    }
    if (hasLinux) registerAggregatingPublishTask("Linux", linuxPublications)
    if (hasWindows) registerAggregatingPublishTask("Windows", windowsPublications)
    if (hasDarwin) registerAggregatingPublishTask("Darwin", darwinPublications)
    if (hasAndroidNative) registerAggregatingPublishTask("AndroidNative", androidNativePublications)
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:60-70](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L60-L70)

> [!NOTE]
> `inferRepositoryName` inspects configured publishing repositories, rejecting configurations with multiple non-default repositories and defaulting to `MavenLocal` (`"MavenLocal"` constant) if none are specified.
> Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt:87-99](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/PublishTasks.kt#L87-L99)

### Package.json Aggregation Tasks

The `PackageJsonTask.kt` module manages npm package aggregation for `js` and `wasmJs` targets by registering aggregation tasks that depend on `PublicPackageJsonTask` instances across subprojects, wiring them into umbrella tasks on the root project.
Sources: [build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt:16-37](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt#L16-L37)

```kotlin
internal fun Project.registerPackageJsonAggregationTasks() {
    registerPackageJsonAggregationTask("js")
    registerPackageJsonAggregationTask("wasmJs")
}

private fun Project.registerPackageJsonAggregationTask(target: String) {
    tasks.register(aggregationTaskName(target)) {
        dependsOn(tasks.withType<PublicPackageJsonTask>().named { it.startsWith(target) })
    }
}
```
Sources: [build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt:16-25](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/PackageJsonTask.kt#L16-L25)

## Published Artifact Verification and Dumps

### Overview

The `ValidatePublishedArtifactsTask` infrastructure verifies that actual published artifacts match expected target publication dumps stored under `<rootProject>/gradle/artifacts/<taskName>.txt`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:43-46](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L43-L46)

### Task Execution and Artifact Validation Workflow

The task execution follows a strict initialization and action cycle:

1. `configurePublishTaskName()` inspects `project.gradle.startParameter.taskNames`, filtering out `validatePublishedArtifacts` (`NAME`) and argument flags starting with `-`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:86-90](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L86-L90)
2. If exactly one publishing task name is present, `publishTaskName` is set, and `artifactsDump` is mapped to `project.rootDir.resolve("gradle/artifacts/${sanitizedTaskName}.txt")`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:91-100](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L91-L100)
3. Task graph readiness configures `publishedArtifacts` by collecting outputs via `PublishToMavenRepository` instances: `allTasks.filterIsInstanceublishToMavenRepository>().forEach { publishTask -> publishedArtifacts.addAll(publishTask.publication.formatArtifacts()) }`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:76-80](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L76-L80)
4. `runValidation()` finalizes values, reads the expected dump file, and compares sorted artifact sets via `reportInconsistentArtifacts()` or `reportDumpFileMissing()`.
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:124-146](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L124-L146)

> [!WARNING]
> Running `validatePublishedArtifacts` without specifying exactly one peer publishing task results in a warning, task skipping via `onlyIf`, and missing artifact dependency wiring.
> Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:83-94](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L83-L94)

### Publication Formatting and Dump Structure

Artifact formatting converts `MavenPublication` instances into standardized path representations via `formatArtifacts()`:
```kotlin
private fun MavenPublication.formatArtifacts(): List<String> =
    artifacts.map { "${groupId}:${artifactId}/${it.classifier.orEmpty()}.${it.extension}" }
        .ifEmpty { listOf("$groupId:$artifactId") }
```
Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:178-180](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L178-L180)

Examples of expected dumps include platform-specific artifacts such as Windows mingwx64 and Linux linuxx64 publications:

| Target Platform | Sample Dump File Path | Example Artifact Entry | Sources |
| :--- | :--- | :--- | :--- |
| Windows mingwx64 | `gradle/artifacts/publishWindowsPublications.txt` | `io.ktor:ktor-client-curl-mingwx64/cinterop-libcurl.klib` | [gradle/artifacts/publishWindowsPublications.txt:22-24](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L22-L24) |
| Linux linuxx64 | `gradle/artifacts/publishLinuxPublications.txt` | `io.ktor:ktor-server-core-linuxx64/cinterop-host_common.klib` | [gradle/artifacts/publishLinuxPublications.txt:263-265](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L263-L265) |

Sources: [gradle/artifacts/publishWindowsPublications.txt:22-24](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishWindowsPublications.txt#L22-L24), [gradle/artifacts/publishLinuxPublications.txt:263-265](https://github.com/ktorio/ktor/blob/main/gradle/artifacts/publishLinuxPublications.txt#L263-L265)

> [!TIP]
> To update and save the current list of published artifacts as the new expected baseline, execute the task with the dump option: `./gradlew validatePublishedArtifacts --dump ublishTaskName>`.
> Sources: [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:36-38](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L36-L38), [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:131-141](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L131-L141), [build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt:173-174](https://github.com/ktorio/ktor/blob/main/build-logic/src/main/kotlin/ktorbuild/internal/publish/ValidatePublishedArtifactsTask.kt#L173-L174)

## Build Logic Architecture and Documentation

### Overview

Ktor manages build configuration and dependency versions through a centralized build logic architecture and version catalog.
Shared build logic resides in the `build-logic` project, which is included in the root `settings.gradle.kts` using composite builds to prevent caching or update staleness issues associated with traditional `buildSrc` structures.
Version definitions are centralized in `gradle/libs.versions.toml`.
Contributors must adhere to defined branching strategies, pull request validation checks, and code style standards when modifying the project.
Sources: [CONTRIBUTING.md:1-212](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L1-L212), [AGENTS.md:1-137](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L1-L137), [build-logic/README.md:1-22](https://github.com/ktorio/ktor/blob/main/build-logic/README.md#L1-L22), [gradle/libs.versions.toml:1-267](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L1-L267)

### Version Catalog and Build Logic Reference

The root `settings.gradle.kts` incorporates the shared `build-logic` composite build, allowing subprojects to apply build plugins such as `id("ktorbuild.base")`.
Version declarations for Kotlin, coroutines, serialization, testing frameworks, and external server engines are stored in `gradle/libs.versions.toml`.
Sources: [gradle/libs.versions.toml:1-267](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L1-L267), [build-logic/README.md:8-20](https://github.com/ktorio/ktor/blob/main/build-logic/README.md#L8-L20)

| Catalog Section | Key References / Versions | Example Module Entry | Sources |
| :--- | :--- | :--- | :--- |
| `[versions]` | `kotlin = "2.3.21"`, `coroutines = "1.11.0"`, `serialization = "1.11.0"`, `slf4j = "2.0.18"` | N/A | [gradle/libs.versions.toml:3-14](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L3-L14) |
| `[libraries]` | `kotlin-stdlib`, `kotlinx-coroutines-core`, `slf4j-api`, `ktor-client-core` equivalents | `kotlin-gradlePlugin = { module = "org.jetbrains.kotlin:kotlin-gradle-plugin", version.ref = "kotlin" }` | [gradle/libs.versions.toml:108-111](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L108-L111) |
| `[plugins]` | `kover`, `doctor`, `buildconfig` | `kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }` | [gradle/libs.versions.toml:262-266](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L262-L266) |

Sources: [gradle/libs.versions.toml:3-14](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L3-L14), [gradle/libs.versions.toml:108-111](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L108-L111), [gradle/libs.versions.toml:262-266](https://github.com/ktorio/ktor/blob/main/gradle/libs.versions.toml#L262-L266)

### Contributor Guidelines and Verification Workflow

Contributors must follow specific branch conventions, code style rules, and verification pipelines.
The primary branch `main` targets next minor or major releases with breaking changes allowed only in major versions, whereas `release/*` branches target patch releases.
Before submitting pull requests, developers must execute verification and formatting tasks.
Sources: [CONTRIBUTING.md:14-210](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L14-L210), [AGENTS.md:1-137](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L1-L137)

> [!IMPORTANT]
> When modifying public or protected APIs, you must update ABI signature files by executing `./gradlew :module-name:updateKotlinAbi` to prevent binary compatibility check failures during build validation.
> Sources: [CONTRIBUTING.md:179-182](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L179-L182), [AGENTS.md:6-12](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L6-L12), [AGENTS.md:130-134](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L130-L134)

| Task Name | Target Module Scope | Purpose | Sources |
| :--- | :--- | :--- | :--- |
| `./gradlew :module-name:assemble` | Module-specific | Builds the module artifacts and checks compilation. | [AGENTS.md:50-51](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L50-L51) |
| `./gradlew :module-name:jvmTest` | Module-specific | Executes JVM test suite for the target module. | [AGENTS.md:55-56](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L55-L56) |
| `./gradlew :module-name:formatKotlin` | Module-specific | Reformats code according to project EditorConfig rules. | [AGENTS.md:63-64](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L63-L64) |
| `./gradlew :module-name:lintKotlin` | Module-specific | Lints the module source files for style violations. | [AGENTS.md:64-65](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L64-L65) |
| `./gradlew :module-name:updateKotlinAbi` | Module-specific | Updates public ABI signature dump files after API changes. | [AGENTS.md:133-135](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L133-L135) |

Sources: [CONTRIBUTING.md:23-32](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L23-L32), [CONTRIBUTING.md:179-182](https://github.com/ktorio/ktor/blob/main/CONTRIBUTING.md#L179-L182), [AGENTS.md:50-51](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L50-L51), [AGENTS.md:55-56](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L55-L56), [AGENTS.md:63-65](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L63-L65), [AGENTS.md:133-135](https://github.com/ktorio/ktor/blob/main/AGENTS.md#L133-L135)

## Related

- [[Project Structure]]

