# Extras guide

Optional packs (interactive multiselect or `--with-*` / `--no-*`). **Default: all off.**

## Recommended paths

| Project type | Pick |
|--------------|------|
| **UI kit / prototype** | Baseline only (none) |
| **Typical product app** | `network` + `logging` + `env` |
| **Tabbed consumer app** | above + `shell` |
| **Learning / first feature** | above + `sample-feature` |
| **Auth soon** | add `auth` when you need secure storage + placeholder route |
| **Ship to store / team** | add `l10n` early if multi-language; add `ci` if GitHub; add `husky` for local commit/push gates |

Avoid enabling everything “just in case” — each extra adds deps and files you must own.

## Flag cheat sheet

| Flag | Labour saved | Cost |
|------|----------------|------|
| `--with-shell` | Sample bottom nav IA | Replace sample tabs later |
| `--with-network` | Dio client + GetIt + `Failure`/`Result` | Empty until real APIs |
| `--with-sample-feature` | Splash CA + Riverpod example | Demo code to delete/replace |
| `--with-auth` | Secure storage in GetIt + `/auth` | Placeholder UI only |
| `--with-l10n` | en arb + delegates | Run `flutter gen-l10n` |
| `--with-logging` | talker_flutter + route observer | Console noise in debug |
| `--with-env` | `AppConfig` / `--dart-define` | Wire real URLs yourself |
| `--with-ci` | GitHub Actions analyze+test | Needs Flutter on Actions |
| `--with-husky` | Local pre-commit format+analyze; pre-push `flutter test` | Run `dart run husky install` after `pub get` |

## Import habit

**Outside `lib/core/`** (app, features, `main`):

```dart
import 'package:my_app/core/core.dart';
import 'package:my_app/features/features.dart';
```

**Inside `lib/core/` leaves** — do **not** import `core/core.dart`. Use packages + relative siblings.

**Router split:** `AppRoutes` on `core.dart`; `appRouter` only from `app/app.dart`.

**Why the split (full reasoning):** [import_habit.md](import_habit.md) — short version: `core.dart` is a facade for the rest of the app; core leaves must not import their own barrel or eager `appRouter` / `appTalker` cycles bite at startup.

**Also:** nested barrels only `export 'local_file.dart'`; packages re-exported from `core.dart` for app/feature code; theme/palette/weights use `package:flutter/material.dart` only.
