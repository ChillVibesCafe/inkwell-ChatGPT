# Contributing

This is an independent experimental edition of Joshua Opel's Inkwell, with the
ChatGPT integration maintained by ChillVibesCafe. Preserve original attribution.
Application changes use the existing MIT license; third-party materials retain
their own terms. Read LICENSES.md before using or distributing the SDK.

Use Node.js 22.12+ and Windows to exercise the supported ChatGPT storage path.
Run `npm ci`, `npm run build`, `npm run verify:sdk`, `npm test`, and
`npm run test:browser`. Browser tests use Microsoft Edge on Windows. All automated
fixtures must use synthetic data and mocked transport, never a contributor's
saved account, manuscripts or live subscription allowance.

Keep the official SDK unchanged. Put application adapters/build configuration
outside vendor/siwc-local. Verify integrity before proposing changes. Do not
replace PKCE, secure token storage or identity verification with custom shortcuts.

Do not commit books, settings, .chatgpt credentials, environment files, dependency
folders, engine binaries, local exports or test output. Review the staged diff
before committing. `npm run release:source` builds the explicit-list archive;
do not ZIP the whole working folder. Keep required third-party notices in releases.

Report ordinary bugs through this repository's issue tracker once it is public.
Include reproduction steps and redacted error codes, not prompts, tokens, account
identities or authorization URLs. Do not post vulnerabilities publicly before
coordinating with this repository's maintainer; see SECURITY.md.
