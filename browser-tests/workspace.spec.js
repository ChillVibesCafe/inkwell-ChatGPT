import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';

const appRoot = path.resolve(process.env.INKWELL_UI_APP || '.');
const subscription = existsSync(path.join(appRoot, 'lib/chatgpt.js'));
const enhancedDirection = existsSync(path.join(appRoot, 'public/direction.js'));
let root, child, base;
test.beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-browser-fixture-'));
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  base = `http://127.0.0.1:${port}`;
  // Never contact a real model or external service in this browser fixture.
  const prelude = `globalThis.fetch = async (url) => {
    if (url.endsWith('/api/tags')) return Response.json({ models: [{ name:'fixture-model' }] });
    throw new Error('External transport disabled in browser fixture');
  };`;
  child = spawn(process.execPath, ['--import','data:text/javascript;base64,'+Buffer.from(prelude).toString('base64'),'server.js'], {
    cwd: appRoot, env: { ...process.env, PORT:String(port), INKWELL_HOST:'127.0.0.1', INKWELL_BOOKS:path.join(root,'books') },
    windowsHide:true, stdio:'ignore',
  });
  let ready = false;
  for (let i=0;i<100;i++) {
    try { ready=(await fetch(base+'/api/settings')).ok; } catch {}
    if (ready) break;
    await new Promise((resolve)=>setTimeout(resolve,50));
  }
  expect(ready).toBe(true);
  await fetch(base+'/api/books', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Browser fixture',premise:'Synthetic only'}) });
});
test.afterAll(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise((resolve)=>child.once('exit',resolve));child.kill();await exited;
  }
  if (root && path.dirname(root) === path.resolve(os.tmpdir()) && path.basename(root).startsWith('inkwell-browser-fixture-')) await fs.rm(root,{recursive:true,force:true});
});
test.beforeEach(async ({page}) => {
  await page.route('https://**', (route)=>route.abort());
  await page.goto(base);
  await page.locator('.libcard').filter({hasText:'Browser fixture'}).click();
});

test('latest upstream workspace and model picker load without browser errors', async ({page}) => {
  const browserErrors = []; page.on('pageerror', error => browserErrors.push(error.message));
  await expect(page.locator('#modelSelect')).toHaveValue('fixture-model');
  await expect(page.locator('#storyCompassStatus')).toBeAttached();
  await page.locator('#seg button').filter({hasText:'Write'}).click();
  await expect(page.locator('#ai-instruction')).toBeVisible();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsModal')).toBeVisible();
  await expect(page.locator('#set-model')).toHaveValue('fixture-model');
  expect(browserErrors).toEqual([]);
});

