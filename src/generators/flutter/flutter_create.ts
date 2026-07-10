import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function isFlutterAvailable(): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const child = spawn('flutter', ['--version'], {
      shell: true,
      stdio: 'ignore',
    });
    child.on('error', () => resolvePromise(false));
    child.on('close', (code) => resolvePromise(code === 0));
  });
}

export async function runFlutterCreate(options: {
  projectName: string;
  org: string;
  outputPath: string;
}): Promise<void> {
  const parent = resolve(options.outputPath, '..');
  const projectDir = resolve(options.outputPath);

  if (existsSync(projectDir)) {
    throw new Error(
      `Target already exists: ${projectDir}. Use inject mode or pick another path.`,
    );
  }

  await new Promise<void>((resolvePromise, reject) => {
    const args = [
      'create',
      '--org',
      options.org,
      '--project-name',
      options.projectName,
      '--platforms=android,ios',
      projectDir,
    ];

    const child = spawn('flutter', args, {
      cwd: parent,
      shell: true,
      stdio: 'inherit',
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`flutter create exited with code ${code}`));
    });
  });
}
