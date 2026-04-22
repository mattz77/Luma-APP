import { spawnSync } from 'node:child_process';
const appRoot = process.cwd();

function runNpmScript(script: 'test:report' | 'test:report:summary'): number {
  const result = spawnSync('npm', ['run', script], {
    cwd: appRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

const reportExit = runNpmScript('test:report');
runNpmScript('test:report:summary');
process.exit(reportExit);
