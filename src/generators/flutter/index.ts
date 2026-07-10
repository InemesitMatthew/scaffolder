import { resolve, relative } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import pc from 'picocolors';
import type { FlutterScaffoldOptions, GeneratorResult } from '../types.js';
import { isFlutterAvailable, runFlutterCreate } from './flutter_create.js';
import {
  assertInjectTarget,
  assertNoOverwrite,
  copyRenderedLibTemplates,
  copyPackageAssetPlaceholders,
  patchPubspec,
  removeDefaultCounterApp,
  writeMainDart,
  markFailedCreate,
} from './inject.js';
import { assertCreateParentExists } from '../../utils/validate.js';
import { listScaffolderBackups } from '../../utils/backups.js';

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

    const written = copyRenderedLibTemplates(projectPath, options);
    messages.push(
      pc.green(`Injected ${written.length} template files under lib/`),
    );

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

    copyPackageAssetPlaceholders(projectPath);
    removeDefaultCounterApp(projectPath);

    const backups = listScaffolderBackups(projectPath).map((b) =>
      relative(projectPath, b),
    );

    messages.push('');
    messages.push(pc.bold('Next steps:'));
    messages.push(`  cd ${projectPath}`);
    messages.push('  flutter pub get');
    messages.push('  flutter run');
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
      messages.push(
        pc.dim('  Restore: scaffolder restore <project>'),
      );
      messages.push(
        pc.dim('  Clean:   scaffolder clean-backups <project>'),
      );
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
