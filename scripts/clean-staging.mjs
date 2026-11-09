import {rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Only discard known intermediates after both portable executables build successfully.
const root = fileURLToPath(new URL('../', import.meta.url));
for (const relative of ['dist', 'release/win-unpacked', 'release/win-ia32-unpacked', 'release/builder-debug.yml']) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('Cleanup target outside project');
  await rm(target, {recursive: true, force: true});
}