test('direction wraps, grows, resizes vertically and retains long text at narrow widths', async ({page}) => {
  test.skip(!enhancedDirection,'This app intentionally retains the upstream direction control.');
  await page.locator('#seg button').filter({hasText:'Write'}).click();
  const box = page.locator('#ai-instruction');
  const before=await box.boundingBox();
  const text='Synthetic direction: preserve all text and wrap naturally. '.repeat(30);
  await box.fill(text);
  await expect(box).toHaveValue(text);
  const grown=await box.boundingBox();
  expect(grown.height).toBeGreaterThan(before.height);
  await expect.poll(()=>box.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  expect(await box.evaluate(e=>getComputedStyle(e).resize)).toBe('vertical');
  await box.scrollIntoViewIfNeeded();
  // Position the bottom grip in view without modifying DOM or the field value.
  await page.locator('.aipanel').evaluate(e=>{e.scrollTop=e.scrollHeight;});
  const rect=await box.boundingBox();
  await page.mouse.move(rect.x+rect.width-4,rect.y+rect.height-4);
  await page.mouse.down();await page.mouse.move(rect.x+rect.width-75,rect.y+rect.height-104,{steps:10});await page.mouse.up();
  const resized=await box.boundingBox();
  expect(resized.width).toBeCloseTo(rect.width,0);
  expect(resized.height).toBeLessThan(rect.height-20);
  await expect(box).toHaveValue(text);
  await page.setViewportSize({width:1000,height:800});
  await expect(box).toHaveValue(text);
  await expect.poll(()=>box.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});

test('privacy notice precedes sign-in and automatic subscription summaries default off', async ({page}) => {
  test.skip(!subscription,'Original has no subscription controls.');
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#chatgptPrivacyAck')).not.toBeChecked();
  await expect(page.locator('#set-chatgpt-background')).not.toBeChecked();
  let signIns=0;
  page.on('request',r=>{if(r.url().endsWith('/api/chatgpt/sign-in'))signIns++;});
  await page.locator('#chatgptConnect').click();
  await expect(page.locator('#toast')).toContainText('privacy notice');
  expect(signIns).toBe(0);
  const response=await page.request.get(base+'/privacy.html');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('Windows CurrentUser DPAPI');
});

test('every Add account attempt requires a fresh local licensing acknowledgment; cancel and Escape start no OAuth', async ({page}) => {
  test.skip(!subscription);
  await expect(page.locator('#chatgptLicenseDialog')).toHaveCount(0);
  const acknowledgmentStorage = () => page.evaluate(() => JSON.stringify(
    Object.entries({...localStorage, ...sessionStorage}).filter(([key]) => /licens|acknowledg/i.test(key))));
  const previousStorage = await acknowledgmentStorage();
  let signIns = 0;
  page.on('request', r => { if (r.url().endsWith('/api/chatgpt/sign-in')) signIns++; });
  await page.locator('#settingsBtn').click();
  await page.locator('#chatgptAdd').click();
  const dialog = page.locator('#chatgptLicenseDialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#chatgptLicenseAck')).not.toBeChecked();
  await expect(page.locator('#chatgptLicenseContinue')).toBeDisabled();
  await expect(dialog).toContainText('even if no money changes hands');
  await expect(dialog.locator('a').first()).toHaveAttribute('href', 'https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE');
  await expect(dialog.locator('a').last()).toHaveAttribute('href', 'https://openai.com/policies/sign-in-with-chatgpt-terms/');
  await page.locator('#chatgptLicenseAck').check();
  await expect(page.locator('#chatgptLicenseContinue')).toBeEnabled();
  await page.locator('#chatgptLicenseCancel').click();
  await expect(dialog).not.toBeVisible();
  await page.locator('#chatgptAdd').click();
  await expect(page.locator('#chatgptLicenseAck')).not.toBeChecked();
  await expect(page.locator('#chatgptLicenseContinue')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(signIns).toBe(0);
  expect(await acknowledgmentStorage()).toBe(previousStorage);
});

test('acknowledged sign-in failures restore controls and require fresh acknowledgment on retry', async ({page}) => {
  test.skip(!subscription);
  const bodies = [];
  await page.route('**/api/chatgpt/sign-in', async route => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({status: 502, contentType: 'application/json', body: JSON.stringify({error: 'Synthetic cancelled sign-in'})});
  });
  await page.locator('#settingsBtn').click();
  await page.locator('#chatgptPrivacyAck').check();
  await page.locator('#chatgptAdd').click();
  expect(bodies).toHaveLength(0);
  await page.locator('#chatgptLicenseAck').check();
  await page.locator('#chatgptLicenseContinue').click();
  await expect(page.locator('#toast')).toContainText('Synthetic cancelled sign-in');
  await expect(page.locator('#chatgptAdd')).toBeEnabled();
  await expect(page.locator('#chatgptCancel')).toBeHidden();
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toEqual({newProfile: true, reconsent: false, privacyAcknowledged: true});
  await page.locator('#chatgptAdd').click();
  await expect(page.locator('#chatgptLicenseAck')).not.toBeChecked();
  await expect(page.locator('#chatgptLicenseContinue')).toBeDisabled();
  await page.locator('#chatgptLicenseCancel').click();
  expect(bodies).toHaveLength(1);
});

test('existing accounts reconnect without a new-account dialog and switch only on explicit selection', async ({page}) => {
  test.skip(!subscription);
  let active = 'one';
  const selections = [], signIns = [];
  await page.route('**/api/chatgpt/session', route => route.fulfill({contentType:'application/json',body:JSON.stringify({
    session:{status:'connected',sharing:true,profileId:active,profileLabel:active},
    profiles:[{id:'one',label:'One'},{id:'two',label:'Two'}],
  })}));
  await page.route('**/api/chatgpt/select', async route => {
    active = route.request().postDataJSON().profileId; selections.push(active);
    await route.fulfill({contentType:'application/json',body:JSON.stringify({session:{status:'connected',sharing:true,profileId:active}})});
  });
  await page.route('**/api/chatgpt/sign-in', async route => {
    signIns.push(route.request().postDataJSON());
    await route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Synthetic reconnect failure'})});
  });
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#chatgptProfiles')).toHaveValue('one');
  expect(selections).toEqual([]);
  await page.locator('#chatgptProfiles').selectOption('two');
  await expect(page.locator('#chatgptProfiles')).toHaveValue('two');
  await page.locator('#chatgptPrivacyAck').check();
  await page.locator('#chatgptConnect').click();
  await expect(page.locator('#toast')).toContainText('Synthetic reconnect failure');
  await expect(page.locator('#chatgptLicenseDialog')).toHaveCount(0);
  expect(selections).toEqual(['two']);
  expect(signIns).toEqual([{newProfile:false,profileId:'two',reconsent:false,privacyAcknowledged:true}]);
});

test('licensing dialog fits desktop and narrow screens without clipped text or a full-width checkbox', async ({page}, testInfo) => {
  test.skip(!subscription);
  await page.locator('#settingsBtn').click();
  await page.locator('#chatgptAdd').click();
  const dialog = page.locator('#chatgptLicenseDialog');
  for (const viewport of [{width:1280,height:900},{width:640,height:1040},{width:360,height:740}]) {
    await page.setViewportSize(viewport);
    await expect(dialog).toBeVisible();
    const layout = await dialog.evaluate(e => {
      const box=e.getBoundingClientRect(), check=e.querySelector('input').getBoundingClientRect();
      const text=e.querySelector('.license-check span').getBoundingClientRect();
      const heading=e.querySelector('h2').getBoundingClientRect();
      return {left:box.left,right:box.right,width:e.clientWidth,scrollWidth:e.scrollWidth,
        checkboxWidth:check.width,textWidth:text.width,headingLeft:heading.left};
    });
    expect(layout.left).toBeGreaterThanOrEqual(0);
    expect(layout.right).toBeLessThanOrEqual(viewport.width);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.checkboxWidth).toBeLessThanOrEqual(20);
    expect(layout.textWidth).toBeGreaterThan(layout.width * .65);
    expect(layout.headingLeft).toBeGreaterThan(layout.left);
    await page.locator('#chatgptLicenseContinue').scrollIntoViewIfNeeded();
    await expect(page.locator('#chatgptLicenseContinue')).toBeInViewport();
    await expect(page.locator('#chatgptLicenseContinue')).toBeDisabled();
    await dialog.evaluate(e=>{e.scrollTop=0;});
    await page.screenshot({path:testInfo.outputPath(`license-${viewport.width}.png`)});
  }
  await page.locator('#chatgptLicenseAck').check();
  await expect(page.locator('#chatgptLicenseContinue')).toBeEnabled();
  await page.locator('#chatgptLicenseCancel').click();
});
