# scaffolder

Interactive CLI that scaffolds a scalable Flutter codebase in one command.  
More frameworks (React, NestJS, Go, …) coming later.

**npm:** [`@senmid/scaffolder`](https://www.npmjs.com/package/@senmid/scaffolder)  
**GitHub:** https://github.com/InemesitMatthew/scaffolder

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Flutter](https://docs.flutter.dev/get-started/install) on your PATH (for **creating** a new app)

## Install

```bash
npx @senmid/scaffolder
```

Or globally:

```bash
npm i -g @senmid/scaffolder
scaffolder
```

From source:

```bash
git clone https://github.com/InemesitMatthew/scaffolder.git
cd scaffolder
npm install
npm run build
npm link
scaffolder
```

## Quick start

```bash
npx @senmid/scaffolder
# or: scaffolder
```

| Step | What you do |
|------|-------------|
| 1 | Pick **Flutter** |
| 2 | **Create** a new app, or **Inject** into an existing one |
| 3 | **Create:** name, org, output folder · **Inject:** path to project (package name read from `pubspec.yaml`) |
| 4 | **Use design defaults?** → Yes (recommended) |
| 5 | Confirm |

Then:

```bash
cd your_app
flutter pub get
flutter run
```

## What you get

```text
lib/
  core/              # SizeConfig, context.verticalSpace, extensions
  features/
    features.dart    # mega barrel
    shared/          # Palette, Assets, Weight, BaseScaffold, TextWidget, …
    splash/          # sample Clean Architecture feature
```

```dart
import 'package:my_app/core/core.dart';
import 'package:my_app/features/features.dart';
```

Spacing uses **raw numbers** (`context.verticalSpace(16)`) — no `Sizes` class.

Template sources live under `templates/<framework>/` as `*.tmpl` (e.g. `foo.dart.tmpl`) so language servers don’t treat placeholders as real code. Future frameworks use the same rule. Dart analysis is also excluded via `analysis_options.yaml`.

`.vscode/` is gitignored on purpose (keep editor settings local).

## Backups

Before overwriting `main.dart` / `pubspec.yaml`, scaffolder writes `*.scaffolder.bak`.

| Goal | Command |
|------|---------|
| Undo those overwrites | `scaffolder restore ./your_app` |
| Delete backups | `scaffolder clean-backups ./your_app` |

You’ll also be asked after a run whether to remove backups (default: keep).

## Tips

- Inject path = folder that contains `pubspec.yaml` (full path, no leading `.`)
- Existing `lib/core` / `lib/features/shared` → need `--force` to overwrite
- Defaults: color `002F06`, font `DM Sans`, base `390×844`

## Develop

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Patterns reference: [docs/flutter_scaffolding_patterns.md](docs/flutter_scaffolding_patterns.md)

## License

MIT
