# Changelog

All notable changes to `@flux/create-android` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial scaffolder with `multi` and `single` arch templates.
- Pinned stack snapshot: AGP 9.1.1, Kotlin 2.4.0, Gradle 9.5.1, compileSdk 37, NDK 29.0.14206865.
- Per-platform Bun-compiled binaries (darwin-arm64/x64, linux-x64/arm64, windows-x64).
- Node 18+ shim in the main package that dispatches to the matching optional dep.
