# Experimental ChatGPT patch — source distribution

Original Inkwell: Joshua Opel (Bowler Hat Studio). Integration: ChillVibesCafe.
Application and independent modifications: MIT. Unmodified OpenAI SDK and supplied
OpenAI build inputs: DevKit Noncommercial License 1.0. Other dependencies retain
their own licenses. See LICENSES.md and THIRD_PARTY_NOTICES.md.

## Prepare and verify

On Node.js 22.12+ run `npm ci`, `npm run build`, `npm test`,
`npm run test:browser`, `npm run verify:sdk`, then `npm run release:source`.
The archive is `release/inkwell-chatgpt-source.zip`; nothing is uploaded.

This is a source release. Its explicit file list includes application source,
build tools, original SDK source/tests/notices, lockfile, regression tests and
documentation. It excludes node_modules, compiled SDK output, books, settings,
credentials, local Git state, logs, screenshots, caches, test outputs, marketing
materials, engine binaries and prior release archives. Required notices are
included. Unknown files within source folders or redirected paths fail packaging.
Use the generated archive, not a ZIP of this working folder. For a GitHub source
commit, stage only the same reviewed source list; .gitignore alone is not a
release audit and does not remove previously tracked files.

After extraction run `npm ci` (including development dependencies, needed for
TypeScript), then `npm start`, or use start-inkwell.bat on Windows. Build output
is regenerated from verified SDK source, and the official SDK license, third-party
notices and dependency inventory are copied into dist. Installed dependencies'
own notices stay with their packages. Playwright and test code support verification;
no node_modules or development executables are bundled in this source archive.

## Security and privacy boundary

The server binds only to loopback. All APIs validate peer, Host and browser Origin;
cross-site requests and form submissions are rejected. This is an OS-user trust
boundary, not per-process authentication: same-user native software can make local
requests and use that Windows user's DPAPI. Do not expose the port through a proxy
or use this on a shared/untrusted Windows account. See SECURITY.md.

ChatGPT authentication uses the unmodified SDK's OAuth/PKCE and verified identity
flow. Credentials are encrypted using Windows CurrentUser DPAPI. Session/profile
responses expose account labels and identity needed for account selection, not
tokens. Sign out deletes local credentials, attempts remote revocation, and keeps
registration/account mapping for reconnection; it is not full account-metadata
erasure. Remote revocation failures are shown with a ChatGPT Settings recovery path.
Cancelled sign-ins may retain a pending client registration without tokens so the
same connection can be retried. They do not authorize generation.

Story prompts and selected context go to OpenAI when ChatGPT is used; the privacy
notice precedes sign-in and background summaries require separate opt-in. There
is no commercial-content monitoring, telemetry, automatic account rotation or
billing fallback. Manual account selection is preserved.

The licensing checkbox is required for each new-account attempt and stays only
in memory. It supplies no extra rights and does not change the MIT license or
OpenAI's license. The requested user pledge is broader than a determination of
the legal status of a particular generated work; this app does not make that
determination or monitor enforcement.

## Release decisions and limits of verification

Public noncommercial redistribution is conditional on the SDK license and all
applicable service terms; public availability and a zero price alone do not
establish a noncommercial purpose. Commercial SDK use needs a separate written
OpenAI agreement. Upstream PR acceptance is a maintainer decision, not proof of
permission or a violation for an independent repository. No SDK modification permission
is relied upon. No legal certification or OpenAI endorsement is claimed.

Automated checks use synthetic accounts/data and mocked network transport. They
do not prove live account eligibility, end-to-end OpenAI sign-in or remote revocation.
The source ZIP can be inspected and tested independently before publication.

## Standalone repository preparation

This edition is prepared for a new, independently maintained GitHub repository,
with its own initial Git history. Original authorship, baseline provenance, and
licenses remain recorded; no claim of authorship of original Inkwell is made.
The upstream project URL in README identifies the source, not this repository's
destination. Set package homepage/repository metadata only after the new URL exists.

The initial commit must contain exactly the files returned by
`releaseFiles()` in scripts/package-release.mjs. Local manuscripts, runtime state,
old promotional assets and exports remain on disk but outside the commit. No
upstream/private Git history is imported. No remote or release tag is configured
by preparation, and no GitHub repository is created or pushed automatically.

The CI workflow verifies Node.js 22 and 24 on Windows, and runs browser checks
on Node.js 24. It has read-only repository permissions and does not publish.
The inherited guide publishing workflow is manual-only; it requires a separate
choice to enable/configure GitHub Pages. Hosted CI results are pending until
the source is published; local test results do not claim a hosted CI run.
