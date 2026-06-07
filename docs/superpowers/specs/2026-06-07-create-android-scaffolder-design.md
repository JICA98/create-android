# `@flux/create-android` — Design

**Date:** 2026-06-07
**Status:** Approved (pending spec review)
**Author:** Brainstorming session

## 1. Purpose

Ship an `npx`-installable CLI that scaffolds a new Android project from a
versioned template, with the Android stack pinned per scaffolder release. Two
architecture shapes are supported: a NowInAndroid-style multi-module project
and a single-module project with feature folders.

## 2. High-level decisions

| Decision | Choice | Rationale |
|---|---|---|
| npm package name | `@flux/create-android` | Scoped, matches `@flux` org. |
| Template source | Inline in the npm package | One publish = one atomic version. |
| Arch variants | `multi` and `single`, picked via `--arch` | One tool covers both camps. |
| Input mode | Interactive prompts with flag overrides | Human-friendly, CI-friendly. |
| Versioning model | npm tags; user pins via `@version`; no auto-upgrade | Reproducible, simple. |
| Runtime/build | Pure Bun, `bun build --compile` per platform; Node shim dispatches | Honors Bun-for-dev; works with `npx`; no Node-API constraints. |
| Interactive lib | `@clack/prompts` | Modern, lightweight, TTY-aware. |
| Templating | Custom: `__name__` for path tokens, `{{var}}` for content tokens | No extra dep, easy to test, easy to learn. |
| Pinned stack | AGP 9.1.1 · Kotlin 2.4.0 · Gradle 9.5.1 · compileSdk 37 · targetSdk 37 · NDK 29.0.14206865 | Bleeding edge — Android 17 is at last beta with API surface locked. |

## 3. Repository layout

```
android-kotlin-starter/
├── src/
│   ├── cli.ts                  # entrypoint: arg parsing, dispatches
│   ├── commands/
│   │   └── create.ts           # the `create` command
│   ├── prompts.ts              # interactive prompt definitions
│   ├── prompts-validate.ts     # validates user inputs
│   ├── scaffold/
│   │   ├── render.ts           # walks a template tree, substitutes vars
│   │   ├── tokens.ts           # path + content token definitions
│   │   └── write.ts            # writes rendered files to disk
│   └── version.ts              # reads the pinned stack snapshot
├── templates/
│   ├── multi/                  # multi-module Android template
│   │   └── __name__/           # → resolves to user-chosen app name
│   │       ├── settings.gradle.kts
│   │       ├── build.gradle.kts
│   │       ├── gradle.properties
│   │       ├── app/
│   │       ├── core/{designsystem,data}/
│   │       ├── feature/home/
│   │       └── build-logic/convention/
│   └── single/                 # single-module with feature folders
│       └── __name__/
│           ├── settings.gradle.kts
│           ├── build.gradle.kts
│           └── app/src/main/...
├── stack/
│   └── snapshot.json           # the pinned Android stack for this release
├── tests/
│   ├── render.test.ts
│   ├── tokens.test.ts
│   ├── prompts-validate.test.ts
│   ├── cli.test.ts
│   └── fixtures/
│       ├── golden-multi/
│       └── golden-single/
├── scripts/
│   ├── build.ts                # `bun build --compile` per platform
│   ├── publish.ts              # orchestrates the npm publish flow
│   └── check-snapshot.ts       # fails if template versions disagree with snapshot
├── bin/
│   └── shim.js                 # Node wrapper, dispatches to platform binary
├── package.json
├── tsconfig.json
├── bunfig.toml
├── CLAUDE.md
└── README.md
```

## 4. Distribution & binaries

**Main package** (`@flux/create-android`):

```jsonc
{
  "name": "@flux/create-android",
  "version": "1.0.0",
  "type": "module",
  "bin": { "create-android": "./bin/shim.js" },
  "engines": { "node": ">=18" },
  "files": ["bin", "dist", "templates", "stack", "README.md", "LICENSE"],
  "scripts": {
    "build": "bun run scripts/build.ts",
    "publish": "bun run scripts/publish.ts",
    "check": "bun test && bun run scripts/check-snapshot.ts",
    "test": "bun test"
  },
  "optionalDependencies": {
    "@flux/create-android-darwin-arm64": "1.0.0",
    "@flux/create-android-darwin-x64":  "1.0.0",
    "@flux/create-android-linux-x64":   "1.0.0",
    "@flux/create-android-linux-arm64": "1.0.0",
    "@flux/create-android-windows-x64": "1.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
```

