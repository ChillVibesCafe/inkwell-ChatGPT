// Local, per-attempt acknowledgment only. Never persist or transmit acceptance.
export function acknowledgeChatGPTLicense() {
  let dialog = document.getElementById('chatgptLicenseDialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'chatgptLicenseDialog';
    dialog.setAttribute('aria-labelledby', 'chatgptLicenseTitle');
    dialog.innerHTML = `
      <h2 id="chatgptLicenseTitle">Before adding a ChatGPT account</h2>
      <h3>Inkwell — MIT License</h3>
      <p>Inkwell is free and open-source. Its MIT license generally lets you modify,
      distribute, and commercially use the application, provided you preserve the
      original copyright and license notices.</p>
      <h3>ChatGPT sign-in component — OpenAI DevKit Noncommercial License 1.0</h3>
      <p>This optional component has a separate license. It permits personal learning,
      experimentation, and noncommercial development, subject to its terms.
      Business or commercial use is not automatically permitted, even if no money changes hands.</p>
      <p>Commercial use of the SDK requires a separate written agreement directly
      with OpenAI. Publicly available licenses and documentation do not provide that permission.</p>
      <p><strong>Important:</strong> Inkwell's MIT license does not override the SDK's
      restrictions. Acknowledging this dialog does not grant additional licensing rights.</p>
      <p><a href="https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">Read the OpenAI SDK license</a>
      · <a href="https://openai.com/policies/sign-in-with-chatgpt-terms/" target="_blank" rel="noopener noreferrer">Sign in with ChatGPT Terms</a></p>
      <label class="license-check"><input id="chatgptLicenseAck" type="checkbox">
      <span>I understand that Inkwell and the ChatGPT integration have different licenses, that commercial SDK use requires separate written permission from OpenAI, and that accepting this notice does not grant that permission. I, The user, shall not use the ChatGPT integration to create commercial works.</span></label>
      <p class="sethint">This acknowledgment stays in memory for this attempt. Inkwell does not monitor or classify your manuscripts to enforce it.</p>
      <div class="license-actions"><button id="chatgptLicenseCancel" class="btn ghost" type="button">Cancel</button>
      <button id="chatgptLicenseContinue" class="btn primary" type="button" disabled>Agree &amp; Continue</button></div>`;
    document.body.append(dialog);
  }
  if (dialog.open) return Promise.resolve(false);
  const checkbox = dialog.querySelector('#chatgptLicenseAck');
  const agree = dialog.querySelector('#chatgptLicenseContinue');
  checkbox.checked = false;
  agree.disabled = true;
  dialog.returnValue = '';
  return new Promise(resolve => {
    checkbox.onchange = () => { agree.disabled = !checkbox.checked; };
    agree.onclick = () => { if (checkbox.checked) dialog.close('agree'); };
    dialog.querySelector('#chatgptLicenseCancel').onclick = () => dialog.close('cancel');
    dialog.addEventListener('close', () => {
      const accepted = dialog.returnValue === 'agree' && checkbox.checked;
      checkbox.checked = false;
      agree.disabled = true;
      resolve(accepted);
    }, { once: true });
    dialog.showModal();
  });
}
