import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FlutterScaffoldOptions } from '../types.js';
import { renderTemplate, type TemplateVars } from '../../utils/render.js';

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

function buildVars(options: FlutterScaffoldOptions): TemplateVars {
  return {
    packageName: options.packageName,
    appClassName: options.appClassName,
    appTitle: options.appTitle,
    primaryColor: options.primaryColor,
    basePrimaryColor: options.basePrimaryColor,
    fontFamily: options.fontFamily,
    baseWidth: options.baseWidth,
    baseHeight: options.baseHeight,
  };
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
    const dest = join(projectPath, 'lib', rel);
    const raw = readFileSync(file, 'utf8');
    const rendered = renderTemplate(raw, vars);
    if (rendered.includes('{{')) {
      throw new Error(
        `Unresolved template placeholders in ${rel}. Check scaffolder template vars.`,
      );
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, rendered, 'utf8');
    written.push(rel);
  }

  return written;
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

/**
 * Writes main.dart. Backs up an existing file on inject unless --force
 * already implies intentional overwrite (still backs up once).
 */
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

  if (!sectionHasLine(lines, deps.start, deps.end, 'flutter_riverpod:')) {
    // Insert after `sdk: flutter` inside dependencies if present, else end of section.
    let insertAt = deps.end;
    for (let i = deps.start + 1; i < deps.end; i++) {
      if (/^\s+sdk:\s*flutter\s*$/.test(lines[i]!)) {
        insertAt = i + 1;
        break;
      }
    }
    lines.splice(
      insertAt,
      0,
      '  flutter_riverpod: ^2.6.1',
      '  flutter_svg: ^2.0.17',
    );
  } else if (!sectionHasLine(lines, deps.start, deps.end, 'flutter_svg:')) {
    for (let i = deps.start; i < lines.length; i++) {
      if (lines[i]!.includes('flutter_riverpod:')) {
        lines.splice(i + 1, 0, '  flutter_svg: ^2.0.17');
        break;
      }
    }
  }

  // Recompute flutter section after dependency inserts shifted indexes.
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
    let insertAt = flutter.end;
    for (let i = flutter.start + 1; i < flutter.end; i++) {
      if (/uses-material-design:/.test(lines[i]!)) {
        insertAt = i + 1;
        break;
      }
    }
    lines.splice(insertAt, 0, ...assetBlock);
  }

  let content = lines.join('\n');
  if (!content.includes('# scaffolder: fonts')) {
    if (!content.endsWith('\n')) content += '\n';
    content += `\n# scaffolder: fonts\n# Add ${options.fontFamily} under flutter/fonts when you drop font files into the project.\n`;
  }

  // Backup before write
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
    // unique suffix
    const stamped = `${failed}-${Date.now()}`;
    renameSync(projectPath, stamped);
    return stamped;
  }
  renameSync(projectPath, failed);
  return failed;
}