**`bin/shim.js`** — small Node 18+ wrapper. Resolves the correct platform
binary from the matching optional dep and `exec`s it.

```js
#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const map = {
  "darwin+arm64": "@flux/create-android-darwin-arm64",
  "darwin+x64":   "@flux/create-android-darwin-x64",
  "linux+x64":    "@flux/create-android-linux-x64",
  "linux+arm64":  "@flux/create-android-linux-arm64",
  "win32+x64":    "@flux/create-android-windows-x64",
};
const key = `${process.platform}+${process.arch}`;
const pkg = map[key];
if (!pkg) {
  console.error(`create-android: unsupported platform ${key}`);
  process.exit(1);
}
let binPath;
try {
  binPath = require.resolve(`${pkg}/bin/create-android`);
} catch {
  console.error(
    `create-android: platform binary not installed (${pkg}). ` +
    `Re-run with: npm i -g @flux/create-android@${require("./package.json").version}`,
  );
  process.exit(1);
}
execFileSync(binPath, process.argv.slice(2), { stdio: "inherit" });
```

**Per-platform sub-packages** are tiny: a single `package.json` plus
`bin/create-android` (the `bun build --compile` output for that
OS+architecture). Each is published as a separate npm package at the same
version as the main package.

**Unsupported platform fallback:** the shim errors with a clear message. No
silent fallthrough.

**Publishing flow** (`scripts/publish.ts`):

1. `bun run scripts/build.ts` produces binaries for darwin-arm64, darwin-x64,
   linux-x64, linux-arm64, windows-x64, writing them into each per-platform
   package's `bin/`.
2. Bumps version in lockstep across all 6 `package.json` files.
3. Runs `npm publish` in order: platform packages first, then the main
   package last, so `optionalDependencies` references resolve.

## 5. Template system

**Path tokens** — `__name__` in any directory or file name is renamed to the
user's app name at render time. Filesystem-safe, easy to grep, doesn't
collide with source code.

**Content tokens** — inside file contents: `{{name}}`, `{{package}}`,
`{{packagePath}}`, `{{packageNamespace}}`, `{{packageName}}`. Rendered by a
tiny custom string-replace, not Handlebars/EJS. Binary files (detected by
null byte) skip content substitution.

**Token definitions** (`src/scaffold/tokens.ts`):

```ts
export type Tokens = {
  name: string;             // e.g. "MyApp"
  package: string;          // e.g. "com.flux.coolapp"  (full id)
  packagePath: string;      // e.g. "com/flux/coolapp"   (slashed for folders)
  packageNamespace: string; // e.g. "com.flux"           (everything before last segment)
  packageName: string;      // e.g. "coolapp"            (last segment)
};
```

These are derived once at the start of a render from raw user inputs.

**Render algorithm** (`src/scaffold/render.ts`):

1. Read `templates/<arch>/__name__` recursively into a tree of
   `{ relPath, absPath, isDir, isFile }` entries.
2. For each entry:
   - If the entry's name (or any parent dir name) is `__name__`, replace it
     with `tokens.name` in the resolved output path.
   - If the entry is a file, read it as UTF-8, run a single-pass `replaceAll`
     of each `{{var}}` with its value. If the original file contains null
     bytes, treat it as binary and skip substitution.
3. Materialize the resolved tree under the chosen output directory, creating
   parent dirs as needed.
4. Skip an ignore list: `.git`, `.DS_Store`, `__pycache__`,
   `*.tmpl.bak`.
5. Print a one-line summary: `✔ Wrote N files (M directories) to <path> from
   template <arch>@<version>`.

## 6. CLI behavior

**Command shape (single command, no subcommands for v1):**

```
create-android [projectDir] [flags]
```

`projectDir` is the first positional arg. If omitted, the user is prompted.

**Flags:**

| Flag | Short | Description |
|---|---|---|
| `--name <string>` | `-n` | App name. Prompts if omitted. |
| `--package <string>` | `-p` | Android application id. Prompts if omitted. |
| `--arch <multi\|single>` | `-a` | Project shape. Prompts if omitted. |
| `--stack` | | Print the pinned stack snapshot and exit. |
| `--version` | `-v` | Print scaffolder version and exit. |
| `--help` | `-h` | Print usage and exit. |
| `--no-install` | | Skip the "next steps" printout (for CI). |
| `--force` | | Overwrite an existing non-empty target dir. |
| `--dry-run` | | Render to a temp dir and print the diff. Don't write. |

**Interactive prompts** (`@clack/prompts`):

