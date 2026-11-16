import {spawnSync} from 'node:child_process';

const arch = process.argv[2];
if (!['x64', 'ia32'].includes(arch)) throw new Error('Expected x64 or ia32');
const artifactName = `Stage-Lyrics-${Date.now()}-${arch}.\${ext}`;
const result = spawnSync(process.execPath, ['node_modules/electron-builder/cli.js', '--win', 'portable', `--${arch}`, `--config.artifactName=${artifactName}`], {stdio: 'inherit'});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
