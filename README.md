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

From source (Windows: overwrite an existing global link):

```bash
git clone https://github.com/InemesitMatthew/scaffolder.git
cd scaffolder
npm install
npm run build
npm link --force
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
| 3 | **Create:** name, org, empty output folder · **Inject:** path to project (package name from `pubspec.yaml`) |
| 4 | Design defaults (optional) |
| 5 | Optional extras multiselect (shell, network, sample CA, auth, l10n, logging, env, CI) |
| 6 | Confirm |

Then:

```bash
cd your_app
flutter pub get
flutter run
```

### Create vs inject

| Mode | When |
|------|------|
| **Create** | Folder must **not** exist. Runs `flutter create`, then injects the kit. |
| **Inject** | Existing Flutter project (`pubspec.yaml` + `lib/`). Use `--force` to overwrite `lib/core` / `lib/features/shared`. |

## What you get (baseline)

```text
lib/
  app/               # MaterialApp.router + theme
  core/
    theme/           # buildAppTheme()
    locator/         # GetIt setupLocator
    router/          # go_router (splash → home)
    utils/           # SizeConfig, spacing extensions
  features/
    shared/          # Palette, widgets, …
    splash/
    home/
```

```dart
import 'package:my_app/core/core.dart';
import 'package:my_app/features/features.dart';
```

Spacing uses **raw numbers** (`context.verticalSpace(16)`) — no `Sizes` class.

**Import rule:** those two barrels for app/feature code. Inside `lib/core/`, use packages + relative siblings (no `core.dart` self-import). `appRouter` is imported only from `app/app.dart`. Why: [docs/import_habit.md](docs/import_habit.md).
### Optional extras

| Flag | Adds |
|------|------|
| `--with-shell` | Sample `StatefulShellRoute` (Home / Search / Settings) |
| `--with-network` | Dio `ApiClient` + `Failure` / `Result` |
| `--with-sample-feature` | Splash CA sample (repo + Riverpod) |
| `--with-auth` | Auth placeholder + `flutter_secure_storage` in GetIt |
| `--with-l10n` | `l10n.yaml` + en arb + delegates |
| `--with-logging` | `talker_flutter` `AppLogger` + route observer |
| `--with-env` | `AppConfig` via `--dart-define` |
| `--with-ci` | `.github/workflows/flutter_ci.yml` |

Use matching `--no-*` flags to force off in non-interactive runs. Defaults are **off**.

Template sources live under `templates/<framework>/` as `*.tmpl`. Dart analysis is excluded via root `analysis_options.yaml`.

`.vscode/` is gitignored on purpose (keep editor settings local).

## Backups

Before overwriting `main.dart` / `pubspec.yaml` / `analysis_options.yaml`, scaffolder writes `*.scaffolder.bak`.

| Goal | Command |
|------|---------|
| Undo those overwrites | `scaffolder restore ./your_app` |
| Delete backups | `scaffolder clean-backups ./your_app` |

You’ll also be asked after a run whether to remove backups (default: keep).

## Tips

- Inject path = folder that contains `pubspec.yaml` (full path; avoid `.C:\...`)
- Existing `lib/core` / `lib/features/shared` → need `--force` to overwrite
- Create target must be empty / non-existent
- Defaults: color `002F06`, font `DM Sans`, base `390×844`

## Develop

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Patterns reference: [docs/flutter_scaffolding_patterns.md](docs/flutter_scaffolding_patterns.md)  
Extras guide: [docs/extras_guide.md](docs/extras_guide.md) · Import reasoning: [docs/import_habit.md](docs/import_habit.md)

## License

MIT
