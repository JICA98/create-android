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

```sh
bun run scripts/publish.ts --version=1.2.0
```

(Add `--dry-run` to simulate.)

## License

MIT.
