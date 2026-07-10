import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  listScaffolderBackups,
  restoreScaffolderBackups,
  cleanScaffolderBackups,
  backupToOriginalPath,
} from '../src/utils/backups.js';
import { readPubspecPackageName } from '../src/utils/validate.js';

describe('backups', () => {
  let root = '';

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'scaffolder-bak-'));
    mkdirSync(join(root, 'lib'), { recursive: true });
    writeFileSync(join(root, 'lib', 'main.dart'), 'NEW');
    writeFileSync(join(root, 'lib', 'main.dart.scaffolder.bak'), 'OLD');
    writeFileSync(join(root, 'pubspec.yaml'), 'name: demo\n');
    writeFileSync(join(root, 'pubspec.yaml.scaffolder.bak'), 'name: old\n');
  });

  after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lists bak files', () => {
    assert.equal(listScaffolderBackups(root).length, 2);
  });

  it('maps bak path to original', () => {
    assert.equal(
      backupToOriginalPath(join(root, 'pubspec.yaml.scaffolder.bak')),
      join(root, 'pubspec.yaml'),
    );
  });

  it('restores originals from bak', () => {
    const { restored } = restoreScaffolderBackups(root);
    assert.ok(restored.length >= 2);
    assert.equal(readFileSync(join(root, 'lib', 'main.dart'), 'utf8'), 'OLD');
  });

  it('cleans bak files', () => {
    writeFileSync(join(root, 'lib', 'main.dart.scaffolder.bak'), 'OLD');
    writeFileSync(join(root, 'pubspec.yaml.scaffolder.bak'), 'name: old\n');
    const removed = cleanScaffolderBackups(root);
    assert.ok(removed.length >= 2);
    assert.equal(existsSync(join(root, 'lib', 'main.dart.scaffolder.bak')), false);
  });
});

describe('readPubspecPackageName', () => {
  it('reads name from pubspec', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-pub-'));
    writeFileSync(
      join(dir, 'pubspec.yaml'),
      'name: shiori_app\ndescription: x\n',
    );
    try {
      assert.equal(readPubspecPackageName(dir), 'shiori_app');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
