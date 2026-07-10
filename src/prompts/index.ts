import * as p from '@clack/prompts';
import { resolve } from 'node:path';
import pc from 'picocolors';
import { frameworks, getFramework } from '../registry/frameworks.js';
import type { FlutterMode, FlutterScaffoldOptions } from '../generators/types.js';
import {
  darkenPrimary,
  normalizeDartColor,
  toAppClassName,
  toAppTitle,
} from '../utils/render.js';
import {
  assertMode,
  assertOrg,
  assertPackageName,
  assertPositiveNumber,
  assertWritablePathHint,
  assertInjectProjectPath,
  normalizeUserPath,
  readPubspecPackageName,
} from '../utils/validate.js';

export interface CliFlags {
  framework?: string;
  mode?: string;
  name?: string;
  org?: string;
  path?: string;
  primary?: string;
  font?: string;
  baseWidth?: string;
  baseHeight?: string;
  force?: boolean;
  /** true = remove bak after, false = keep, undefined = ask */
  cleanBackups?: boolean;
}

const DESIGN_DEFAULTS = {
  primary: '002F06',
  font: 'DM Sans',
  baseWidth: 390,
  baseHeight: 844,
} as const;

function isCancel(value: unknown): boolean {
  return p.isCancel(value);
}

function assertDartColor(input: string): string {
  const normalized = normalizeDartColor(input, '');
  if (!normalized) {
    throw new Error(
      `Invalid color "${input}". Use hex like 002F06, #002F06, or 0xFF002F06.`,
    );
  }
  return normalized;
}

