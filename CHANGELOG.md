# Changes

## Initial experimental ChatGPT source release

Based on Inkwell by Joshua Opel (Bowler Hat Studio), upstream baseline
`09c297e121370c3f27ea7352cbc50919faa86655`. ChatGPT integration and independent
modifications by ChillVibesCafe. This repository is maintained independently.

- Optional ChatGPT (Subscription) provider using the official OAuth/PKCE SDK,
  account-specific model selection and streaming Responses API.
- Windows CurrentUser DPAPI credential protection, refresh, reconnection,
  manual account selection, sign-out and usage-limit recovery.
- Existing story context, character memory, story bible and provider settings
  preserved. No automatic account rotation or API-key billing fallback.
- Privacy notice before sign-in; background summaries off unless explicitly enabled.
- Licensing acknowledgment before every new-account attempt, with no stored or
  transmitted acknowledgment record and no manuscript monitoring.
- Vertically resizable, wrapping, automatically growing optional direction field.
- Loopback/Host/Origin protections, contained storage paths, safe asset serving,
  bounded provider requests and compatible dependency security updates.
- Unmodified official SDK at `0a36fefeb913055c8c7a1a29b63d82b96b2e841a`, external
  build tooling, integrity checks, preserved licenses and notices.
- Windows launcher repairs missing or broken copied dependency installations.
- Synthetic regression/browser checks and an explicit-list source release archive.

Experimental limitations and mixed-license scope: see RELEASE.md and LICENSES.md.
No OpenAI endorsement or legal certification is implied.
