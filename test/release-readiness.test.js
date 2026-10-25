import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import JSZip from 'jszip';
import { verifySDK } from '../scripts/verify-siwc.mjs';
import { releaseArchive, releaseFiles, root } from '../scripts/package-release.mjs';
import { createChatGPT } from '@siwc/local';
import { ConnectionStore } from '../vendor/siwc-local/dist/storage.js';

async function temporary(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-release-check-'));
  t.after(async () => {
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    assert(path.basename(dir).startsWith('inkwell-release-check-'));
    await fs.rm(dir, {recursive:true, force:true});
  });
  return dir;
}

test('integrity check rejects changed SDK configuration, missing notices and extra files without touching the real SDK', async t => {
  const dir = await temporary(t);
  const manifest = JSON.parse(await fs.readFile(path.join(root,'vendor/siwc-upstream.json')));
  for (const file of ['vendor/siwc-upstream.json', ...Object.keys(manifest.files)]) {
    await fs.mkdir(path.dirname(path.join(dir,file)), {recursive:true});
    await fs.copyFile(path.join(root,file),path.join(dir,file));
  }
  await verifySDK(dir);
  const config = path.join(dir,'vendor/siwc-local/package.json');
  const original = await fs.readFile(config);
  await fs.writeFile(config,'{}');
  await assert.rejects(verifySDK(dir), /Official SDK file changed/);
  await fs.writeFile(config, original);
  const notice = path.join(dir,'vendor/siwc-local/THIRD_PARTY_NOTICES.md');
  await fs.unlink(notice);
  await assert.rejects(verifySDK(dir), /ENOENT/);
  await fs.copyFile(path.join(root,'vendor/siwc-local/THIRD_PARTY_NOTICES.md'), notice);
  await fs.writeFile(path.join(dir,'vendor/siwc-local/local-patch.js'),'// synthetic');
  await assert.rejects(verifySDK(dir), /Unexpected SDK source entry/);
});

test('source release includes exact upstream notices and build inputs, excludes runtime data and bundled dependencies', async () => {
  const zip = await JSZip.loadAsync(await releaseArchive());
  const names = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  assert.deepEqual(names.sort(), await releaseFiles());
  for (const name of names) assert(!/(^|\/)(?:books|settings\.json|\.chatgpt|node_modules|\.git|output|release|test-results|playwright-report|dist|engine)(\/|$)/.test(name),name);
  for (const name of ['LICENSE','LICENSES.md','THIRD_PARTY_NOTICES.md','vendor/siwc-local/LICENSE',
    'vendor/siwc-local/THIRD_PARTY_NOTICES.md','vendor/siwc-dependency-inventory.json',
    'vendor/siwc-PROVENANCE.md','scripts/build-siwc.mjs','public/chatgpt-license.js']) {
    assert(zip.file(name), name);
    assert((await zip.file(name).async('nodebuffer')).equals(await fs.readFile(path.join(root,name))),name);
  }
});

test('real SDK keeps manual profile selection on 429 and on cancelled/failed Add account; sign-out removes only selected credentials', async t => {
  const dir = await temporary(t);
  // Ephemeral authenticated encryption is solely a synthetic test provider.
  const key = randomBytes(32);
  const encryption = { id:'synthetic-aes-gcm', isAvailable:()=>true,
    encrypt(text) { const iv=randomBytes(12), c=createCipheriv('aes-256-gcm',key,iv); const b=Buffer.concat([c.update(text,'utf8'),c.final()]); return Buffer.concat([iv,c.getAuthTag(),b]); },
    decrypt(bytes) { const b=Buffer.from(bytes), d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8'); },
  };
  const store = new ConnectionStore(dir,encryption);
  const profiles = ['one','two'].map(id=>({version:1,id,label:id,clientId:'synthetic-client-'+id,subject:id,
    status:'connected',scopes:['openid','chatgpt.tokens.use.direct'],savedAt:new Date().toISOString(),
    credentials:{accessToken:'synthetic-access-'+id,refreshToken:'synthetic-refresh-'+id,expiresAt:Date.now()+3600000}}));
  await store.withLock(()=>store.write({version:2,activeProfileId:'one',profiles,pendingRegistrations:[]}));
  let calls=0;
  t.mock.method(globalThis,'fetch',async url=>{
    calls++;
    if (String(url).endsWith('/.well-known/openid-configuration')) return Response.json({
      issuer:'https://auth.openai.com',authorization_endpoint:'https://auth.openai.com/oauth/authorize',
      token_endpoint:'https://auth.openai.com/oauth/token',jwks_uri:'https://auth.openai.com/jwks',
      revocation_endpoint:'https://auth.openai.com/oauth/revoke',
    });
    return String(url).includes('revoke') ? Response.json({}) : Response.json({error:{code:'subscription_sharing_usage_limit_exceeded',message:'Synthetic limit'}},{status:429});
  });
  let failOpening=false;
  const client=createChatGPT({appName:'Synthetic fixture',appId:'synthetic-fixture',redirectPort:0,storageDir:dir,credentialEncryption:encryption,
    openBrowser:()=>{if(failOpening)throw new Error('Synthetic opener failure');client.cancelSignIn();}});
  await client.selectProfile('two');
  await assert.rejects(client.streamResponse({model:'fixture',input:[{role:'user',content:'Synthetic only'}]}),e=>e.status===429);
  assert.equal(calls,1,'No retry loop or second account request');
  assert.equal((await client.getSession()).profileId,'two');
  await assert.rejects(client.signIn({newProfile:true}),e=>e.code==='cancelled');
  assert.equal((await client.getSession()).profileId,'two');
  failOpening=true;
  await assert.rejects(client.signIn({newProfile:true}));
  assert.equal((await client.getSession()).status,'connected');
  assert.equal((await client.listProfiles()).length,2);
  await client.disconnect();
  const saved=await store.withLock(()=>store.read());
  assert.equal(saved.profiles.find(p=>p.id==='two').credentials,undefined);
  assert(saved.profiles.find(p=>p.id==='one').credentials);
  assert.equal((await client.getSession()).sharing,false);
  assert(!JSON.stringify(await client.listProfiles()).includes('synthetic-access'));
});
