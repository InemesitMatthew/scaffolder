import { resolve, relative } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import pc from 'picocolors';
import type { FlutterScaffoldOptions, GeneratorResult } from '../types.js';
import { isFlutterAvailable, runFlutterCreate } from './flutter_create.js';
import {
  assertInjectTarget,
  assertNoOverwrite,
  cleanupLeftoverShell,
  copyRenderedLibTemplates,
  copyPackageAssetPlaceholders,
  patchPubspec,
  removeDefaultCounterApp,
  writeAnalysisOptions,
  writeCiWorkflow,
  writeHuskySetup,
  writeMainDart,
  markFailedCreate,
} from './inject.js';
import {
  assertCreateParentExists,
  assertCreateTargetAvailable,
} from '../../utils/validate.js';
import { listScaffolderBackups } from '../../utils/backups.js';

function pushExtraMessages(
  messages: string[],
  options: FlutterScaffoldOptions,
): void {
  const extras: string[] = [];
  if (options.withShell) extras.push('shell');
  if (options.withNetwork) extras.push('network');
  if (options.withSampleFeature) extras.push('sample-feature');
  if (options.withAuth) extras.push('auth');
  if (options.withL10n) extras.push('l10n');
  if (options.withLogging) extras.push('logging');
  if (options.withEnv) extras.push('env');
  if (options.withCi) extras.push('ci');
  if (options.withHusky) extras.push('husky');
  if (extras.length === 0) {
    messages.push(pc.dim('Extras: none (baseline only)'));
  } else {
    messages.push(pc.dim(`Extras: ${extras.join(', ')}`));
  }
}

export async function runFlutterGenerator(
  options: FlutterScaffoldOptions,
): Promise<GeneratorResult> {
  const projectPath = resolve(options.outputPath);
  const messages: string[] = [];
  let createdFresh = false;

  try {
    if (options.mode === 'create') {
      const ok = await isFlutterAvailable();
      if (!ok) {
        throw new Error(
          'Flutter SDK not found on PATH. Install Flutter or use --mode inject.',
        );
      }
      assertCreateParentExists(projectPath);
      assertCreateTargetAvailable(projectPath);
      messages.push(pc.dim('Running flutter create…'));
      await runFlutterCreate({
        projectName: options.packageName,
        org: options.org,
        outputPath: projectPath,
      });
      createdFresh = true;
      messages.push(pc.green('flutter create finished'));
    } else {
      assertInjectTarget(projectPath);
    }

    assertNoOverwrite(projectPath, options.force);

    const shellCleanup = cleanupLeftoverShell(projectPath, options);
    if (shellCleanup) messages.push(pc.dim(shellCleanup));

    const written = copyRenderedLibTemplates(projectPath, options);
    messages.push(
      pc.green(`Injected ${written.length} template files under lib/`),
    );
    pushExtraMessages(messages, options);

    const { backedUp } = writeMainDart(projectPath, options);
    messages.push(
      pc.green(
        backedUp
          ? 'Wired lib/main.dart (backup: main.dart.scaffolder.bak)'
          : 'Wired lib/main.dart',
      ),
    );

    patchPubspec(projectPath, options);
    messages.push(
      pc.green('Patched pubspec.yaml (backup: pubspec.yaml.scaffolder.bak)'),
    );

    const analysis = writeAnalysisOptions(projectPath);
    if (analysis.written) {
      messages.push(
        pc.green(
          analysis.backedUp
            ? 'Wrote analysis_options.yaml (backup: analysis_options.yaml.scaffolder.bak)'
            : 'Wrote analysis_options.yaml',
        ),
      );
    }

    if (writeCiWorkflow(projectPath, options)) {
      messages.push(pc.green('Added .github/workflows/flutter_ci.yml'));
    }

    if (writeHuskySetup(projectPath, options)) {
      messages.push(pc.green('Added .husky/ pre-commit + pre-push hooks'));
    }

    copyPackageAssetPlaceholders(projectPath);
    removeDefaultCounterApp(projectPath);

    const backups = listScaffolderBackups(projectPath).map((b) =>
      relative(projectPath, b),
    );

    messages.push('');
    messages.push(pc.bold('Next steps:'));
    messages.push(`  cd ${projectPath}`);
    messages.push('  flutter pub get');
    if (options.withHusky) {
      messages.push('  dart run husky install');
    }
    if (options.withL10n) {
      messages.push('  flutter gen-l10n');
    }
    if (options.withEnv) {
      messages.push(
        '  flutter run --dart-define=APP_ENV=dev --dart-define=API_BASE_URL=https://api.example.com',
      );
    } else {
      messages.push('  flutter run');
    }
    messages.push('');
    messages.push(
      pc.dim(
        `Import habit: package:${options.packageName}/core/core.dart + features/features.dart`,
      ),
    );
    if (backups.length > 0) {
      messages.push('');
      messages.push(pc.dim('Backups (undo / cleanup):'));
      for (const b of backups) {
        messages.push(pc.dim(`  - ${b}`));
      }
      messages.push(pc.dim('  Restore: scaffolder restore <project>'));
      messages.push(pc.dim('  Clean:   scaffolder clean-backups <project>'));
    }

    return { projectPath, mode: options.mode, messages, backups };
  } catch (err) {
    if (createdFresh && existsSync(projectPath)) {
      try {
        const moved = markFailedCreate(projectPath);
        messages.push(
          pc.yellow(
            `Create rolled back — incomplete project moved to:\n  ${moved}`,
          ),
        );
        try {
          rmSync(moved, { recursive: true, force: true });
          messages.push(pc.dim('Removed incomplete project directory.'));
        } catch {
          messages.push(
            pc.yellow(
              'Could not delete failed project; left renamed for inspection.',
            ),
          );
        }
      } catch {
        messages.push(
          pc.yellow(
            'Inject failed after flutter create; could not clean up project dir.',
          ),
        );
      }
    }

    const message = err instanceof Error ? err.message : String(err);
    const suffix =
      messages.length > 0 ? `\n${messages.filter(Boolean).join('\n')}` : '';
    throw new Error(`${message}${suffix}`);
  }
}
