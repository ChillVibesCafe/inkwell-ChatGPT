// Source distribution only: dependency installation/build happen after extraction.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import JSZip from 'jszip';
import { verifySDK } from './verify-siwc.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function releaseFiles(directory = root) {
  await verifySDK(directory);
  const files = new Set(['.gitattributes', '.gitignore', '.nojekyll',
    '.github/workflows/ci.yml', '.github/workflows/pages.yml', 'CONTRIBUTING.md', 'CHANGELOG.md',
    'package.json', 'package-lock.json',
    'README.md', 'LICENSE', 'LICENSES.md', 'THIRD_PARTY_NOTICES.md', 'SECURITY.md',
    'RELEASE.md', 'FRESH-CHATGPT.txt', 'index.html', 'server.js', 'start-inkwell.bat',
    'start-inkwell.ps1', 'playwright.config.js', 'build/tsconfig.siwc.json',
    'vendor/siwc-upstream.json', 'vendor/siwc-PROVENANCE.md']);
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'vendor/siwc-upstream.json'), 'utf8'));
  for (const file of Object.keys(manifest.files)) files.add(file);
  async function walk(relative) {
    for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && /\.(?:js|mjs|css|html|webmanifest)$/.test(file)) files.add(file);
      else throw new Error(`Unexpected source distribution entry: ${file}`);
    }
  }
  for (const folder of ['lib', 'public', 'scripts', 'test', 'browser-tests']) await walk(folder);
  for (const file of files) {
    // Refuse redirected files or parent folders; never follow user-data junctions.
    const parts = file.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const stat = await fs.lstat(path.join(directory, ...parts.slice(0, i)));
      if (stat.isSymbolicLink()) throw new Error(`Release source redirects outside its tree: ${file}`);
    }
  }
  return [...files].sort();
}
export async function releaseArchive(directory = root) {
  const zip = new JSZip();
  for (const file of await releaseFiles(directory)) zip.file(file, await fs.readFile(path.join(directory, file)));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const bytes = await releaseArchive();
  const output = path.join(root, 'release', 'inkwell-chatgpt-source.zip');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bytes);
  console.log(`Source release prepared: ${output} (${bytes.length} bytes). Not published.`);
}
