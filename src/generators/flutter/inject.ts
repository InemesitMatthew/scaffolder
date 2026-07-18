import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FlutterScaffoldOptions } from '../types.js';
import { wantsError } from '../types.js';
import { renderTemplate, stripTmplExtension, type TemplateVars } from '../../utils/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve templates/flutter relative to package root (works from dist/ and src/). */
export function getFlutterTemplatesRoot(): string {
  const candidates = [
    join(__dirname, '../../../templates/flutter'),
    join(__dirname, '../../../../templates/flutter'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    'Could not locate templates/flutter. Did you install the package correctly?',
  );
}

function exportLine(path: string): string {
  return `export '${path}';\n`;
}

export function buildVars(options: FlutterScaffoldOptions): TemplateVars {
  const error = wantsError(options);
  return {
    packageName: options.packageName,
    appClassName: options.appClassName,
    appTitle: options.appTitle,
    primaryColor: options.primaryColor,
    basePrimaryColor: options.basePrimaryColor,
    fontFamily: options.fontFamily,
    baseWidth: options.baseWidth,
    baseHeight: options.baseHeight,
    shellExport: options.withShell ? exportLine('shell/shell.dart') : '',
    authExport: options.withAuth ? exportLine('auth/auth.dart') : '',
    errorExport: error ? exportLine('error/error.dart') : '',
    networkExport: options.withNetwork ? exportLine('network/network.dart') : '',
    loggingExport: options.withLogging ? exportLine('logging/logging.dart') : '',
    configExport: options.withEnv ? exportLine('config/config.dart') : '',
    dioExport: options.withNetwork ? "export 'package:dio/dio.dart';\n" : '',
    talkerExport: options.withLogging
      ? "export 'package:talker_flutter/talker_flutter.dart';\n"
      : '',
    secureStorageExport: options.withAuth
      ? "export 'package:flutter_secure_storage/flutter_secure_storage.dart';\n"
      : '',
    flutterLocalizationsExport: options.withL10n
      ? "export 'package:flutter_localizations/flutter_localizations.dart';\n"
      : '',
    l10nCoreExport: options.withL10n
      ? `export 'package:${options.packageName}/l10n/app_localizations.dart';\n`
      : '',
    locatorNetworkRegister: options.withNetwork
      ? [
          '  if (!locator.isRegistered<ApiClient>()) {',
          '    locator.registerLazySingleton<ApiClient>(() => ApiClient());',
          '  }',
          '',
        ].join('\n')
      : '',
    locatorLoggingRegister: options.withLogging
      ? [
          '  if (!locator.isRegistered<Talker>()) {',
          '    locator.registerLazySingleton<Talker>(() => appTalker);',
          '  }',
          '  if (!locator.isRegistered<AppLogger>()) {',
          '    locator.registerLazySingleton<AppLogger>(() => AppLogger(appTalker));',
          '  }',
          '',
        ].join('\n')
      : '',
    locatorAuthRegister: options.withAuth
      ? [
          '  if (!locator.isRegistered<FlutterSecureStorage>()) {',
          '    locator.registerLazySingleton<FlutterSecureStorage>(',
          '      () => const FlutterSecureStorage(),',
          '    );',
          '  }',
          '',
        ].join('\n')
      : '',
    locatorSampleRegister: '',
    locatorExtraImports: [
      options.withNetwork ? "import '../network/api_client.dart';" : '',
      options.withLogging ? "import '../logging/app_logger.dart';" : '',
      options.withLogging
        ? "import 'package:talker_flutter/talker_flutter.dart';"
        : '',
      options.withAuth
        ? "import 'package:flutter_secure_storage/flutter_secure_storage.dart';"
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    routerObservers: options.withLogging
      ? '  observers: [TalkerRouteObserver(appTalker)],\n'
      : '',
    routerLoggingImports: options.withLogging
      ? "import '../logging/app_logger.dart';\nimport 'package:talker_flutter/talker_flutter.dart';\n"
      : '',
    authRouteBlock: options.withAuth
      ? [
          '    GoRoute(',
          '      path: AppRoutes.auth,',
          '      builder: (context, state) => const AuthPlaceholderView(),',
          '    ),',
          '',
        ].join('\n')
      : '',
    authRouteConst: options.withAuth
      ? "  static const auth = '/auth';\n"
      : '',
    authViewImport: '',
    l10nDelegates: options.withL10n
      ? [
          '      localizationsDelegates: const [',
          '        AppLocalizations.delegate,',
          '        GlobalMaterialLocalizations.delegate,',
          '        GlobalWidgetsLocalizations.delegate,',
          '        GlobalCupertinoLocalizations.delegate,',
          '      ],',
          '      supportedLocales: AppLocalizations.supportedLocales,',
          '',
        ].join('\n')
      : '',
    l10nImports: '',
    apiBaseUrlExpr: options.withEnv
      ? 'AppConfig.apiBaseUrl'
      : "'https://api.example.com'",
    networkConfigImport: options.withEnv
      ? "import '../config/app_config.dart';\n"
      : '',
  };
}

function writeRenderedFile(
  dest: string,
  raw: string,
  vars: TemplateVars,
  relForError: string,
): void {
  const rendered = renderTemplate(raw, vars);
  if (rendered.includes('{{')) {
    throw new Error(
      `Unresolved template placeholders in ${relForError}. Check scaffolder template vars.`,
    );
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, rendered, 'utf8');
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function copyOptionalLibPack(
  projectPath: string,
  templatesRoot: string,
  packName: string,
  vars: TemplateVars,
  written: string[],
): void {
  const packRoot = join(templatesRoot, 'optional', packName, 'lib');
  if (!existsSync(packRoot)) {
    throw new Error(`Optional ${packName} templates missing: ${packRoot}`);
  }
  for (const file of walkFiles(packRoot)) {
    const rel = relative(packRoot, file);
    const outRel = stripTmplExtension(rel);
    const dest = join(projectPath, 'lib', outRel);
    writeRenderedFile(
      dest,
      readFileSync(file, 'utf8'),
      vars,
      `optional/${packName}/${rel}`,
    );
    written.push(outRel);
  }
}

export function assertInjectTarget(projectPath: string): void {
  const pubspec = join(projectPath, 'pubspec.yaml');
  const lib = join(projectPath, 'lib');
  if (!existsSync(projectPath)) {
    throw new Error(`Inject path does not exist: ${projectPath}`);
  }
  if (!statSync(projectPath).isDirectory()) {
    throw new Error(`Inject path is not a directory: ${projectPath}`);
  }
  if (!existsSync(pubspec) || !existsSync(lib)) {
    throw new Error(
      `Inject target must be a Flutter project with pubspec.yaml and lib/.\nGot: ${projectPath}`,
    );
  }
}

export function assertNoOverwrite(
  projectPath: string,
  force: boolean,
): void {
  if (force) return;
  const guarded = [
    join(projectPath, 'lib', 'core'),
    join(projectPath, 'lib', 'features', 'shared'),
  ];
  for (const path of guarded) {
    if (existsSync(path)) {
      throw new Error(
        `Refusing to overwrite existing ${relative(projectPath, path)}. Pass --force to overwrite.`,
      );
    }
  }
}

/** Remove leftover sample shell when re-injecting without shell. */
export function cleanupLeftoverShell(
  projectPath: string,
  options: FlutterScaffoldOptions,
): string | undefined {
  if (options.withShell) return undefined;
  const shellDir = join(projectPath, 'lib', 'features', 'shell');
  if (!existsSync(shellDir)) return undefined;
  if (!options.force) {
    return `Left existing lib/features/shell (pass --force to remove when shell is off).`;
  }
  rmSync(shellDir, { recursive: true, force: true });
  return 'Removed leftover lib/features/shell';
}

export function copyRenderedLibTemplates(
  projectPath: string,
  options: FlutterScaffoldOptions,
): string[] {
  const templatesRoot = getFlutterTemplatesRoot();
  const libTemplates = join(templatesRoot, 'lib');
  if (!existsSync(libTemplates)) {
    throw new Error(`Template lib folder missing: ${libTemplates}`);
  }
  const vars = buildVars(options);
  const written: string[] = [];

  for (const file of walkFiles(libTemplates)) {
    const rel = relative(libTemplates, file);
    const outRel = stripTmplExtension(rel);
    const dest = join(projectPath, 'lib', outRel);
    writeRenderedFile(dest, readFileSync(file, 'utf8'), vars, rel);
    written.push(outRel);
  }

  if (wantsError(options)) {
    copyOptionalLibPack(projectPath, templatesRoot, 'error', vars, written);
  }
  if (options.withNetwork) {
    copyOptionalLibPack(projectPath, templatesRoot, 'network', vars, written);
  }
  if (options.withEnv) {
    copyOptionalLibPack(projectPath, templatesRoot, 'env', vars, written);
  }
  if (options.withLogging) {
    copyOptionalLibPack(projectPath, templatesRoot, 'logging', vars, written);
  }
  if (options.withSampleFeature) {
    copyOptionalLibPack(
      projectPath,
      templatesRoot,
      'sample-feature',
      vars,
      written,
    );
  }
  if (options.withAuth) {
    copyOptionalLibPack(projectPath, templatesRoot, 'auth', vars, written);
  }
  if (options.withL10n) {
    copyOptionalLibPack(projectPath, templatesRoot, 'l10n', vars, written);
    const l10nRoot = join(templatesRoot, 'optional', 'l10n', 'root');
    if (existsSync(l10nRoot)) {
      for (const file of walkFiles(l10nRoot)) {
        const rel = relative(l10nRoot, file);
        const outRel = stripTmplExtension(rel);
        const dest = join(projectPath, outRel);
        writeRenderedFile(
          dest,
          readFileSync(file, 'utf8'),
          vars,
          `optional/l10n/root/${rel}`,
        );
        written.push(outRel);
      }
    }
  }
  if (options.withShell) {
    copyOptionalLibPack(projectPath, templatesRoot, 'shell', vars, written);
  }

  return written;
}

export function writeCiWorkflow(
  projectPath: string,
  options: FlutterScaffoldOptions,
): boolean {
  if (!options.withCi) return false;
  const templatesRoot = getFlutterTemplatesRoot();
  const tmpl = join(
    templatesRoot,
    'optional',
    'ci',
    'flutter_ci.yml.tmpl',
  );
  if (!existsSync(tmpl)) {
    throw new Error(`Missing CI template: ${tmpl}`);
  }
  const dest = join(projectPath, '.github', 'workflows', 'flutter_ci.yml');
  writeRenderedFile(
    dest,
    readFileSync(tmpl, 'utf8'),
    buildVars(options),
    'optional/ci/flutter_ci.yml.tmpl',
  );
  return true;
}

export function writeAnalysisOptions(projectPath: string): {
  written: boolean;
  backedUp: boolean;
} {
  const templatesRoot = getFlutterTemplatesRoot();
  const tmpl = join(templatesRoot, 'partials', 'analysis_options.yaml.tmpl');
  if (!existsSync(tmpl)) {
    throw new Error(`Missing analysis_options template: ${tmpl}`);
  }
  const dest = join(projectPath, 'analysis_options.yaml');
  let backedUp = false;
  if (existsSync(dest)) {
    const bak = `${dest}.scaffolder.bak`;
    if (!existsSync(bak)) {
      copyFileSync(dest, bak);
      backedUp = true;
    }
  }
  writeFileSync(dest, readFileSync(tmpl, 'utf8'), 'utf8');
  return { written: true, backedUp };
}

export function ensureAssetFolders(projectPath: string): void {
  for (const folder of ['assets/pngs', 'assets/svgs', 'assets/animations']) {
    const dir = join(projectPath, folder);
    mkdirSync(dir, { recursive: true });
    const keep = join(dir, '.gitkeep');
    if (!existsSync(keep)) {
      writeFileSync(keep, '', 'utf8');
    }
  }
}

export function writeMainDart(
  projectPath: string,
  options: FlutterScaffoldOptions,
): { backedUp: boolean } {
  const templatesRoot = getFlutterTemplatesRoot();
  const tmpl = join(templatesRoot, 'partials', 'main.dart.tmpl');
  if (!existsSync(tmpl)) {
    throw new Error(`Missing main.dart template: ${tmpl}`);
  }
  const dest = join(projectPath, 'lib', 'main.dart');
  let backedUp = false;

  if (existsSync(dest)) {
    const backup = join(projectPath, 'lib', 'main.dart.scaffolder.bak');
    copyFileSync(dest, backup);
    backedUp = true;
  }

  const raw = readFileSync(tmpl, 'utf8');
  const rendered = renderTemplate(raw, buildVars(options));
  if (rendered.includes('{{')) {
    throw new Error('Unresolved placeholders in main.dart template.');
  }
  writeFileSync(dest, rendered, 'utf8');
  return { backedUp };
}

function findTopLevelSection(
  lines: string[],
  name: string,
): { start: number; end: number } | null {
  const header = new RegExp(`^${name}:\\s*$`);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (header.test(lines[i]!)) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^[a-zA-Z_][\w-]*:\s*/.test(line) && !/^\s/.test(line)) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function sectionHasLine(lines: string[], start: number, end: number, needle: string): boolean {
  for (let i = start; i < end; i++) {
    if (lines[i]!.includes(needle)) return true;
  }
  return false;
}

/** Line-based pubspec patch — avoids matching nested `flutter:` under dependencies. */
export function patchPubspec(
  projectPath: string,
  options: FlutterScaffoldOptions,
): void {
  const pubspecPath = join(projectPath, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) {
    throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
  }

  const original = readFileSync(pubspecPath, 'utf8');
  const lines = original.split(/\r?\n/);

  const deps = findTopLevelSection(lines, 'dependencies');
  if (!deps) {
    throw new Error(
      'pubspec.yaml has no top-level dependencies: section. Fix the file or re-run flutter create.',
    );
  }

  const foundationDeps = [
    { id: 'flutter_riverpod:', line: '  flutter_riverpod: ^2.6.1' },
    { id: 'flutter_svg:', line: '  flutter_svg: ^2.0.17' },
    { id: 'go_router:', line: '  go_router: ^14.8.1' },
    { id: 'get_it:', line: '  get_it: ^8.0.3' },
  ];
  if (options.withNetwork) {
    foundationDeps.push({ id: 'dio:', line: '  dio: ^5.8.0+1' });
  }
  if (options.withAuth) {
    foundationDeps.push({
      id: 'flutter_secure_storage:',
      line: '  flutter_secure_storage: ^9.2.4',
    });
  }
  if (options.withLogging) {
    foundationDeps.push({
      id: 'talker_flutter:',
      line: '  talker_flutter: ^4.6.14',
    });
  }
  if (options.withL10n) {
    foundationDeps.push({
      id: 'flutter_localizations:',
      line: '  flutter_localizations:\n    sdk: flutter',
    });
  }

  let insertAt = deps.end;
  for (let i = deps.start + 1; i < deps.end; i++) {
    if (/^\s+sdk:\s*flutter\s*$/.test(lines[i]!)) {
      insertAt = i + 1;
      break;
    }
  }

  const missingDeps = foundationDeps.filter(
    (d) => !sectionHasLine(lines, deps.start, deps.end, d.id),
  );
  if (missingDeps.length > 0) {
    const toInsert: string[] = [];
    for (const d of missingDeps) {
      toInsert.push(...d.line.split('\n'));
    }
    lines.splice(insertAt, 0, ...toInsert);
  }

  let flutter = findTopLevelSection(lines, 'flutter');
  if (!flutter) {
    lines.push('', 'flutter:', '  uses-material-design: true');
    flutter = findTopLevelSection(lines, 'flutter');
  }

  if (flutter && !sectionHasLine(lines, flutter.start, flutter.end, 'assets/pngs/')) {
    const assetBlock = [
      '  assets:',
      '    - assets/pngs/',
      '    - assets/svgs/',
      '    - assets/animations/',
    ];
    let assetInsertAt = flutter.end;
    for (let i = flutter.start + 1; i < flutter.end; i++) {
      if (/uses-material-design:/.test(lines[i]!)) {
        assetInsertAt = i + 1;
        break;
      }
    }
    lines.splice(assetInsertAt, 0, ...assetBlock);
  }

  if (options.withL10n) {
    flutter = findTopLevelSection(lines, 'flutter');
    if (
      flutter &&
      !sectionHasLine(lines, flutter.start, flutter.end, 'generate:')
    ) {
      let genAt = flutter.start + 1;
      for (let i = flutter.start + 1; i < flutter.end; i++) {
        if (/uses-material-design:/.test(lines[i]!)) {
          genAt = i + 1;
          break;
        }
      }
      lines.splice(genAt, 0, '  generate: true');
    }
  }

  let content = lines.join('\n');
  if (!content.includes('# scaffolder: fonts')) {
    if (!content.endsWith('\n')) content += '\n';
    content += `\n# scaffolder: fonts\n# Add ${options.fontFamily} under flutter/fonts when you drop font files into the project.\n`;
  }
  if (options.withEnv && !content.includes('# scaffolder: dart-define')) {
    if (!content.endsWith('\n')) content += '\n';
    content +=
      '\n# scaffolder: dart-define\n# flutter run --dart-define=APP_ENV=dev --dart-define=API_BASE_URL=https://api.example.com\n';
  }

  const bak = `${pubspecPath}.scaffolder.bak`;
  if (!existsSync(bak)) {
    writeFileSync(bak, original, 'utf8');
  }
  writeFileSync(pubspecPath, content, 'utf8');
}

export function removeDefaultCounterApp(projectPath: string): void {
  const widgetTest = join(projectPath, 'test', 'widget_test.dart');
  if (existsSync(widgetTest)) {
    const bak = join(projectPath, 'test', 'widget_test.dart.scaffolder.bak');
    if (!existsSync(bak)) {
      copyFileSync(widgetTest, bak);
    }
    writeFileSync(
      widgetTest,
      `import 'package:flutter_test/flutter_test.dart';\n\nvoid main() {\n  test('placeholder', () {\n    expect(true, isTrue);\n  });\n}\n`,
      'utf8',
    );
  }
}

export function copyPackageAssetPlaceholders(projectPath: string): void {
  ensureAssetFolders(projectPath);
}

/** Used by rollback — rename aside then delete is handled in generator. */
export function markFailedCreate(projectPath: string): string {
  const failed = `${projectPath}.scaffolder-failed`;
  if (existsSync(failed)) {
    const stamped = `${failed}-${Date.now()}`;
    renameSync(projectPath, stamped);
    return stamped;
  }
  renameSync(projectPath, failed);
  return failed;
}
