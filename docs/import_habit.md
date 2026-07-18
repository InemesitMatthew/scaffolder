# Why `core/core.dart` is not used inside `lib/core/`

This is the design note behind the scaffolder’s import split. The two-barrel habit you already like is **kept** for almost all app code — we only carve out an exception for core *leaves*.

## What you still do 99% of the time

In `lib/app/`, `lib/features/`, and `main.dart`:

```dart
import 'package:my_app/core/core.dart';
import 'package:my_app/features/features.dart';
```

That is still the golden path. Packages (`dio`, `talker_flutter`, `go_router`, …) and internal barrels are re-exported from `core.dart` so feature code never deep-imports.

## The exception (core leaves only)

Files **under** `lib/core/` that implement infrastructure must **not** import `core/core.dart`. They use:

- direct package imports (`package:get_it/get_it.dart`, `package:dio/dio.dart`, …)
- relative sibling imports (`import '../logging/app_logger.dart'`, `import 'app_routes.dart'`)

`app/app.dart` is the one deliberate nested import:

```dart
import 'package:my_app/core/core.dart';
import 'package:my_app/core/router/app_router.dart'; // appRouter only
```

`core.dart` exports `AppRoutes` via `router/router.dart`, but **not** `appRouter`.

## Why this is better than “always core.dart”

### 1. Dart barrel self-cycles are real

`core.dart` is a barrel: it *exports* locator, logging, theme, utils, router names, optional network, etc.

If a leaf that is (transitively) exported by `core.dart` also does:

```dart
import 'package:my_app/core/core.dart';
```

you get a **library cycle**:

```text
core.dart  →  logging/app_logger.dart  →  core.dart  →  …
```

Dart can often limp through cycles, but load order becomes undefined. That bites hardest when a library has **eager top-level side effects**.

### 2. Eager globals make cycles dangerous

Scaffolded core intentionally creates shared instances at library load time:

| Symbol | File | Why eager |
|--------|------|-----------|
| `appTalker` | `logging/app_logger.dart` | Ready before GetIt / router observers |
| `appRouter` | `router/app_router.dart` | `MaterialApp.router(routerConfig: …)` |
| `locator` | `locator/locator_service.dart` | GetIt singleton |

If `app_router.dart` imported `core.dart`, and `core.dart` exported `app_router.dart`, while `app_router` also pulled `features.dart` → views → `core.dart` again, you get the classic startup cycle:

```text
core.dart
  → app_router.dart   (builds GoRouter immediately)
    → features.dart
      → SplashView / HomeView
        → core.dart   (still initializing)
```

Keeping `appRouter` **out** of the core barrel and keeping leaves off `core.dart` breaks that loop. `AppRoutes` (plain consts) stay on the barrel — they have no eager graph.

### 3. Relative siblings are the honest dependency

Inside core, `locator_service.dart` really depends on `ApiClient` / `AppLogger` as **siblings**, not on “the whole app surface.”

```dart
import '../network/api_client.dart';
import '../logging/app_logger.dart';
```

That documents the edge. Importing `core.dart` from the same layer pretends the leaf depends on Material, Riverpod, theme, utils, and every optional pack — it doesn’t.

### 4. Theme ↔ palette cycle

`buildAppTheme()` needs `Palette`. If palette imported `core.dart` (which exports theme), you get:

```text
core.dart → theme → palette → core.dart → theme → …
```

So palette / weights / theme leaves use `package:flutter/material.dart` (and a narrow relative for `SizeConfig`), not mega barrels.

## Mental model (keep this)

| Zone | Import style | Comfort level |
|------|----------------|---------------|
| Features, shared widgets, splash/home/auth/shell views | `core/core.dart` + `features/features.dart` | Your usual habit — unchanged |
| `main.dart` | `app/app.dart` + `core/core.dart` | Unchanged |
| `app/app.dart` | `core/core.dart` + nested `app_router.dart` | Only nested exception |
| Files under `lib/core/**` (implementation) | packages + relatives | The exception — by design |

Think of `core.dart` as a **facade for the rest of the app**, not as something core uses to talk to itself.

## What we rejected (and why)

| Approach | Why not |
|----------|---------|
| Everything imports `core/core.dart` | Self-cycles + eager `appRouter` / `appTalker` risk |
| Deep `package:app/core/network/…` from features | Breaks the two-barrel habit outside core |
| Nested barrels re-exporting `dio` / `talker` | Hides package ownership; duplicates facade |
| Relative imports from features into core | Couples features to folder layout |

## Quick checklist when adding core code

1. New file under `lib/core/`? → no `import '…/core/core.dart'`.
2. Need another core type? → relative sibling (or same-folder) import.
3. Need a package? → import the package directly in that leaf; also export it from `core.dart` if features should see it.
4. New eager top-level (`final x = …`)? → keep it out of any barrel that features re-enter during that library’s init.
5. Feature / widget file? → stick to the two barrels. Don’t copy core’s relative style upward.

## See also

- [extras_guide.md](extras_guide.md) — short habit + flags
- [flutter_scaffolding_patterns.md](flutter_scaffolding_patterns.md) — folder blueprint
