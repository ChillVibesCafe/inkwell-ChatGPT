# Attribution and third-party notices

This distribution is an **experimental ChatGPT integration patch** by
[ChillVibesCafe](https://github.com/ChillVibesCafe). Original Inkwell was created by
[Joshua Opel](https://github.com/joshuaopel), Bowler Hat Studio. All original
copyright and permission notices are retained. No upstream or OpenAI endorsement
is implied.

## Inkwell application

Copyright (c) 2026 Joshua Opel. Independently authored application modifications:
copyright (c) 2026 ChillVibesCafe. Both are distributed under the existing
[MIT License](LICENSE). This covers the independently written integration adapter
and UI; it does not relicense the bundled SDK or other third-party components.

## OpenAI Sign in with ChatGPT DevKit

- Component: `@siwc/local`, vendored in `vendor/siwc-local`.
- Copyright 2026 OpenAI.
- Source: <https://github.com/openai/sign-in-with-chatgpt-devkit>.
- Pinned commit: `0a36fefeb913055c8c7a1a29b63d82b96b2e841a`.
- License: **Sign-in with ChatGPT DevKit Noncommercial License, Version 1.0**,
  reproduced in full at [vendor/siwc-local/LICENSE](vendor/siwc-local/LICENSE).
- Upstream third-party notices are preserved in full, without alteration, at
  [vendor/siwc-local/THIRD_PARTY_NOTICES.md](vendor/siwc-local/THIRD_PARTY_NOTICES.md).
- Local changes and build provenance:
  [vendor/siwc-PROVENANCE.md](vendor/siwc-PROVENANCE.md).

All SDK package files, including source, tests, `package.json`, `tsconfig.json`,
and LICENSE, are unchanged from the pinned official Git tree. The official root
third-party notices, dependency inventory, and shared TypeScript base configuration
are also preserved verbatim. They retain their upstream licenses. An external
SHA-256 manifest verifies these files before building. Inkwell's build scripts,
configuration, and provenance record live outside the SDK directory. Generated
`dist` is disposable compiler output; it includes the official license, notices,
and dependency inventory, matching the upstream notice-copying behavior.

The SDK allows use and redistribution only for its defined Noncommercial
Purposes. Business/employer/client development, testing, distribution, or operation
for commercial advantage is excluded even when free. Commercial use of OpenAI's
contribution requires a separate written agreement with OpenAI. The MIT license
for the application does not grant commercial rights to the SDK. No OpenAI
service access, trademark, logo, or endorsement rights are granted by these notices.

## Other dependencies and distribution checklist

Other dependencies retain their own licenses; do not apply the application or SDK
license to separately licensed third-party materials. Exact resolved versions are
recorded in `package-lock.json`. Preserve each installed dependency's applicable
LICENSE, COPYING, NOTICE, copyright, and attribution files in any distribution
that includes it. The SDK notice file includes notices for the wider DevKit
examples; listing them does not mean this application ships those examples or fonts.

Include the root LICENSE, LICENSES.md, and this file together with the vendor
LICENSE, THIRD_PARTY_NOTICES.md, dependency inventory, and external provenance
record. Do not strip original notices when producing a package. These notices describe a
mixed-license distribution and do not relicense the entire application.

## Remaining licensing and service obligations

Reviewed 2026-10-24. The SDK license grants conditional noncommercial redistribution
rights, while section 4 of the
[Sign in with ChatGPT Terms](https://openai.com/policies/sign-in-with-chatgpt-terms/)
(September 29, 2026) prohibits altering/amending SIWC software and sublicensing
SIWC or underlying technology. The former SDK packaging/build adaptations have
been removed; all Inkwell build tooling now lives outside the SDK and compiles
unmodified official source. No SDK modification permission is relied upon.
Distribution still requires compliance with the SDK license and applicable
service terms. Any uncertainty about a particular distribution or use requires
clarification from OpenAI. This patch makes no assumption of an exception,
distribution clearance, or commercial permission. SDK recipients
receive rights directly from its contributors under its license; no sublicense
of OpenAI technology is offered here.

See [LICENSES.md](LICENSES.md) for scope and release decisions. Upstream maintainer
acceptance and applicable service/privacy/branding obligations remain separate.
This is a record of the unresolved issue, not a legal opinion or approval.
