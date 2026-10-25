# License scope and distribution

This is an **experimental ChatGPT integration patch by ChillVibesCafe** for
Inkwell, originally created by Joshua Opel (Bowler Hat Studio). Attribution does
not imply approval or endorsement by the original creator or OpenAI.

Original Inkwell application code and independently authored modifications,
including the ChatGPT adapter, credential storage, consent UI and direction
textarea, remain under the existing MIT license in [LICENSE](LICENSE).
Copyright (c) 2026 Joshua Opel; independently authored modifications copyright
(c) 2026 ChillVibesCafe. No original copyright or license notice is removed.

The optional bundled @siwc/local SDK in vendor/siwc-local is under OpenAI's
Sign-in with ChatGPT DevKit Noncommercial License v1.0, NOT MIT. Its terms apply
independently; calling it does not grant MIT rights to the SDK.
The SDK license's definition of Modified Work excludes independently authored
software merely calling, linking to, or communicating with it through an interface.
The bundled SDK package, including package.json and tsconfig.json, is unmodified
from official commit 0a36fefeb913055c8c7a1a29b63d82b96b2e841a. Its upstream license,
third-party notices, dependency inventory, and shared TypeScript base configuration
are preserved verbatim. These OpenAI-authored materials remain under their
applicable upstream terms. Inkwell's independently authored build wrapper and
configuration are outside the SDK directory and remain MIT licensed.

Noncommercial redistribution is conditional on its license, preserved notices,
and changed-file notices if future modifications are made. Commercial use, including business/client
product development as defined by that license, requires a separate written
OpenAI agreement. Moving installation to a dependency does not remove this rule.
The official package is currently a private local workspace, not a public npm
package. This edition uses a pinned source package with provenance and notices.

Read vendor/siwc-local/LICENSE, vendor/siwc-local/THIRD_PARTY_NOTICES.md, and
vendor/siwc-PROVENANCE.md. The build copies the official license, notices, and
dependency inventory into the compiled SDK output. Preserve them and the root
license/scope notices when distributing source or compiled packages.
Other npm dependencies retain their own licenses. The root MIT license does not
supersede third-party licenses. OpenAI names/marks are subject to separate terms.
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution, component
scope, preserved upstream notices, and packaging requirements.

## Service terms and remaining decisions

Reviewed 2026-10-24 against the official SDK license and Sign in with ChatGPT
Terms dated September 29, 2026. Earlier local SDK packaging/build edits have been
removed. This edition compiles unmodified official SDK source using external
Inkwell tooling; it does not rely on permission to modify SIWC software. Section 4
of the service Terms still prohibits altering/amending SIWC and sublicensing
SIWC or underlying technology. SDK recipients receive rights directly from
contributors under its license; this patch does not purport to sublicense OpenAI
technology. The SDK license provides conditional noncommercial redistribution
rights, not blanket approval under all service terms. Any uncertainty about a
particular distribution or use requires clarification from OpenAI; no exception,
commercial permission, or legal clearance is inferred.

The SDK license does not grant service access or trademark rights. Applicable
service, eligibility, privacy, security, consent and branding obligations remain
separate from copyright licensing.

The upstream maintainer decides whether to accept this optional mixed-license
feature into their repository. That decision is not a licensing prerequisite for
an independently distributed edition. Commercial permission is needed if the planned
SDK use is commercial; no such purpose is inferred merely from public distribution.
Interpretation of service terms where a concrete use is uncertain may need external
clarification. Missing explicit OpenAI approval alone proves no violation. This document
is not a legal opinion. Do not describe this edition as wholly MIT
or commercially unrestricted. The Original edition has no bundled subscription SDK.

Official references:
https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE
https://openai.com/policies/sign-in-with-chatgpt-terms/
https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
