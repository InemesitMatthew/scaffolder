# Flutter Scaffolding Patterns Blueprint

Source of truth for the `scaffolder` Flutter generator. Patterns extracted from the Evoolv / hi-car-driver-mobile shared kit.

---

## 1. Goals

Bootstrap a design-system-ready foundation so every feature starts with:

| Layer | Responsibility |
|--------|----------------|
| `core/` | App-wide infra: sizing, extensions, navigation, DI, API, config |
| `features/shared/` | Universal UI kit: widgets, palette, assets, weights |
| `features/<feature>/` | Feature modules with Clean Architecture + barrel exports |

**Import rule:** almost every UI file starts with:

```dart
import 'package:<app>/core/core.dart';
import 'package:<app>/features/features.dart';
```

That works because barrels re-export Material, Riverpod, shared widgets, etc.

---

## 2. Folder skeleton

```text
lib/
├── app/                          # App shell, theme, root widget (optional)
├── core/
│   ├── core.dart                 # ROOT barrel (infra + common pkgs)
│   └── utils/
│       ├── utils.dart
│       ├── sizing_utils.dart     # SizeConfig + context.verticalSpace
│       └── extension.dart
└── features/
    ├── features.dart             # ROOT mega feature barrel
    ├── shared/
    │   ├── shared.dart
    │   ├── constants/
    │   │   ├── constants.dart
    │   │   ├── palette.dart
    │   │   ├── assets.dart
    │   │   └── weights.dart
    │   └── widgets/
    │       ├── widgets.dart
    │       ├── scaffold_widget.dart   # BaseScaffold
    │       ├── text_widget.dart
    │       ├── textfield_widget.dart
    │       ├── button.dart
    │       └── image_widget.dart
    └── <feature>/
        ├── <feature>.dart
        ├── data/
        ├── domain/
        └── presentation/
            ├── presentation.dart
            ├── views/
            ├── widgets/widgets.dart
            └── providers/
```

---

## 3. Barrel export pattern

**Rules:**

1. Every folder that groups public API gets a barrel named after the folder (`widgets.dart`, `constants.dart`, `shared.dart`).
2. Barrels only `export` — no logic.
3. Nested barrels bubble up: file → folder barrel → feature barrel → `features.dart`.
4. Prefer relative exports inside a package folder.
5. Keep the **mega** `features/features.dart` and `core/core.dart` so the two-import habit stays consistent.

**Leaf barrel** (`features/shared/widgets/widgets.dart`):

```dart
export 'scaffold_widget.dart';
export 'text_widget.dart';
export 'textfield_widget.dart';
export 'button.dart';
export 'image_widget.dart';
```

**Mid barrel** (`features/shared/shared.dart`):

```dart
export 'constants/constants.dart';
export 'widgets/widgets.dart';
```

**Feature barrel:**

```dart
export 'data/data.dart';
export 'domain/domain.dart';
export 'presentation/presentation.dart';
```

**Root feature barrel** (`features/features.dart`):

```dart
export 'shared/shared.dart';
export 'splash/splash.dart';
// …every feature
```

**Root core barrel** (`core/core.dart`):

- Re-export Flutter/Material, Riverpod, and other always-used packages
- Re-export all core modules (`utils`, …)

---

## 4. Design tokens

### 4.1 `Palette` — semantic color tokens

```dart
abstract class Palette {
  static const Color primary = Color(0xff002F06);
  static const Color basePrimary = Color(0xff004208);
  static const Color white = Color(0xffffffff);
  static const Color text200 = Color(0xff667085);
  static const Color fillColor = Color(0xffF5F6F7);
  static const Color baseError = Color(0xffE94444);
}
```

Use `abstract class` + `static const` (no instantiation). Prefer semantic names (`textPrimary`, `surface`, `border`, `danger`) over endless numbered greys.

### 4.2 Spacing — raw numbers only

Do **not** ship a `Sizes` class. Pass numbers directly:

```dart
context.verticalSpace(16)
context.all(12)
padding: const EdgeInsets.all(8)
```

Full manual control; no extra abstraction.

### 4.3 `Weight` — font weight aliases

