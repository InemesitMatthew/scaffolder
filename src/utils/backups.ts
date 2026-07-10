import {
  copyFileSync,
  existsSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const BAK_SUFFIX = '.scaffolder.bak';

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
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

/** Find every `*.scaffolder.bak` under the project (incl. pubspec at root). */
export function listScaffolderBackups(projectPath: string): string[] {
  const found = new Set<string>();
  const rootBak = join(projectPath, `pubspec.yaml${BAK_SUFFIX}`);
  if (existsSync(rootBak)) found.add(rootBak);

  for (const file of walkFiles(projectPath)) {
    if (file.endsWith(BAK_SUFFIX)) found.add(file);
  }
  return [...found].sort();
}

export function backupToOriginalPath(backupPath: string): string {
  if (!backupPath.endsWith(BAK_SUFFIX)) {
    throw new Error(`Not a scaffolder backup: ${backupPath}`);
  }
  return backupPath.slice(0, -BAK_SUFFIX.length);
}

/**
 * Restore originals from `*.scaffolder.bak`.
 * Copies bak → live file (overwrites current scaffolder version).
 */
export function restoreScaffolderBackups(projectPath: string): {
  restored: string[];
  missing: string[];
} {
  const backups = listScaffolderBackups(projectPath);
  const restored: string[] = [];
  const missing: string[] = [];

  for (const bak of backups) {
    const original = backupToOriginalPath(bak);
    if (!existsSync(bak)) {
      missing.push(relative(projectPath, bak));
      continue;
    }
    copyFileSync(bak, original);
    restored.push(relative(projectPath, original));
  }

  return { restored, missing };
}

/** Delete all `*.scaffolder.bak` files. Does not touch live files. */
export function cleanScaffolderBackups(projectPath: string): string[] {
  const backups = listScaffolderBackups(projectPath);
  const removed: string[] = [];
  for (const bak of backups) {
    rmSync(bak, { force: true });
    removed.push(relative(projectPath, bak));
  }
  return removed;
}
