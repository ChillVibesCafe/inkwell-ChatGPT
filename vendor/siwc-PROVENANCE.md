# Official SDK provenance

Experimental ChatGPT integration patch by ChillVibesCafe for Inkwell, originally
created by Joshua Opel (Bowler Hat Studio). This record is maintained by Inkwell
outside the SDK and is not an official OpenAI document.

Repository: https://github.com/openai/sign-in-with-chatgpt-devkit
Pinned commit: 0a36fefeb913055c8c7a1a29b63d82b96b2e841a
Upstream main verified at this commit on 2026-10-24.

## Unmodified inputs

Every tracked file under upstream packages/local is copied byte-for-byte into
siwc-local, including package.json, tsconfig.json, LICENSE, source, and tests.
The previous local package/config edits have been removed. Previously checked-out
Windows CRLF files were restored to exact official Git-blob bytes. The official
repository root THIRD_PARTY_NOTICES.md is additionally copied verbatim beside
the SDK LICENSE; siwc-dependency-inventory.json is the verbatim official
docs/dependency-inventory.json. The verbatim official tsconfig.base.json is in
../build/siwc/tsconfig.base.json. These upstream materials retain their licenses.

siwc-upstream.json records the source path and SHA-256 of every copied upstream
file. npm run verify:sdk verifies all hashes and rejects additional SDK source
files. Generated dist is excluded from the source comparison, as it is upstream.
The build verifies the inputs before compiling. Preserve exact bytes on checkout;
root .gitattributes prevents automatic line-ending changes for these files.

## External build integration

../build/tsconfig.siwc.json and ../scripts/build-siwc.mjs are independently
authored Inkwell build tooling outside the SDK. The config uses the official
shared compiler options and the package's original declaration/source-map settings,
with paths resolved from Inkwell. The wrapper compiles unmodified source into the
SDK's expected dist location, keeping package exports and official tests intact.
It copies the official LICENSE, THIRD_PARTY_NOTICES.md and dependency inventory
into dist, matching upstream's notice-copying behavior without editing its scripts.
No generated files replace or patch SDK source. The original monorepo-relative
package scripts/config are preserved; use Inkwell's root npm run build rather
than invoking them directly in this extracted package.

## License and notices

The SDK remains under OpenAI's Sign-in with ChatGPT DevKit Noncommercial License,
Version 1.0, not MIT. Preserve all upstream license and third-party notices in
source and compiled distributions. The upstream notices cover the wider DevKit
examples; their presence does not imply those examples/assets are shipped here.
The official dependency inventory describes the DevKit; Inkwell's actual resolved
dependencies are recorded separately in ../package-lock.json. Retain applicable
installed dependency licenses and notices in packaged distributions.

The application and independently authored adapter/build tooling remain MIT.
No SDK modification permission is relied upon. This does not grant commercial
SDK use, service access, trademark rights, or distribution approval. Read
../LICENSES.md and ../THIRD_PARTY_NOTICES.md for remaining obligations.