1. `projectDir` — text input, default = `./<name>`. Validated.
2. `name` — derived from `projectDir` basename, PascalCased. User can override.
3. `package` — text input, default = `com.example.<lowercased-name>`. The user
   is expected to change this to their own namespace before publishing to
   the Play Store.
4. `arch` — select: `multi` / `single` with one-line descriptions.

**Validation rules:**

- `name`: PascalCase, must start with a letter, letters/digits only.
- `package`: lowercase dotted, ≥ 2 segments, no reserved Java/Kotlin keyword
  segments.
- `projectDir`: must resolve under cwd, not a file, not a non-empty dir
  (unless `--force`).
- Reserved names: `test`, `core`, `build`, `gradle`, `settings`, `app`.
- `package` segments may not start with a digit or be a Java reserved
  keyword.

**On success, prints:**

```
✔ Created ./MyApp from template multi@1.0.0
  Stack: AGP 9.1.1 · Kotlin 2.4.0 · Gradle 9.5.1 · compileSdk 37 · targetSdk 37

Next steps:
  cd MyApp
  ./gradlew :app:assembleDebug
```

**On error, prints:**

- All errors go to stderr with a leading `✖`, exit code 1.
- Validation errors: re-prompt once for interactive input; fail fast for
  flag-supplied values.
- Render errors: print which file failed and why, exit 1, **do not** delete
  the partial target dir (matches `npm create` / `cargo new` behavior).

**TTY detection:**

If `process.stdout.isTTY` is false, prompts are suppressed and missing
required input fails fast with: `error: Missing required input: --name.
Re-run in a TTY or pass --name/--package/--arch.`

## 7. Versioning & release flow

**`stack/snapshot.json` shape (v1.0.0):**

```json
{
  "agp": "9.1.1",
  "kotlin": "2.4.0",
  "gradle": "9.5.1",
  "compileSdk": 37,
  "targetSdk": 37,
  "minSdk": 24,
  "ndk": "29.0.14206865",
  "composeBom": "2026.05.00",
  "hilt": "2.55",
  "notes": "Android 17 (API 37) at last-beta. Stable AOSP later in 2026."
}
```

`minSdk = 24` (Android 7.0) — covers ~98% of devices, supports the current
stack cleanly.

**Release flow:**

1. Update `stack/snapshot.json` to the new pin.
2. Bump the templates so all hardcoded versions (`gradle/libs.versions.toml`,
   `gradle/wrapper/gradle-wrapper.properties`, etc.) match the snapshot.
   `scripts/check-snapshot.ts` fails CI if any hardcoded version disagrees.
3. Bump version in lockstep across all 6 `package.json` files (the main
   package plus 5 platform packages). For the very first publish this is
   the initial version, not a bump.
4. Tag & push. `scripts/publish.ts` orchestrates: builds binaries →
   publishes 5 platform packages → publishes main package.
5. Update `CHANGELOG.md` with the new stack snapshot and a one-line note per
   change.

**User consumption:**

- `npx @flux/create-android my-app` → latest tag.
- `npx @flux/create-android@1.4.2 my-app` → pins to a specific version.
- `npx @flux/create-android@^1 my-app` → latest 1.x.
- `npx @flux/create-android@2 my-app` → major bump (lockstep with breaking
  template changes, e.g. AGP 8.x → 9.x).
- `--stack` prints the current pin.

**Backporting policy:**

- Old npm versions are frozen. No backports.
- Security fixes to a pinned dep may get a patch release on a previous major
  (e.g. `1.4.3`). Decision is per-incident; documented in `CHANGELOG.md`.

**Compatibility matrix** lives in `README.md` as a single table — the answer
to "what version should I use":

| Scaffolder | AGP | Kotlin | Gradle | compileSdk |
|---|---|---|---|---|
| 1.0.x | 9.1.1 | 2.4.0 | 9.5.1 | 37 |

(Future rows added on each major release. The matrix starts at 1.0.x — no
pre-release was published.)

## 8. Testing

**1. Unit tests (Bun) — scaffolder logic**

- `tokens.test.ts` — given a `Tokens` object, asserts every `{{var}}` is
  replaced; no token leaks in rendered output.
- `prompts-validate.test.ts` — name/package/arch validation: rejects
  `My-App`, `com.123`, `test` as name, accepts valid forms. Property-test
  style: random inputs match the validation predicate.
- `render.test.ts` — golden-tree comparison. For each `templates/<arch>`,
  render into a temp dir with fixture input, diff against
  `tests/fixtures/golden-<arch>/`. Fails on missing/extra/different files.
