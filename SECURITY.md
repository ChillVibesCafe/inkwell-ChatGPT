# Local security model

This is a single-user desktop runtime, not a multi-user hosted service. It binds
to loopback by default. Nonloopback INKWELL_HOST values fail at startup; no
unauthenticated LAN mode is provided. Use http://127.0.0.1:4321 or the configured
port. Localhost and IPv6 loopback are also supported when selected explicitly.

All API routes validate the peer, Host and browser Origin and reject cross-site
fetches and form MIME types. A trusted local CLI can call the API without Origin.
CORS is not an authentication mechanism; hostile native processes on this same
OS session are outside this boundary. Do not run the app on a shared/untrusted
OS account or publish it through an untrusted reverse proxy.

Book/chapter/asset identifiers are validated. Resolved paths must remain within
the books root. Descendant symlinks/junctions and unsafe asset manifests are
rejected; a deliberately configured books-root junction is supported. Checks do
not claim atomic protection against a malicious local process racing filesystem
replacements. Back up manuscripts before changing storage configuration.

Uploaded image/font MIME and signatures are checked. Active documents/SVG are
rejected, including legacy assets. Raw asset responses use nosniff and sandbox
CSP. Supported raster images and font files continue to work. JSON bodies are
bounded to10MB, uploads to30MB, compressed JSON is disabled; header/body timeouts
and provider deadlines bound stalled work.

Never commit personal settings, books, credentials, engine binaries or runtime
logs. Report security issues privately to this independent repository's maintainer,
ChillVibesCafe, using the contact route on their GitHub profile. Do not put tokens,
account identities or private manuscripts in a public issue. If an issue affects
upstream Inkwell or the SDK, coordinate disclosure with those maintainers too.
Test with temporary synthetic data only.
