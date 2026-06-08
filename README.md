# `create-android`

Scaffold a new Android project from a versioned, pinned template snapshot.
Works with `npx` and `bunx`.

## Quick start

```sh
npx create-android my-app
```

Or pin a specific scaffolder version:

```sh
npx create-android@1.4.2 my-app
```

## Flags

| Flag | Description |
|---|---|
| `-n, --name <name>` | App name (PascalCase). |
| `-p, --package <id>` | Android application id (e.g. `com.example.myapp`). |
| `-a, --arch <multi\|single>` | `multi` (NowInAndroid-style) or `single` (single module with feature folders). |
| `--stack` | Print the pinned stack snapshot. |
| `--force` | Overwrite a non-empty target directory. |
| `--dry-run` | Render to a temp dir, print summary, do not write. |
| `--no-install` | Skip the "Next steps" printout (for CI). |

## Pinned stack

Each scaffolder release ships a pinned Android stack. Run `npx create-android my-app --stack` to see it.

| Scaffolder | AGP | Kotlin | Gradle | compileSdk |
|---|---|---|---|---|
| 0.1.x (dev) | 9.1.1 | 2.4.0 | 9.5.1 | 37 |

## Agents

### Scaffolding for an AI agent

When an AI agent (Claude, Cursor, Copilot, etc.) is asked to build or set up
an Android project, run the scaffolder with all flags provided to avoid
interactive prompts:

```sh
npx create-android /path/to/project \
  --name=MyApp \
  --package=com.example.myapp \
  --arch=single \
  --no-install
```

### Required flags for non-interactive use

| Flag | Why |
|---|---|
| `--name` | App name (PascalCase). Without it the agent gets a prompt. |
| `--package` | Android application id. Without it the agent gets a prompt. |
| `--arch` | `single` or `multi`. Without it the agent gets a prompt. |
| `--no-install` | Suppresses the "Next steps" printout. |

### Typical workflows

**Start a new single-module feature project:**
```sh
npx create-android my-app \
  --name=MyApp \
  --package=com.mycompany.myapp \
  --arch=single \
  --no-install
```

**Start a multi-module (NowInAndroid-style) project:**
```sh
npx create-android my-app \
  --name=MyApp \
  --package=com.mycompany.myapp \
  --arch=multi \
  --no-install
```

**Add a composable screen to a scaffolded project:**
```sh
# After scaffolding, the project has feature/ modules (multi) or
# app/src/main/kotlin/<packagePath>/feature/ directories (single).
# Add new screens by creating a composable function in the correct
# package and registering it in the navigation graph.
```

### Checking the stack version

```sh
npx create-android /tmp/scratch --stack
```

Returns the pinned AGP, Kotlin, Gradle, compileSdk, etc. for the current
scaffolder version — useful when the agent needs to know the exact versions
before writing additional build logic.

### Notes for agents

- The `--force` flag overwrites non-empty directories (use cautiously).
- The `--dry-run` flag renders to a temp dir and prints a summary without
  writing files — useful for previewing what would be generated.
- After scaffolding, run `./gradlew :app:assembleDebug` to verify the project
  compiles.
- All templates ship with a test keystore so release builds work out of the
  box, but **replace `keystore/test.jks` before publishing to any store**.

## How it works

- The npm package is a tiny Node 18+ shim that dispatches to a per-platform
  Bun-compiled binary via `optionalDependencies`.
- The binary is `bun build --compile` output; it contains the template
  content and the render engine.
- Templates live under `templates/<arch>/__name__/`. Path tokens
  (`__name__`) rename to your app name; content tokens (`{{var}}`) are
  replaced with their values from your inputs plus the pinned stack.

## Development

```sh
bun install
bun test
bun run scripts/check-snapshot.ts
bun run src/cli.ts /tmp/out --name=Smoke --package=com.example.smoke --arch=multi --no-install
```

## Publish

Push a version tag to trigger the CI publish workflow:

```sh
git tag v0.2.0
git push origin v0.2.0
```

The CI workflow builds per-platform binaries, runs tests, and publishes all
packages to npm. The npm token is configured as a repo secret (`NPM_TOKEN`).

## License

MIT.
