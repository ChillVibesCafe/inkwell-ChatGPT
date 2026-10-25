// Inkwell-only build wrapper; do not edit the vendored SDK or its package scripts.
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { verifySDK } from './verify-siwc.mjs';

const root = new URL('../', import.meta.url);
await verifySDK();
const require = createRequire(import.meta.url);
const compilerPackage = require.resolve('typescript/package.json');
const compiler = JSON.parse(await readFile(compilerPackage, 'utf8'));
const compilerBin = path.resolve(path.dirname(compilerPackage), compiler.bin.tsc);
const result = spawnSync(process.execPath, [compilerBin, '-p', 'build/tsconfig.siwc.json'], {
  cwd: fileURLToPath(root), stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// Match upstream's notice-copying behavior without changing its package.json.
const dist = new URL('vendor/siwc-local/dist/', root);
await mkdir(new URL('docs/', dist), { recursive: true });
for (const filename of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await copyFile(new URL(`vendor/siwc-local/${filename}`, root), new URL(filename, dist));
}
await copyFile(new URL('vendor/siwc-dependency-inventory.json', root), new URL('docs/dependency-inventory.json', dist));
