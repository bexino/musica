import {readdirSync} from 'node:fs';
import path from 'node:path';

export function latestExecutable(arch) {
  const pattern = new RegExp(`^Stage-Lyrics-(\\d+)-${arch}\\.exe$`);
  const files = readdirSync('release').map(name => ({name, match: name.match(pattern)}))
    .filter(file => file.match).sort((a, b) => Number(b.match[1]) - Number(a.match[1]));
  if (!files.length) throw new Error(`No timestamped ${arch} executable found in release/`);
  return path.resolve('release', files[0].name);
}