- `cli.test.ts` — spawns the compiled binary, asserts exit code and stdout/
  stderr snapshots for: no-args, full-flags, `--arch=single`, conflict,
  `--stack`, `--version`, `--help`, non-TTY.

**2. Integration test — template builds in CI**

GitHub Actions matrix on every PR:

- For each arch (multi, single), scaffold into a clean temp dir.
- Run `./gradlew help` (cheap; verifies structure parses, modules resolve).
- Run `./gradlew :app:dependencies --configuration releaseRuntimeClasspath`
  to ensure libs.versions.toml resolves.
- On `main` only, additionally run `./gradlew :app:assembleDebug` to confirm
  a real APK assembles. PRs skip the full build to keep CI under 10 min.

**3. Snapshot test — `--stack` output**

Renders the snapshot JSON to a fixed-width banner, compares against a
checked-in string. Catches accidental reformatting.

**4. Release pre-flight**

`scripts/publish.ts` refuses to publish if:

- `bun test` is failing.
- `stack/snapshot.json` disagrees with any hardcoded version in templates
  (`scripts/check-snapshot.ts`).
- The per-platform binaries don't all build.
- The version in all 6 `package.json` files doesn't match.

**5. Local check for contributors**

`bun run check` = `bun test` + `scripts/check-snapshot.ts` + a
`bun build --compile` smoke for the host platform. Runs in <30s locally.

## 9. Error handling & edge cases

**Failure-mode matrix:**

| Class | Behavior | Examples |
|---|---|---|
| Input validation | Re-prompt once, then fail | Invalid package id, reserved name |
| Target dir conflict | Error unless `--force`; if `--force`, refuse if it's a file, allow if empty or trivial (`.DS_Store`, stray `.git`); warn and overwrite if non-empty with content | `./MyApp` already exists; `MyApp/` has stale files |
| Filesystem errors mid-render | Print the file, exit 1, leave partial output for inspection. No auto-delete | EACCES, ENOSPC, EROFS |
| Template integrity | At CLI startup, validate `templates/<arch>` exists for the chosen arch | Corrupt npm package |
| Unsupported platform | Shim errors with `npm i -g ...` hint | FreeBSD, linux-armv7 |
| Wrong Node version | Shim requires Node 18+; npm `EBADENGINE` otherwise | Node 16 |
| No TTY + missing required input | Print missing flags, exit 1 with usage hint | `npx ...` in a script |
| Unknown flag | `error: unknown option --foo`, show `--help` excerpt, exit 2 | Typo |
| SIGINT mid-render | Trap, delete partial output dir, restore cursor, exit 130 | User aborts |

**Rendering order (for atomicity):**

1. `settings.gradle.kts`, root `build.gradle.kts`.
2. `gradle/libs.versions.toml`, `gradle.properties`.
3. `gradle/wrapper/gradle-wrapper.properties`.
4. Module-level `build.gradle.kts` files.
5. `src/main/**` source files.
6. Resources, manifests, `proguard-rules.pro`.
7. `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar` (binary last).

`.gitignore` lands in batch 1.

**Logging discipline:**

- One `✔` line per success milestone.
- One `✖` line per failure, with the file/action named.
- No spammy per-file progress. The final summary is enough.
- All non-error output to stdout; errors to stderr. Matches the shim's
  `stdio: "inherit"` for the binary.

**Refusing dangerous input:**

- `package` starting with `java.*`, `javax.*`, `kotlin.*`, `android.*` →
  rejected.
- `name` equal to any reserved Gradle module name → rejected.
- `package` containing any segment equal to a Java reserved keyword →
  rejected.
- `projectDir` resolving outside cwd after `..` normalization → rejected.
- `projectDir` equal to `/`, `$HOME`, or any ancestor of a checked-in repo
  under cwd → rejected with "refusing to scaffold into a sensitive
  location."

**Determinism:**

- File order sorted lexicographically before write.
- No embedded timestamps in templates.
- `gradle-wrapper.jar` is content-addressed; `scripts/check-snapshot.ts`
  verifies it matches the Gradle version in `snapshot.json`.

## 10. Out of scope (v1)

- Fetching templates from external repos / git URLs.
- Per-user Android stack overrides (--agp, --kotlin flags).
- Auto-running `./gradlew` post-scaffold.
- Plugin/marketplace system for community templates.
- Non-Android targets (KMP-iOS, etc.) — the multi-module template is
  Android-only for v1; KMP plugin in a follow-up major.
- Windows ARM64 binary (lowest-priority platform).
