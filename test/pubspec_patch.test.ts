import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  patchPubspec,
  copyRenderedLibTemplates,
  cleanupLeftoverShell,
  buildVars,
} from '../src/generators/flutter/inject.js';
import type { FlutterScaffoldOptions } from '../src/generators/types.js';
import {
  readPubspecPackageName,
  resolveOptionalBool,
} from '../src/utils/validate.js';

function baseOptions(
  projectPath: string,
  overrides: Partial<FlutterScaffoldOptions> = {},
): FlutterScaffoldOptions {
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
    withNetwork: false,
    withSampleFeature: false,
    withAuth: false,
    withL10n: false,
    withLogging: false,
    withEnv: false,
    withCi: false,
    appClassName: 'DemoApp',
    appTitle: 'Demo App',
    ...overrides,
  };
}

describe('readPubspecPackageName', () => {
  it('reads plain name', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-name-'));
    try {
      writeFileSync(join(dir, 'pubspec.yaml'), 'name: demo_app\n', 'utf8');
      assert.equal(readPubspecPackageName(dir), 'demo_app');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads quoted name and strips BOM', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-name-'));
    try {
      writeFileSync(
        join(dir, 'pubspec.yaml'),
        '\uFEFFname: "demo_app"\ndescription: x\n',
        'utf8',
      );
      assert.equal(readPubspecPackageName(dir), 'demo_app');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('resolveOptionalBool', () => {
  it('parses --with / --no flags from argv', () => {
    assert.equal(
      resolveOptionalBool(['node', 'cli', '--with-shell'], '--with-shell', '--no-shell'),
      true,
    );
    assert.equal(
      resolveOptionalBool(['node', 'cli', '--no-shell'], '--with-shell', '--no-shell'),
      false,
    );
    assert.equal(
      resolveOptionalBool(['node', 'cli'], '--with-shell', '--no-shell'),
      undefined,
    );
  });
});

describe('patchPubspec', () => {
  it('adds foundation deps', () => {
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
      assert.doesNotMatch(content, /dio:/);
      assert.match(content, /assets\/pngs\//);
      assert.match(content, /# scaffolder: fonts/);
      assert.match(content, /Inter/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('adds dio and talker when extras enabled', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-pub-'));
    try {
      writeFileSync(
        join(dir, 'pubspec.yaml'),
        [
          'name: demo_app',
          'dependencies:',
          '  flutter:',
          '    sdk: flutter',
          'flutter:',
          '  uses-material-design: true',
          '',
        ].join('\n'),
        'utf8',
      );

      patchPubspec(
        dir,
        baseOptions(dir, { withNetwork: true, withLogging: true, withEnv: true }),
      );
      const content = readFileSync(join(dir, 'pubspec.yaml'), 'utf8');
      assert.match(content, /dio:/);
      assert.match(content, /talker_flutter:/);
      assert.match(content, /# scaffolder: dart-define/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('copyRenderedLibTemplates', () => {
  const norm = (f: string) => f.replace(/\\/g, '/');

  it('baseline skips optional network files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-copy-'));
    try {
      mkdirSync(join(dir, 'lib'), { recursive: true });
      const written = copyRenderedLibTemplates(dir, baseOptions(dir)).map(norm);
      assert.ok(written.some((f) => f.includes('core/theme')));
      assert.ok(!written.some((f) => f.includes('core/network')));
      assert.ok(!written.some((f) => f.includes('features/shell')));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('withNetwork copies ApiClient and error types', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-copy-'));
    try {
      mkdirSync(join(dir, 'lib'), { recursive: true });
      const written = copyRenderedLibTemplates(
        dir,
        baseOptions(dir, { withNetwork: true }),
      ).map(norm);
      assert.ok(written.some((f) => f.includes('core/network')));
      assert.ok(written.some((f) => f.includes('core/error')));
      const client = readFileSync(
        join(dir, 'lib', 'core', 'network', 'api_client.dart'),
        'utf8',
      );
      assert.match(client, /api\.example\.com/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('core leaves stay acyclic; app imports app_router separately', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-copy-'));
    try {
      mkdirSync(join(dir, 'lib'), { recursive: true });
      copyRenderedLibTemplates(
        dir,
        baseOptions(dir, { withNetwork: true, withLogging: true, withEnv: true }),
      );
      const router = readFileSync(
        join(dir, 'lib', 'core', 'router', 'app_router.dart'),
        'utf8',
      );
      const routerBarrel = readFileSync(
        join(dir, 'lib', 'core', 'router', 'router.dart'),
        'utf8',
      );
      const app = readFileSync(join(dir, 'lib', 'app', 'app.dart'), 'utf8');
      const locator = readFileSync(
        join(dir, 'lib', 'core', 'locator', 'locator_service.dart'),
        'utf8',
      );
      const client = readFileSync(
        join(dir, 'lib', 'core', 'network', 'api_client.dart'),
        'utf8',
      );
      const theme = readFileSync(
        join(dir, 'lib', 'core', 'theme', 'app_theme.dart'),
        'utf8',
      );
      assert.doesNotMatch(router, /package:demo_app\/core\/core\.dart/);
      assert.match(router, /package:go_router\/go_router\.dart/);
      assert.match(router, /import 'app_routes\.dart'/);
      assert.match(router, /package:demo_app\/features\/features\.dart/);
      assert.match(router, /\.\.\/logging\/app_logger\.dart/);
      assert.match(routerBarrel, /export 'app_routes\.dart'/);
      assert.doesNotMatch(routerBarrel, /app_router/);
      assert.match(app, /package:demo_app\/core\/core\.dart/);
      assert.match(app, /package:demo_app\/core\/router\/app_router\.dart/);
      assert.doesNotMatch(locator, /package:demo_app\/core\/core\.dart/);
      assert.match(locator, /package:get_it\/get_it\.dart/);
      assert.match(locator, /\.\.\/network\/api_client\.dart/);
      assert.match(locator, /\.\.\/logging\/app_logger\.dart/);
      assert.doesNotMatch(client, /package:demo_app\/core\/core\.dart/);
      assert.match(client, /package:dio\/dio\.dart/);
      assert.match(client, /\.\.\/config\/app_config\.dart/);
      assert.match(client, /AppConfig\.apiBaseUrl/);
      assert.doesNotMatch(theme, /package:demo_app\/core\/core\.dart/);
      assert.doesNotMatch(theme, /features\/features\.dart/);
      assert.match(theme, /features\/shared\/constants\/palette\.dart/);
      assert.match(theme, /\.\.\/utils\/sizing_utils\.dart/);
      const networkBarrel = readFileSync(
        join(dir, 'lib', 'core', 'network', 'network.dart'),
        'utf8',
      );
      const loggingBarrel = readFileSync(
        join(dir, 'lib', 'core', 'logging', 'logging.dart'),
        'utf8',
      );
      const coreBarrel = readFileSync(join(dir, 'lib', 'core', 'core.dart'), 'utf8');
      assert.doesNotMatch(networkBarrel, /package:dio/);
      assert.doesNotMatch(loggingBarrel, /package:talker/);
      assert.match(coreBarrel, /package:dio\/dio\.dart/);
      assert.match(coreBarrel, /package:talker_flutter/);
      assert.ok(!existsSync(join(dir, 'lib', 'core', 'error', 'result.dart')));
      assert.ok(existsSync(join(dir, 'lib', 'core', 'error', 'failure.dart')));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('cleanupLeftoverShell', () => {
  it('removes shell dir when force and shell off', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scaffolder-shell-'));
    try {
      const shell = join(dir, 'lib', 'features', 'shell');
      mkdirSync(shell, { recursive: true });
      writeFileSync(join(shell, 'shell.dart'), 'export "";\n', 'utf8');
      const msg = cleanupLeftoverShell(dir, baseOptions(dir, { force: true }));
      assert.match(String(msg), /Removed leftover/);
      assert.equal(existsSync(shell), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('buildVars', () => {
  it('sets shellExport only when withShell', () => {
    const off = buildVars(baseOptions('/tmp'));
    assert.equal(off.shellExport, '');
    const on = buildVars(baseOptions('/tmp', { withShell: true }));
    assert.match(String(on.shellExport), /shell\/shell\.dart/);
  });

  it('locator uses relative sibling imports inside core', () => {
    const vars = buildVars(
      baseOptions('/tmp', {
        withNetwork: true,
        withLogging: true,
        withAuth: true,
        withEnv: true,
      }),
    );
    assert.match(String(vars.locatorExtraImports), /\.\.\/network\/api_client\.dart/);
    assert.match(String(vars.locatorExtraImports), /\.\.\/logging\/app_logger\.dart/);
    assert.match(String(vars.locatorExtraImports), /talker_flutter/);
    assert.match(String(vars.locatorExtraImports), /flutter_secure_storage/);
    assert.match(String(vars.secureStorageExport), /flutter_secure_storage/);
    assert.match(String(vars.dioExport), /package:dio/);
    assert.match(String(vars.talkerExport), /talker_flutter/);
    assert.match(String(vars.networkExport), /network\/network\.dart/);
    assert.match(String(vars.routerLoggingImports), /\.\.\/logging\/app_logger\.dart/);
    assert.match(String(vars.networkConfigImport), /\.\.\/config\/app_config\.dart/);
  });
});
