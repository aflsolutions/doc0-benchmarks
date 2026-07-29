# Packaging & Release

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/main.rs](https://github.com/sharkdp/fd/blob/main/src/main.rs)
- [README.md](https://github.com/sharkdp/fd/blob/main/README.md)
- [scripts/create-deb.sh](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh)
- [src/exec/mod.rs](https://github.com/sharkdp/fd/blob/main/src/exec/mod.rs)
- [src/walk.rs](https://github.com/sharkdp/fd/blob/main/src/walk.rs)
- [src/exec/job.rs](https://github.com/sharkdp/fd/blob/main/src/exec/job.rs)
- [doc/release-checklist.md](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md)
- [Cargo.toml](https://github.com/sharkdp/fd/blob/main/Cargo.toml)
- [scripts/version-bump.sh](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh)
- [CONTRIBUTING.md](https://github.com/sharkdp/fd/blob/main/CONTRIBUTING.md)
- [src/cli.rs](https://github.com/sharkdp/fd/blob/main/src/cli.rs)
- [Cross.toml](https://github.com/sharkdp/fd/blob/main/Cross.toml)
- [src/exec/command.rs](https://github.com/sharkdp/fd/blob/main/src/exec/command.rs)
- [src/regex_helper.rs](https://github.com/sharkdp/fd/blob/main/src/regex_helper.rs)
- [src/hyperlink.rs](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs)
- [src/exit_codes.rs](https://github.com/sharkdp/fd/blob/main/src/exit_codes.rs)
- [src/filter/size.rs](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs)
- [src/filesystem.rs](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs)
- [doc/sponsors.md](https://github.com/sharkdp/fd/blob/main/doc/sponsors.md)
- [doc/screencast.sh](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh)
- [SECURITY.md](https://github.com/sharkdp/fd/blob/main/SECURITY.md)
- [rustfmt.toml](https://github.com/sharkdp/fd/blob/main/rustfmt.toml)
- [src/filter/mod.rs](https://github.com/sharkdp/fd/blob/main/src/filter/mod.rs)
</details>

## Overview

The packaging and release infrastructure for `fd` governs how the software is configured, compiled across target platforms, and distributed to end-users. By integrating Cargo package metadata, automated Debian package generation scripts, and cross-compilation environments, the system ensures consistent and repeatable builds across diverse operating systems and processor architectures. Scripted workflows for version management and structured pre-release checklists maintain synchronization across project documentation and repository files. Sources: [Cargo.toml:1-22](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L1-L22), [scripts/create-deb.sh:1-136](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L1-L136), [scripts/version-bump.sh:1-22](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L1-L22), [doc/release-checklist.md:1-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L1-L70)

## Cargo Package Manifest Configuration

### Cargo Package Manifest Configuration

### Overview

The `Cargo.toml` manifest governs the package metadata, binary targets, dependencies, target-specific platform constraints, compilation profiles, and cargo-binstall distribution metadata for `fd`. The package is identified under the crate name `fd-find`, specifying version `10.4.2`, edition `2024`, and a minimum supported Rust version (`rust-version`) of `190.0`. Sources: [Cargo.toml:1-22](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L1-L22)

### Package Metadata and Binary Definition

Core metadata fields define the crate identity, licensing, repository locations, and build exclusions. The binary target maps the executable name `fd` directly to its source entry point.

| Manifest Property | Value | Source Line |
| :--- | :--- | :--- |
| `name` | `fd-find` | [Cargo.toml:16](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L16) |
| `version` | `10.4.2` | [Cargo.toml:19](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L19) |
| `edition` | `2024` | [Cargo.toml:20](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L20) |
| `rust-version` | `190.0` | [Cargo.toml:21](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L21) |
| `license` | `MIT OR Apache-2.0` | [Cargo.toml:15](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L15) |
| `exclude` | `["/benchmarks/*"]` | [Cargo.toml:5](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L5) |
| Binary Name | `fd` | [Cargo.toml:30](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L30) |
| Binary Path | `src/main.rs` | [Cargo.toml:31](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L31) |

Sources: [Cargo.toml:5](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L5), [Cargo.toml:15-21](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L15-L21), [Cargo.toml:29-32](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L29-L32)

### Dependencies and Target Platforms

Dependencies are partitioned into general runtime crates, feature-gated command-line completion generators, and target-specific platform libraries for Unix and memory allocation.

| Dependency | Version / Specification | Purpose |
| :--- | :--- | :--- |
| `aho-corasick` | `1.1` | Fast string searching |
| `nu-ansi-term` | `0.50` | ANSI color and style support |
| `argmax` | `0.4.0` | Argument vector length estimation |
| `ignore` | `0.4.25` | Glob and `.gitignore` file traversal |
| `regex` | `1.12.2` | Regular expression engine |
| `regex-syntax` | `0.8` | Regular expression parsing |
| `ctrlc` | `3.5` | Interrupt signal handling |
| `globset` | `0.4` | Multiple glob pattern matching |
| `anyhow` | `1.0` | Error handling primitives |
| `etcetera` | `0.11` | Home directory and configuration paths |
| `normpath` | `1.5.1` | Path normalization |
| `crossbeam-channel` | `0.5.15` | Multi-producer multi-consumer channels |
| `clap_complete` | `{version = "4.6.5", optional = true}` | Shell completion generation |
| `faccess` | `0.2.4` | File accessibility checks |
| `jiff` | `0.2.27` | Date and time library |
| `clap` | `version = "4.6.1", features = ["suggestions", "color", "wrap_help", "cargo", "derive"]` | Command-line argument parsing |
| `lscolors` | `version = "0.21", default-features = false, features = ["nu-ansi-term"]` | LS_COLORS file type coloring |
| `nix` | `version = "0.31.1", default-features = false, features = ["signal", "user", "hostname"]` | Unix system APIs (Unix target only) |
| `libc` | `0.2` | Low-level C bindings (Unix excluding Redox) |
| `tikv-jemallocator` | `{version = "0.7.0", optional = true}` | Custom memory allocator (conditional non-Windows/Android/macOS/FreeBSD/OpenBSD/Illumos/musl-32/riscv64) |

Sources: [Cargo.toml:33-72](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L33-L72)

> [!WARNING]
> Jemalloc allocator integration via `tikv-jemallocator` is explicitly disabled on macOS, Windows, Android, FreeBSD, OpenBSD, Illumos, 32-bit musl, and riscv64 targets due to platform-specific compatibility issues such as macOS Catalina bugs. The allocator selection in `Cargo.toml` must remain synchronized with `src/main.rs`.
> Sources: [Cargo.toml:65-72](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L65-L72)

### Compilation Profiles and Features

The manifest defines custom build profiles for debugging and release optimization, alongside feature flags that toggle jemalloc and shell completion generation.

| Profile / Feature | Configuration / Mappings | Sources |
| :--- | :--- | :--- |
| `[profile.dev]` | `debug = "line-tables-only"` | [Cargo.toml:79-80](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L80) |
| `[profile.dev.package."*"]` | `debug = false` | [Cargo.toml:82-84](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L82-L84) |
| `[profile.debugging]` | `inherits = "dev"`, `debug = true` | [Cargo.toml:85-88](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L85-L88) |
| `[profile.release]` | `lto = true`, `strip = true`, `codegen-units = 1` | [Cargo.toml:89-93](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L89-L93) |
| `use-jemalloc` feature | `["tikv-jemallocator"]` | [Cargo.toml:94-95](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L94-L95) |
| `completions` feature | `["clap_complete"]` | [Cargo.toml:96](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L96) |
| `base` feature | `["use-jemalloc"]` | [Cargo.toml:97](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L97) |
| `default` feature | `["completions"]` | [Cargo.toml:98](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L98) |

Sources: [Cargo.toml:79-98](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L98)

## Debian Package Generation Scripting

### Overview

The `scripts/create-deb.sh` build script automates packaging the compiled `fd` binary, documentation, shell completions, and license metadata into a compliant Debian binary package (`.deb`). It resolves target architectures, configures package naming conventions, compiles copyright files, generates control metadata, and invokes `dpkg-deb`.

Sources: [scripts/create-deb.sh:1-136](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L1-L136)

### Target Resolution and Package Variant Mapping

The script inspects environmental variables or queries the rust compiler to establish the target triple, translating it into Debian architecture identifiers and package basenames.

| Target Pattern | DPKG_BASENAME | DPKG_CONFLICTS | DPKG_ARCH | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `*-musl*` | `fd-musl` | `fd, fd-find` | dynamic | [scripts/create-deb.sh:13-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L13-L22), [scripts/create-deb.sh:29-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L29-L35) |
| `aarch64-*-linux-*` | `fd` | `fd-musl, fd-find` | `arm64` | [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:30](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L30) |
| `arm-*-linux-*hf` | `fd` | `fd-musl, fd-find` | `armhf` | [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:31](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L31) |
| `i686-*-linux-*` | `fd` | `fd-musl, fd-find` | `i686` | [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:32](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L32) |
| `x86_64-*-linux-*` | `fd` | `fd-musl, fd-find` | `amd64` | [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:33](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L33) |
| Other / Default | `fd` | `fd-musl, fd-find` | `notset` | [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:34](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L34) |

Sources: [scripts/create-deb.sh:13-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L13-L35)

> [!WARNING]
> If the `TARGET` string does not match any known pattern, `DPKG_ARCH` is set to `notset` and `DPKG_BASENAME` defaults to `fd`, which will cause `dpkg-deb` to generate an invalid architecture package unless overridden in the calling CI pipeline.
> Sources: [scripts/create-deb.sh:18-22](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L22), [scripts/create-deb.sh:28-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L29-L35)

### Staging Layout and Asset Installation Execution

The packaging script populates staging directories through structured file installation commands. The execution flow follows a precise asset staging sequence:

1. Staging root creation: Directory paths (`${DPKG_DIR}` and `${DPKG_DIR}/DEBIAN`) are established via `mkdir -p`.
Sources: [scripts/create-deb.sh:6-7](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L6-L7), [scripts/create-deb.sh:109-109](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L109-L109)
2. Binary installation: The release binary located at `${BIN_PATH}` is installed to `${DPKG_DIR}/usr/bin/fd` with executable permissions (`0755`).
Sources: [scripts/create-deb.sh:39-42](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L39-L42)
3. Documentation compression: The man page `doc/fd.1` and changelog are installed, compressed using `gzip -n --best`, and positioned under `/usr/share/man/man1/` and `/usr/share/doc/${DPKG_BASENAME}/`.
Sources: [scripts/create-deb.sh:44-46](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L44-L46), [scripts/create-deb.sh:57-58](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L57-L58)
4. Completion integration: Bash, Fish, and Zsh completion assets are copied for both `fd` and the aliased `fdfind` command, alongside a symlink from `/usr/bin/fd` to `/usr/bin/fdfind`.
Sources: [scripts/create-deb.sh:48-52](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L48-L52), [scripts/create-deb.sh:60-65](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L60-L65)
5. Metadata generation: Copyright terms, licensing text (Apache-2.0 or MIT), and the control file are written to disk before invoking `fakeroot dpkg-deb --build`.
Sources: [scripts/create-deb.sh:67-125](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L67-L125), [scripts/create-deb.sh:135-135](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L135-L135)

## Cross Compilation Target Setup

### Overview

Cross-compilation target environments are configured via the `Cross.toml` file to address platform-specific requirements and build constraints. Specifically, the configuration targets ARM 64-bit architectures on both GNU and musl libc environments to pass necessary environment variables down to dependency crates during compilation.
Sources: [Cross.toml:1-7](https://github.com/sharkdp/fd/blob/main/Cross.toml#L1-L7)

### Target Environment Definitions

The build tool utilizes explicit environment variable pass-through declarations for cross-compilation targets. The configuration addresses issue #1085 by adjusting memory page allocation parameters for the jemalloc allocator dependency on ARM platforms.
Sources: [Cross.toml:1-7](https://github.com/sharkdp/fd/blob/main/Cross.toml#L1-L7)

| Target Architecture | Environment Section | Configuration Key | Passed Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `aarch64-unknown-linux-gnu` | `[target.aarch64-unknown-linux-gnu.env]` | `passthrough` | `["JEMALLOC_SYS_WITH_LG_PAGE=16"]` | Configures jemalloc page size for ARM64 GNU targets |
| `aarch64-unknown-linux-musl` | `[target.aarch64-unknown-linux-musl.env]` | `passthrough` | `["JEMALLOC_SYS_WITH_LG_PAGE=16"]` | Configures jemalloc page size for ARM64 musl targets |
Sources: [Cross.toml:1-7](https://github.com/sharkdp/fd/blob/main/Cross.toml#L1-L7)

> [!NOTE]
> The `JEMALLOC_SYS_WITH_LG_PAGE=16` setting overrides the default page size configuration for `jemalloc-sys` to ensure compatibility with 64KB page size kernels commonly found on certain ARM64 hardware architectures.
> Sources: [Cross.toml:1-7](https://github.com/sharkdp/fd/blob/main/Cross.toml#L1-L7)

## Automated Version Bumping Workflow

### Overview

The automated version bumping workflow is managed through the `scripts/version-bump.sh` shell script, which enforces strict execution parameters using `set -eu` and coordinates version updates across repository configuration and documentation files.
Sources: [scripts/version-bump.sh:1-3](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L1-L3), [scripts/version-bump.sh:5-5](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L5-L5)

### Execution Flow and Version Propagation

The version bumping script processes input arguments and executes file modifications in a strict sequential order. If the version argument is omitted, the script prints a usage error to standard error and exits with code 1.
Sources: [scripts/version-bump.sh:7-12](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L7-L12)

The execution sequence proceeds through the following operations:
1. Branch creation: Creates and switches to a new git branch named `release-$version` using `git switch -C`.
Sources: [scripts/version-bump.sh:14-14](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L14-L14)
2. Manifest update: Updates the version string in `Cargo.toml` under the badges section using `sed`.
Sources: [scripts/version-bump.sh:15-15](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L15-L15)
3. MSRV extraction: Extracts the minimum supported Rust version from `Cargo.toml` by parsing the `rust-version` field with `grep` and `sed`.
Sources: [scripts/version-bump.sh:17-17](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L17-L17)
4. Documentation synchronization: Updates `README.md` to reference the extracted MSRV dynamically.
Sources: [scripts/version-bump.sh:19-19](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L19-L19)
5. Changelog rollover: Replaces the `# Upcoming release` header in `CHANGELOG.md` with the new version string.
Sources: [scripts/version-bump.sh:21-21](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L21-L21)

> [!WARNING]
> The script requires a valid version string as its first positional argument and will immediately terminate with exit code 1 if the argument is empty or missing.
> Sources: [scripts/version-bump.sh:7-12](https://github.com/sharkdp/fd/blob/main/scripts/version-bump.sh#L7-L12)

## Release Lifecycle and Checklist Procedures

### Overview

Executing project releases and verifying release integrity follows a strict, multi-phase procedure outlined in the release checklist document. Contributors and maintainers execute these verification steps sequentially across version bumping, pre-release validation, deployment tagging, and post-release cleanup.
Sources: [doc/release-checklist.md:1-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L1-L70)

### Version Bump Phase

The release process begins with isolating changes in a dedicated release branch, updating package manifests, and rolling over documentation and changelog headers.
Sources: [doc/release-checklist.md:6-19](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L6-L19)

- Create a new branch for the required changes for the release.
Sources: [doc/release-checklist.md:11-11](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L11-L11)
- Update the version field in `Cargo.toml`, run `cargo build` to update `Cargo.lock`, and stage the lockfile changes using `git add`.
Sources: [doc/release-checklist.md:12-13](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L12-L13)
- Identify the minimum supported Rust version by running `grep rust-version Cargo.toml`.
Sources: [doc/release-checklist.md:14-15](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L14-L15)
- Update both the `fd` version and the minimum supported Rust version references inside `README.md`.
Sources: [doc/release-checklist.md:16-16](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L16-L16)
- Update `CHANGELOG.md` by changing the heading of the *"Upcoming release"* section to the specific version of the release.
Sources: [doc/release-checklist.md:17-19](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L17-L19)

> [!NOTE]
> The version bump procedures can alternatively be automated by invoking `scripts/version-bump.sh` with the target version string passed as a positional argument.
> Sources: [doc/release-checklist.md:8-9](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L8-L9)

### Pre-Release Checks and Updates

Before pushing tags or publishing packages, maintainers validate local installations, review help output, and run dry-run publishing checks.
Sources: [doc/release-checklist.md:20-34](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L20-L34)

- Install the release candidate locally via `cargo install --locked -f --path .` and verify that `fd --version` reflects the new version on the system `PATH`.
Sources: [doc/release-checklist.md:22-24](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L22-L24)
- Review command-line flags (`-h`, `--help`) and manual pages.
Sources: [doc/release-checklist.md:25-25](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L25-L25)
- Regenerate and update the *"Command-line options"* section in `README.md` by running `gawk -i inplace -f scripts/update-help.awk README.md`.
Sources: [doc/release-checklist.md:26-27](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L26-L27)
- Push all changes to remote and wait for CI workflows to succeed.
Sources: [doc/release-checklist.md:28-29](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L28-L29)
- Optionally perform manual testing of new features and flags documented in `CHANGELOG.md`.
Sources: [doc/release-checklist.md:30-31](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L30-L31)
- Execute `cargo publish --dry-run` to verify that registry publishing will succeed without error.
Sources: [doc/release-checklist.md:32-33](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L32-L33)

### Release Execution and Post-Release

The actual deployment stage merges the release branch, pushes immutable git tags to trigger GitHub Actions publishing, and initializes the next development cycle.
Sources: [doc/release-checklist.md:35-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L35-L70)

- Perform a fast-forward merge of the release branch.
Sources: [doc/release-checklist.md:37-37](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L37-L37)
- Create and push a version tag using `git tag vX.Y.Z; git push origin tag vX.Y.Z` to trigger automated binary deployments via GitHub Actions.
Sources: [doc/release-checklist.md:38-41](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L38-L41)
- Create a new release on GitHub, set the title to the tag name, paste release notes copied from `CHANGELOG.md`, and publish.
Sources: [doc/release-checklist.md:42-46](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L42-L46)
- Verify that binary archives and Debian packages populate upon CI completion for the git tag, and publish to crates.io by running `cargo publish` inside a freshly cloned, clean repository.
Sources: [doc/release-checklist.md:47-51](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L47-L51)
- Prepare the `CHANGELOG.md` for the next cycle by inserting a new `# Upcoming release` header with empty `Features`, `Bugfixes`, `Changes`, and `Other` subsections.
Sources: [doc/release-checklist.md:52-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L52-L70)

## Related

- [[Quick Start]]

