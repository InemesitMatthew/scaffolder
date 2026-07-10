import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPackageName,
  assertMode,
  assertOrg,
  assertPositiveNumber,
  normalizeUserPath,
} from '../src/utils/validate.js';
import {
  toPackageName,
  toAppClassName,
  normalizeDartColor,
  renderTemplate,
} from '../src/utils/render.js';

describe('toPackageName', () => {
  it('normalizes mixed input', () => {
    assert.equal(toPackageName('My App'), 'my_app');
    assert.equal(toPackageName('  Hello-World  '), 'hello_world');
  });
});

describe('assertPackageName', () => {
  it('accepts valid names', () => {
    assert.equal(assertPackageName('my_app'), 'my_app');
  });

  it('rejects reserved names', () => {
    assert.throws(() => assertPackageName('flutter'), /reserved/);
  });

  it('rejects empty', () => {
    assert.throws(() => assertPackageName(''), /required/);
  });
});

describe('assertMode', () => {
  it('accepts create and inject', () => {
    assert.equal(assertMode('create'), 'create');
    assert.equal(assertMode('inject'), 'inject');
  });

  it('rejects unknown', () => {
    assert.throws(() => assertMode('clone'), /Invalid mode/);
  });
});

describe('assertOrg', () => {
  it('accepts reverse domain', () => {
    assert.equal(assertOrg('com.example'), 'com.example');
  });

  it('rejects single segment', () => {
    assert.throws(() => assertOrg('example'), /Invalid org/);
  });
});

describe('assertPositiveNumber', () => {
  it('uses fallback for empty', () => {
    assert.equal(assertPositiveNumber(undefined, 'W', 390), 390);
  });

  it('rejects zero and negative', () => {
    assert.throws(() => assertPositiveNumber(0, 'W', 390), /positive/);
    assert.throws(() => assertPositiveNumber(-1, 'W', 390), /positive/);
  });
});

describe('normalizeUserPath', () => {
  it('rejects leading-dot drive paths', () => {
    assert.throws(
      () => normalizeUserPath('.C:\\Users\\x\\app'),
      /leading dot/,
    );
  });

  it('rejects bare dot', () => {
    assert.throws(() => normalizeUserPath('.'), /full path/);
  });

  it('accepts relative project paths', () => {
    assert.equal(normalizeUserPath('./my_app'), './my_app');
  });
});

describe('normalizeDartColor', () => {
  it('normalizes hex forms', () => {
    assert.equal(normalizeDartColor('002F06', ''), '0xff002f06');
    assert.equal(normalizeDartColor('#002F06', ''), '0xff002f06');
    assert.equal(normalizeDartColor('0xFF002F06', ''), '0xff002f06');
  });

  it('returns fallback when invalid', () => {
    assert.equal(normalizeDartColor('ZZ', '0xff002f06'), '0xff002f06');
    assert.equal(normalizeDartColor('ZZ', ''), '');
  });
});

describe('toAppClassName', () => {
  it('builds PascalCase App suffix', () => {
    assert.equal(toAppClassName('my_app'), 'MyApp');
    assert.equal(toAppClassName('sen'), 'SenApp');
  });
});

describe('renderTemplate', () => {
  it('replaces placeholders', () => {
    const out = renderTemplate('hi {{packageName}}', { packageName: 'sen' });
    assert.equal(out, 'hi sen');
  });

  it('leaves unknown placeholders', () => {
    assert.equal(renderTemplate('{{missing}}', {}), '{{missing}}');
  });
});