async function promptDesignOptions(flags: CliFlags): Promise<{
  primary: string;
  font: string;
  baseWidth: number;
  baseHeight: number;
}> {
  const allFlagsProvided =
    Boolean(flags.primary) &&
    Boolean(flags.font) &&
    Boolean(flags.baseWidth) &&
    Boolean(flags.baseHeight);

  if (allFlagsProvided) {
    return {
      primary: flags.primary!,
      font: flags.font!,
      baseWidth: assertPositiveNumber(flags.baseWidth, 'Base width', DESIGN_DEFAULTS.baseWidth),
      baseHeight: assertPositiveNumber(
        flags.baseHeight,
        'Base height',
        DESIGN_DEFAULTS.baseHeight,
      ),
    };
  }

  const useDefaults = await p.confirm({
    message: `Use design defaults? (${DESIGN_DEFAULTS.primary} / ${DESIGN_DEFAULTS.font} / ${DESIGN_DEFAULTS.baseWidth}×${DESIGN_DEFAULTS.baseHeight})`,
    initialValue: true,
  });
  if (isCancel(useDefaults)) {
    p.cancel('Cancelled.');
    process.exit(0);
  }

  if (useDefaults) {
    return {
      primary: flags.primary ?? DESIGN_DEFAULTS.primary,
      font: flags.font ?? DESIGN_DEFAULTS.font,
      baseWidth: assertPositiveNumber(
        flags.baseWidth,
        'Base width',
        DESIGN_DEFAULTS.baseWidth,
      ),
      baseHeight: assertPositiveNumber(
        flags.baseHeight,
        'Base height',
        DESIGN_DEFAULTS.baseHeight,
      ),
    };
  }

  const design = await p.group(
    {
      primary: () =>
        p.text({
          message: 'Primary color (hex)',
          initialValue: flags.primary ?? DESIGN_DEFAULTS.primary,
          placeholder: DESIGN_DEFAULTS.primary,
          validate: (v) => {
            try {
              assertDartColor(v ?? '');
              return undefined;
            } catch (e) {
              return e instanceof Error ? e.message : 'Invalid color';
            }
          },
        }),
      font: () =>
        p.text({
          message: 'Font family',
          initialValue: flags.font ?? DESIGN_DEFAULTS.font,
          validate: (v) => (!v?.trim() ? 'Font family is required' : undefined),
        }),
      baseWidth: () =>
        p.text({
          message: 'Design base width',
          initialValue: String(flags.baseWidth ?? DESIGN_DEFAULTS.baseWidth),
          validate: (v) => {
            try {
              assertPositiveNumber(v, 'Base width', DESIGN_DEFAULTS.baseWidth);
              return undefined;
            } catch (e) {
              return e instanceof Error ? e.message : 'Invalid width';
            }
          },
        }),
      baseHeight: () =>
        p.text({
          message: 'Design base height',
          initialValue: String(flags.baseHeight ?? DESIGN_DEFAULTS.baseHeight),
          validate: (v) => {
            try {
              assertPositiveNumber(v, 'Base height', DESIGN_DEFAULTS.baseHeight);
              return undefined;
            } catch (e) {
              return e instanceof Error ? e.message : 'Invalid height';
            }
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel('Cancelled.');
        process.exit(0);
      },
    },
  );

  return {
    primary: design.primary as string,
    font: design.font as string,
    baseWidth: Number(design.baseWidth),
    baseHeight: Number(design.baseHeight),
  };
}

export async function collectOptions(flags: CliFlags): Promise<FlutterScaffoldOptions> {
  p.intro('scaffolder — scalable codebase setup');

  const comingSoon = frameworks
    .filter((f) => !f.available)
    .map((f) => f.label)
    .join(', ');
  if (comingSoon) {
    p.log.message(pc.dim(`More frameworks later: ${comingSoon}`));
  }

  let frameworkId = flags.framework;
  if (!frameworkId) {
    const choice = await p.select({
      message: 'Select a framework',
      options: frameworks
        .filter((f) => f.available)
        .map((f) => ({
          value: f.id,
          label: f.label,
          hint: f.description,
        })),
    });
    if (isCancel(choice)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    frameworkId = choice as string;
  }

  const fw = getFramework(frameworkId);
  if (!fw) {
    throw new Error(`Unknown framework: ${frameworkId}`);
  }
  if (!fw.available) {
    throw new Error(`${fw.label} is coming soon. Pick Flutter for now.`);
  }

  let mode: FlutterMode;
  if (flags.mode) {
    mode = assertMode(flags.mode);
  } else {
    const modeChoice = await p.select({
      message: 'How should we set up the project?',
      options: [
        {
          value: 'create',
          label: 'Create a new Flutter app',
          hint: 'Runs flutter create, then adds the shared kit',
        },
        {
          value: 'inject',
          label: 'Inject into an existing Flutter project',
          hint: 'Needs a folder with pubspec.yaml + lib/',
        },
      ],
    });
    if (isCancel(modeChoice)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    mode = assertMode(modeChoice as string);
  }

  let packageName: string;
  let projectName: string;
  let outputPath: string;
  let org = flags.org ?? 'com.example';

  if (mode === 'inject') {
    // Path first → read package name from pubspec
    if (flags.path) {
      outputPath = assertInjectProjectPath(flags.path);
    } else {
      const pathIn = await p.text({
        message: 'Existing project folder',
        placeholder: 'C:\\Users\\...\\my_app',
        validate: (v) => {
          try {
            assertInjectProjectPath(v ?? '');
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : 'Invalid path';
          }
        },
      });
      if (isCancel(pathIn)) {
        p.cancel('Cancelled.');
        process.exit(0);
      }
      outputPath = assertInjectProjectPath(pathIn as string);
    }

    const fromPubspec = readPubspecPackageName(outputPath);
    if (flags.name) {
      packageName = assertPackageName(flags.name);
      if (packageName !== fromPubspec) {
        p.log.warn(
          `Using --name ${packageName} (pubspec has ${fromPubspec}). Imports must match pubspec name.`,
        );
      }
    } else {
      packageName = fromPubspec;
      p.log.info(`Package name from pubspec: ${packageName}`);
    }
    projectName = packageName;

    if (flags.org) {
      org = assertOrg(flags.org);
    }
  } else {
    // create: name → org → output folder
    let nameInput = flags.name;
    if (!nameInput) {
      const name = await p.text({
        message: 'Project name (dart package name)',
        placeholder: 'my_app',
        validate: (v) => {
          try {
            assertPackageName(v ?? '');
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : 'Invalid name';
          }
        },
      });
      if (isCancel(name)) {
        p.cancel('Cancelled.');
        process.exit(0);
      }
      nameInput = name as string;
    }
    packageName = assertPackageName(nameInput);
    projectName = nameInput;

    if (!flags.org) {
      const orgIn = await p.text({
        message: 'Organization (reverse domain)',
        placeholder: 'com.example',
        initialValue: 'com.example',
        validate: (v) => {
          try {
            assertOrg(v ?? '');
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : 'Invalid org';
          }
        },
      });
      if (isCancel(orgIn)) {
        p.cancel('Cancelled.');
        process.exit(0);
      }
      org = orgIn as string;
    }
    org = assertOrg(org);

    if (flags.path) {
      const normalized = normalizeUserPath(flags.path);
      assertWritablePathHint(normalized);
      outputPath = resolve(normalized);
    } else {
      const pathIn = await p.text({
        message: 'Output folder',
        placeholder: `./${packageName}`,
        initialValue: `./${packageName}`,
        validate: (v) => {
          try {
            normalizeUserPath(v ?? '');
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : 'Invalid path';
          }
        },
      });
      if (isCancel(pathIn)) {
        p.cancel('Cancelled.');
        process.exit(0);
      }
      const normalized = normalizeUserPath(pathIn as string);
      assertWritablePathHint(normalized);
      outputPath = resolve(normalized);
    }
  }

  const design = await promptDesignOptions(flags);
  const primaryColor = assertDartColor(design.primary);
  const basePrimaryColor = darkenPrimary(primaryColor);
  const resolvedBasePrimary =
    primaryColor === '0xff002f06' ? '0xff004208' : basePrimaryColor;

  const options: FlutterScaffoldOptions = {
    framework: 'flutter',
    mode,
    projectName,
    packageName,
    org,
    outputPath,
    primaryColor,
    basePrimaryColor: resolvedBasePrimary,
    fontFamily: design.font.trim(),
    baseWidth: assertPositiveNumber(design.baseWidth, 'Base width', DESIGN_DEFAULTS.baseWidth),
    baseHeight: assertPositiveNumber(
      design.baseHeight,
      'Base height',
      DESIGN_DEFAULTS.baseHeight,
    ),
    force: Boolean(flags.force),
    cleanBackups: flags.cleanBackups,
    appClassName: toAppClassName(packageName),
    appTitle: toAppTitle(packageName),
  };

  const isNonInteractive =
    Boolean(flags.framework) &&
    Boolean(flags.mode) &&
    Boolean(flags.path) &&
    (mode === 'inject' || Boolean(flags.name));

  if (!isNonInteractive) {
    const confirmed = await p.confirm({
      message: `Generate ${options.mode} → ${options.outputPath}?`,
      initialValue: true,
    });
    if (isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
  }

  return options;
}
