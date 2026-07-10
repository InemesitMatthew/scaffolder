import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { collectOptions, type CliFlags } from './prompts/index.js';
import { runFlutterGenerator } from './generators/flutter/index.js';
import { getFramework } from './registry/frameworks.js';
import {
  cleanScaffolderBackups,
  listScaffolderBackups,
  restoreScaffolderBackups,
} from './utils/backups.js';

async function maybeCleanBackups(
  projectPath: string,
  backups: string[],
  cleanBackupsFlag: boolean | undefined,
  interactive: boolean,
): Promise<void> {
  if (backups.length === 0) return;

  let shouldClean = cleanBackupsFlag;
  if (shouldClean === undefined && interactive) {
    const answer = await p.confirm({
      message: `Remove ${backups.length} backup file(s) (*.scaffolder.bak)?`,
      initialValue: false,
    });
    if (p.isCancel(answer)) {
      p.log.message(
        pc.dim('Kept backups. Restore later with: scaffolder restore <project>'),
      );
      return;
    }
    shouldClean = Boolean(answer);
  }

  if (shouldClean) {
    const removed = cleanScaffolderBackups(projectPath);
    p.log.success(`Removed ${removed.length} backup(s).`);
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('scaffolder')
    .description('Scaffold scalable codebases — Flutter first, more frameworks later')
    .version('0.1.0');

  program
    .command('restore')
    .description(
      'Restore originals from *.scaffolder.bak (undo main.dart / pubspec overwrite)',
    )
    .argument('<path>', 'Flutter project path')
    .action((pathArg: string) => {
      const projectPath = resolve(pathArg);
      if (!existsSync(projectPath)) {
        p.cancel(`Path does not exist: ${projectPath}`);
        process.exit(1);
      }
      const listed = listScaffolderBackups(projectPath);
      if (listed.length === 0) {
        p.outro(pc.yellow('No *.scaffolder.bak files found.'));
        return;
      }
      const { restored } = restoreScaffolderBackups(projectPath);
      for (const file of restored) {
        console.log(pc.green(`Restored ${file}`));
      }
      p.outro(
        pc.green(
          `Restored ${restored.length} file(s). Optional: scaffolder clean-backups "${projectPath}"`,
        ),
      );
    });

  program
    .command('clean-backups')
    .description('Delete *.scaffolder.bak files (keeps current scaffolded files)')
    .argument('<path>', 'Flutter project path')
    .action((pathArg: string) => {
      const projectPath = resolve(pathArg);
      if (!existsSync(projectPath)) {
        p.cancel(`Path does not exist: ${projectPath}`);
        process.exit(1);
      }
      const removed = cleanScaffolderBackups(projectPath);
      if (removed.length === 0) {
        p.outro(pc.yellow('No *.scaffolder.bak files found.'));
        return;
      }
      for (const file of removed) {
        console.log(pc.dim(`Removed ${file}`));
      }
      p.outro(pc.green(`Removed ${removed.length} backup(s).`));
    });

  // Default: scaffold (no subcommand required)
  program
    .option('-f, --framework <id>', 'framework id (flutter)')
    .option('-m, --mode <mode>', 'create | inject')
    .option('-n, --name <name>', 'project / package name')
    .option('-o, --org <org>', 'organization reverse domain')
    .option('-p, --path <path>', 'output or inject path')
    .option('--primary <hex>', 'primary color hex')
    .option('--font <name>', 'font family')
    .option('--base-width <n>', 'design base width')
    .option('--base-height <n>', 'design base height')
    .option('--force', 'overwrite existing core/shared', false)
    .option('--clean-backups', 'delete *.scaffolder.bak after success')
    .option('--keep-backups', 'keep *.scaffolder.bak after success (skip prompt)')
    .action(async (opts) => {
      try {
        let cleanBackups: boolean | undefined;
        if (opts.cleanBackups) cleanBackups = true;
        else if (opts.keepBackups) cleanBackups = false;

        const flags: CliFlags = {
          framework: opts.framework,
          mode: opts.mode,
          name: opts.name,
          org: opts.org,
          path: opts.path,
          primary: opts.primary,
          font: opts.font,
          baseWidth: opts.baseWidth,
          baseHeight: opts.baseHeight,
          force: opts.force,
          cleanBackups,
        };

        if (flags.framework) {
          const fw = getFramework(flags.framework);
          if (!fw) throw new Error(`Unknown framework: ${flags.framework}`);
          if (!fw.available) {
            throw new Error(`${fw.label} is coming soon.`);
          }
        }

        const interactive = !(
          flags.framework &&
          flags.mode &&
          flags.path &&
          (flags.mode === 'inject' || flags.name)
        );

        const options = await collectOptions(flags);
        const s = p.spinner();
        s.start('Scaffolding…');
        const result = await runFlutterGenerator(options);
        s.stop('Done');
        for (const line of result.messages) {
          console.log(line);
        }

        await maybeCleanBackups(
          result.projectPath,
          result.backups,
          options.cleanBackups,
          interactive,
        );

        p.outro(pc.green(`Project ready at ${result.projectPath}`));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        p.cancel(message);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

main();
