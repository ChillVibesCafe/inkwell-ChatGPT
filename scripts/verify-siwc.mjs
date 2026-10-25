// Inkwell build tooling. SDK files and hashes come from the pinned official Git tree.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export async function verifySDK(root = projectRoot) {
  const manifest = JSON.parse(await readFile(path.join(root, 'vendor/siwc-upstream.json'), 'utf8'));
  for (const [file, expected] of Object.entries(manifest.files)) {
    const hash = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
    if (hash !== expected.sha256) throw new Error(`Official SDK file changed: ${file}. Restore it from ${manifest.commit}; keep app changes outside the SDK.`);
  }
  async function walk(relative) {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      // dist is disposable compiler output, never part of the vendored source.
      if (file === 'vendor/siwc-local/dist') continue;
      if (entry.isDirectory()) await walk(file);
      else if (!entry.isFile() || !manifest.files[file]) throw new Error(`Unexpected SDK source entry: ${file}`);
    }
  }
  await walk('vendor/siwc-local');
  console.log(`Official SDK integrity verified (${Object.keys(manifest.files).length} files, ${manifest.commit}).`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await verifySDK();
