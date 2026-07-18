import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { toPackageName } from './render.js';

const RESERVED_PACKAGE_NAMES = new Set([
  'flutter',
  'flutter_test',
  'flutter_driver',
  'flutter_localizations',
  'dart',
  'test',
  'core',
  'async',
  'collection',
  'meta',
]);

export function assertPackageName(raw: string): string {
  const name = toPackageName(raw);
  if (!name) {
    throw new Error('Project name is required.');
  }
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(
      `Invalid package name "${raw}". Use lowercase letters, numbers, underscores; start with a letter.`,
    );
  }
  if (RESERVED_PACKAGE_NAMES.has(name)) {
    throw new Error(
      `"${name}" is a reserved Dart/Flutter package name. Pick another.`,
    );
  }
  if (name.length > 64) {
    throw new Error('Package name is too long (max 64 characters).');
  }
  return name;
}

export function assertMode(mode: string): 'create' | 'inject' {
  if (mode !== 'create' && mode !== 'inject') {
    throw new Error(`Invalid mode: ${mode}. Use create or inject.`);
  }
  return mode;
}

export function assertOrg(org: string): string {
  const value = org.trim();
  if (!value) {
    throw new Error('Organization is required.');
  }
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(value)) {
    throw new Error(
      `Invalid org "${org}". Use reverse-domain form like com.example.`,
    );
  }
  return value;
}

export function assertPositiveNumber(
  raw: string | number | undefined,
  label: string,
  fallback: number,
): number {
  if (raw === undefined || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${label} must be a positive number (got: ${raw}).`);
  }
  return n;
}

export function assertCreateParentExists(outputPath: string): void {
  const parent = dirname(outputPath);
  if (!existsSync(parent)) {
    throw new Error(`Parent directory does not exist: ${parent}`);
  }
  if (!statSync(parent).isDirectory()) {
    throw new Error(`Parent path is not a directory: ${parent}`);
  }
}

/** Fail early when create target folder already exists. */
export function assertCreateTargetAvailable(outputPath: string): void {
  const projectDir = resolve(outputPath);
  if (existsSync(projectDir)) {
    throw new Error(
      `Target already exists: ${projectDir}. Use inject mode or pick another path.`,
    );
  }
}

/**
 * Resolve opt-in CLI bool from argv.
 * `--with-x` → true, `--no-x` → false, neither → undefined (prompt / default off).
 */
export function resolveOptionalBool(
  argv: string[],
  withFlag: string,
  noFlag?: string,
): boolean | undefined {
  if (noFlag && argv.includes(noFlag)) return false;
  if (argv.includes(withFlag)) return true;
  return undefined;
}

export function assertWritablePathHint(path: string): void {
  if (path.includes('\0')) {
    throw new Error('Path contains invalid characters.');
  }
}

/** Normalize + reject common path mistakes like `.C:\Users\...`. */
export function normalizeUserPath(raw: string): string {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) {
    throw new Error('Path is required.');
  }
  if (/^\.[A-Za-z]:[\\/]/.test(trimmed)) {
    throw new Error(
      'Invalid path (leading dot before drive letter). Use e.g. C:\\Users\\...\\my_app',
    );
  }
  if (trimmed === '.' || trimmed === './' || trimmed === '.\\') {
    throw new Error(
      'Enter the full path to your Flutter project (the folder that contains pubspec.yaml).',
    );
  }
  return trimmed;
}

export function assertInjectProjectPath(raw: string): string {
  const normalized = normalizeUserPath(raw);
  const projectPath = resolve(normalized);
  if (!existsSync(projectPath)) {
    throw new Error(`Path does not exist: ${projectPath}`);
  }
  if (!statSync(projectPath).isDirectory()) {
    throw new Error(`Path is not a directory: ${projectPath}`);
  }
  const pubspec = join(projectPath, 'pubspec.yaml');
  const lib = join(projectPath, 'lib');
  if (!existsSync(pubspec) || !existsSync(lib)) {
    throw new Error(
      `Not a Flutter project root (need pubspec.yaml + lib/).\nGot: ${projectPath}`,
    );
  }
  return projectPath;
}

/** Read top-level `name:` from pubspec.yaml (BOM + quoted names OK). */
export function readPubspecPackageName(projectPath: string): string {
  const pubspecPath = join(projectPath, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) {
    throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
  }
  const raw = readFileSync(pubspecPath, 'utf8');
  const content = raw.replace(/^\uFEFF/, '');
  const match = content.match(/^name:\s*["']?([a-zA-Z_][\w]*)["']?\s*$/m);
  if (!match?.[1]) {
    const preview = content
      .split(/\r?\n/)
      .slice(0, 5)
      .join('\n')
      .trim();
    throw new Error(
      `Could not read package name from ${pubspecPath}. Add a top-level name: field.` +
        (preview ? `\nFirst lines:\n${preview}` : ''),
    );
  }
  return assertPackageName(match[1]);
}
