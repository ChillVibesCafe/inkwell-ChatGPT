import { spawn } from 'node:child_process';

// Windows CurrentUser DPAPI: no password, plaintext file, or application key.
// Secrets travel over anonymous stdin/stdout pipes, never command arguments.
function dpapi(operation, bytes) {
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; ` +
    `$b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); ` +
    `$r=[System.Security.Cryptography.ProtectedData]::${operation}($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser); ` +
    `[Console]::Out.Write([Convert]::ToBase64String($r))`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], {
      windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000,
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.resume(); // Never log OS diagnostics that could contain credentials.
    child.on('error', () => reject(new Error('Windows credential protection is unavailable.')));
    child.stdin.on('error', () => {});
    child.on('close', (code) => code === 0 && output.trim()
      ? resolve(Buffer.from(output.trim(), 'base64'))
      : reject(new Error('Windows credential protection failed.')));
    child.stdin.end(Buffer.from(bytes).toString('base64'));
  });
}

export const credentialEncryption = {
  id: 'inkwell-windows-dpapi-v1',
  isAvailable: () => process.platform === 'win32',
  encrypt: (plaintext) => dpapi('Protect', Buffer.from(plaintext, 'utf8')),
  decrypt: async (ciphertext) => (await dpapi('Unprotect', ciphertext)).toString('utf8'),
};
