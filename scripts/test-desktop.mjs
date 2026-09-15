import { spawnSync } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [['run', 'package:local'], ['exec', '--', 'playwright', 'test', ...process.argv.slice(2)]]) {
  const result = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
