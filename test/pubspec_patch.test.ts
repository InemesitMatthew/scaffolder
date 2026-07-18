import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { patchPubspec } from '../src/generators/flutter/inject.js';
import type { FlutterScaffoldOptions } from '../src/generators/types.js';

function baseOptions(projectPath: string): FlutterScaffoldOptions {
  return {
    framework: 'flutter',
    mode: 'inject',
    projectName: 'demo_app',
    packageName: 'demo_app',
    org: 'com.example',
    outputPath: projectPath,
    primaryColor: '0xff002f06',
    basePrimaryColor: '0xff004208',
    fontFamily: 'Inter',
    baseWidth: 390,
    baseHeight: 844,
    force: true,
    withShell: false,
    appClassName: 'DemoApp',
    appTitle: 'Demo App',
  };
}

describe('patchPubspec', () => {
  it('adds go_router and get_it foundation deps', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-pub-'));
    try {
      writeFileSync(
        join(dir, 'pubspec.yaml'),
        [
          'name: demo_app',
          'publish_to: "none"',
          'environment:',
          '  sdk: ^3.5.0',
          'dependencies:',
          '  flutter:',
          '    sdk: flutter',
          'flutter:',
          '  uses-material-design: true',
          '',
        ].join('\n'),
        'utf8',
      );

      patchPubspec(dir, baseOptions(dir));
      const content = readFileSync(join(dir, 'pubspec.yaml'), 'utf8');
      assert.match(content, /flutter_riverpod:/);
      assert.match(content, /flutter_svg:/);
      assert.match(content, /go_router:/);
      assert.match(content, /get_it:/);
      assert.match(content, /assets\/pngs\//);
      assert.match(content, /# scaffolder: fonts/);
      assert.match(content, /Inter/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
