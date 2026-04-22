import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpmScript(script: 'test:report' | 'test:report:summary'): number {
  const result = spawnSync('npm', ['run', script], {
    cwd: appRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

const first = runNpmScript('test:report');
if (first !== 0) process.exit(first);
process.exit(runNpmScript('test:report:summary'));