```dart
class Weight {
  static const FontWeight w400 = FontWeight.w400;
  static const FontWeight w600 = FontWeight.w600;
}
```

### 4.4 `Assets` — typed asset paths

```dart
class Assets {
  Assets._();
  static String png(String value) => 'assets/pngs/$value.png';
  static String svg(String value) => 'assets/svgs/$value.svg';
  // static String logo = png('logo');
}
```

Usage: `ImageWidget(url: Assets.logo)` — never hardcode path strings in UI.

Folder layout: `assets/pngs/`, `assets/svgs/`, `assets/animations/`.

---

## 5. Responsive sizing

```dart
class SizeConfig {
  static double breakpoint = 640;
  static double baseWidth = 390;
  static double baseHeight = 844;
  static const fontFamily = 'DM Sans';
}

extension MediaQueryValues on BuildContext {
  SizedBox verticalSpace(double value) { /* scale by height */ }
  SizedBox horizontalSpace(double value) { /* scale by width */ }
  double sp(double value) { /* scaled font */ }
  double h(double value);
  double w(double value);
}
```

### Usage

```dart
Column(
  children: [
    TextWidget('Hello', fontSize: 20, fontWeight: Weight.w600),
    context.verticalSpace(16),
    TextFieldWidget(title: 'Email', hintText: 'you@mail.com'),
    context.verticalSpace(24),
    Button(title: 'Continue', onTap: () {}),
  ],
)
```

List separators:

```dart
].separate(context.verticalSpace(12))
```

---

## 6. Universal widgets

### `BaseScaffold`

One place for SafeArea, side padding, scroll, tap-to-dismiss keyboard, bg color.

```dart
BaseScaffold(
  useSingleScroll: true,
  useSidePadding: true,
  bg: Palette.white,
  body: Column(...),
)
```

### `TextWidget`

```dart
TextWidget(
  'Title',
  fontSize: 16,
  textColor: Palette.textHeading,
  fontWeight: Weight.w600,
)
```

Uses `context.sp(fontSize)` and `SizeConfig.fontFamily`.

### `TextFieldWidget`

Shared form field with optional `title`, password obscure, validator, fill from `Palette.fillColor`.

### `Button`

Filled / outline, busy, disabled, infinite width by default.

### `ImageWidget`

Single entry for PNG/SVG asset and network images (detect from URL).

---

## 7. Core extensions worth shipping

| Extension | Purpose |
|-----------|---------|
| `context.verticalSpace(n)` | scaled vertical gap |
| `context.horizontalSpace(n)` | scaled horizontal gap |
| `context.sp(n)` | scaled font |
| `List<Widget>.separate(separator)` | insert gaps between children |
| `String.validateEmail()` etc. | form validators |

---

## 8. Feature module convention

```text
features/wallet/
  wallet.dart
  data/
  domain/
  presentation/
    views/
    widgets/widgets.dart
    providers/
```

- `widgets/` → small reusable pieces for that feature
- Always add a barrel when the folder has 2+ public files

---

## 9. Improvements (keep the barrel rule)

1. Semantic color tokens — avoid endless `lightGreyN`
2. ThemeData integration — map Palette → `ColorScheme` / `TextTheme`
3. Const constructors where possible
4. Widget tests for BaseScaffold / TextWidget / TextFieldWidget
5. Optional asset codegen (`flutter_gen`) with hand-written `Assets` as fallback

---

## 10. Checklist

- [ ] `core/core.dart` + `features/features.dart` compile
- [ ] `BaseScaffold` dismisses keyboard + SafeArea + padding
- [ ] `TextWidget` uses `context.sp` + `SizeConfig.fontFamily`
- [ ] `TextFieldWidget` supports title, validator, password
- [ ] `Button` supports busy/disabled
- [ ] `Palette`, `Assets`, `Weight` exported via `constants.dart`
- [ ] Spacing uses raw numbers (`context.verticalSpace(16)`), not a `Sizes` class
- [ ] `context.verticalSpace` / `horizontalSpace` work off `SizeConfig`
- [ ] Sample feature with barrels
