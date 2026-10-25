# 🖋️ Inkwell — Experimental ChatGPT Edition

> **Experimental ChatGPT integration patch by [ChillVibesCafe](https://github.com/ChillVibesCafe).**
> Original Inkwell by [Joshua Opel](https://github.com/joshuaopel), Bowler Hat Studio.
> This patch is not an official upstream release or an endorsement by Joshua Opel or OpenAI.

This is an independently maintained repository based on
[Joshua Opel's Inkwell](https://github.com/joshuaopel/inkwell), baseline commit
`09c297e121370c3f27ea7352cbc50919faa86655`. Original creator credit and the MIT
notice are preserved. Integration and independent changes are by ChillVibesCafe.

Inkwell's application code is licensed under the MIT License, including our
independently developed modifications. The optional Sign in with ChatGPT integration
includes components from OpenAI's Sign in with ChatGPT DevKit, distributed under the
**Sign-in with ChatGPT DevKit Noncommercial License, Version 1.0**. Those components
are subject to separate restrictions, including restrictions on commercial use.
See [LICENSE](LICENSE), [LICENSES.md](LICENSES.md), and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for scope, included notices, and
the separate SDK and service restrictions before redistribution.

## What's new in this edition

This edition adds **Sign in with ChatGPT** as an optional model provider alongside
Inkwell's existing Ollama, OpenAI-compatible API-key and Anthropic integrations.
The original writing workflow remains in place: planning, story bible, chapter
context, revisions, and exports all continue to use Inkwell's shared pipeline.

- **Sign in instead of supplying an API key:** connect an eligible ChatGPT account
  through the official Sign in with ChatGPT DevKit's OAuth/PKCE flow. This is a
  separate provider from the metered OpenAI API-key integration; signing in does
  not silently switch to API-key billing.
- **Explicit account selection:** manage saved ChatGPT accounts and choose which
  one supplies models and handles requests. Existing accounts can be selected or
  reconnected without the new-account licensing dialog.
- **Account-specific model choices:** available ChatGPT models and usage limits
  are determined by the selected account and service, not by a fixed list
  advertised by this repository.
- **Writing-context integration:** ChatGPT requests use the existing chapter,
  synopsis, running-summary and story-bible context assembly, rather than a
  standalone chat window disconnected from your book.
- **Optional automatic summaries:** an independent, off-by-default setting lets
  Inkwell update the running summary when you leave an edited chapter. These
  requests consume the chosen account's allowance. Manual summaries still work.
- **Safer local credential handling:** ChatGPT tokens are held in Windows
  CurrentUser DPAPI-protected storage, not returned to the browser as raw
  credentials. Sign-out removes local credentials and attempts remote revocation.
- **Consent before adding an account:** each Add account attempt displays the
  licensing acknowledgment with an initially unchecked checkbox. Cancelling
  starts no sign-in. The acknowledgment is session-memory-only; it is not
  transmitted to OpenAI.
- **Source and test transparency:** the official DevKit is vendored without source
  or configuration changes; separate local build scripts verify its provenance.
  Regression and browser harnesses exercise the integration with synthetic
  fixtures without accessing a saved real account.

**Important:** This is an experimental, unofficial integration, not an OpenAI
product. It does not grant ChatGPT plan eligibility, permission to use a plan in
this application, commercial-use rights to the DevKit, or any special entitlement.
It is also **not** a way to turn ChatGPT subscription usage into OpenAI API credit.
See [LICENSES.md](LICENSES.md), [SECURITY.md](SECURITY.md), and
[RELEASE.md](RELEASE.md) before enabling or redistributing it.

## Start on Windows

Install **Node.js 22.12 or newer**, extract or clone this repository, and
double-click **start-inkwell.bat**. Keep the terminal open. The launcher installs
or repairs this copy's dependencies, builds the app, and opens
**http://127.0.0.1:4323**. Ollama is optional when using ChatGPT or an API-key provider.

Alternatively, run `npm ci` followed by `npm start` from this directory, then open
**http://127.0.0.1:4321**. ChatGPT sign-in requires Windows secure storage and an
eligible account. In Settings, read the privacy notice, choose Add account, and
review the licensing acknowledgment. ChatGPT generation sends the selected story
context to OpenAI. Model availability and plan limits come from the selected account.

This is an experimental source release: live account eligibility and every
real-world workflow are not covered by the synthetic regression suite. See
[RELEASE.md](RELEASE.md) for verification, source packaging and limitations, and
[CHANGELOG.md](CHANGELOG.md) for the initial release scope.

Your own writing studio for novels, short stories and picture books. Local Ollama
models keep generation on your machine; optional cloud providers send the selected
story context to their configured service. Exports **KDP-ready EPUB** for Kindle.

Built by **[Joshua Opel](https://github.com/joshuaopel)** at **Bowler Hat Studio**, and
given away. Inkwell-authored code is MIT licensed; the optional bundled subscription
SDK has a separate noncommercial license (see LICENSES.md). The upstream
application does not require a paid Inkwell tier. Optional cloud services can
have their own charges, limits, account rules and licensing terms.

Built as a smarter, personal alternative to Sudowrite. The difference is the
**scaffolding around the model**:

- **Plan mode** — a real conversation. Inkwell asks **one question at a time**, each
  written from everything you've already told it, and suggests the next one so you can
  **Ask this** or **Skip**. The transcript is saved, so you can leave and resume.
  When you're ready it builds a four-act outline **and** a story bible from the transcript.
- **Outline map** — your book as a node graph. Chapters are cards coloured by act,
  wired in reading order, and **draggable** (positions persist to disk). Toggle to
  **List view** for summaries and beats, or **Auto-arrange** to reset the layout.
  A live stats bar tracks total words, acts, average chapter length and pacing.
- **Workspace shell** — icon rail for Home / Outline / Notes / Bible / Cards / Export,
  a book-and-chapter sidebar, and a context panel showing the interview, a **memory
  snapshot** (characters, locations, themes, timeline) and a story-bible peek.
- **Anti-amnesia context engine** — every generation is assembled from three layers:
  the whole-book synopsis + running summary, the current chapter's beats, and the
  immediate paragraphs. This reduces context loss but cannot guarantee continuity.
- **Story Bible** — characters, locations, themes, style. The single source of truth
  used as reference context to help the AI stay consistent.
- **Notes → revise → iterate** — select any passage, write real editorial notes on it
  ("cut the exposition, make her anger cold not loud, end on the door closing"), and get
  it rewritten. Not happy? Hit **More notes ↻** and give feedback on the revision itself —
  it keeps the original, its last attempt, and your new notes in view. Ten one-click
  preset notes (Tighten, Raise the tension, Deepen the POV…) for speed. Ctrl+Enter sends.
- **Edit-alongside, diff-first** — every rewrite shows as an inline word-level diff you
  accept/reject, like a code review for prose. You stay in control of your voice.
  Passages are replaced by exact offsets, and seams are cleaned automatically so a
  mid-sentence revision never leaves duplicated words or stray punctuation.
- **Refine the structure with notes** — critique the whole outline ("the middle act is
  rushed, split it"; "move the reveal earlier"; "aim for 18 chapters") and get a revised
  outline with a **before/after preview** (new / moved / kept chapters colour-coded).
  Or **Rebuild from interview** to fold newer answers into the whole plan. Both preserve
  any chapters you've already written.
- **Talk to it, out loud** — answer interview questions by speaking instead of typing, which
  is where thin answers come from. The transcript lands in the box as editable text, and gets
  checked against your story bible so *"Marin Veil in Sable Port"* becomes **Maren Vale in
  Sableport** — matched on sound, not spelling, with every correction shown and undoable.
  Inkwell also **reads your prose back to you**, tracking the selection as it goes, which is
  the fastest way to hear a clunky sentence. Both directions are on-device only: it uses your
  system's local voices, and it refuses to dictate at all rather than stream your voice to
  someone's server.
- **Pages — see the printed book** — every chapter laid out as real pages at a real
  trim size, paginated by the browser itself, so what you see is what prints. Choose the
  trim (5×8 up to 8.5×11), the margins, the typeface, the size and leading, justification,
  drop caps, chapter openers, running heads, page numbers, scene-break ornaments and the
  colour of the paper. Six named looks (Classic literary, Modern minimal, Dark academia,
  Pulp paperback, Illustrated, Submission manuscript) to start from, or ask your local
  model to **design the book for you** from its genre and tone. Facing-page spreads on a
  desktop, one page and a swipe on a phone, and **Print → PDF** at the exact trim size.
- **Art on the page, with the text wrapping around it** — drop an image onto the page,
  pin it to a paragraph, and choose how the prose flows around it: a box, a circle, an
  oval, or **the artwork's own outline**, traced from the transparent edges of a PNG so
  the text hugs the shape itself. Captions, frames, tilt, bleeds. Upload a font file and
  it's used on the page and embedded in the EPUB.
- **Picture books, not just novels** — pick the kind of book when you start one and the
  whole app changes shape. The unit becomes a **spread** (two facing pages, one picture, a
  line or two of text), the interview asks about the page turn and the refrain instead of
  the midpoint reversal, and the page starts square. The planner lays out all fourteen
  spreads in one pass — the words on each, plus a note on what the picture shows — and the
  writing prompt carries a real word budget (12 words for a board book, 45 for a picture
  book, 90 for an early reader) so the model can't bury it under a page of novel. The words
  and the pictures are explicitly told to carry different halves.
- **A locked visual bible** — one style line for the whole book, a fixed palette, and per
  character a physical description of the one unmistakable thing they always have. Every image
  prompt copies that description in verbatim and ends on the same style line — which is the
  only reason your protagonist doesn't change shape between pages.
- **Drawing built in — Inkwell installs the engine for you** — Settings › Illustration, turn it
  on, pick how good you want the pictures, press **Set it up for me**, watch a progress bar.
  No Python, no virtual environment, no CUDA toolkit, no second program to babysit: one native
  binary ([stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp)) and one model
  file, kept in an `engine/` folder beside your books and run by Inkwell itself. Three models to
  choose from, each showing **its download size and its licence before you commit** — Sketch
  (SD 1.5, 2.1 GB), Storybook (SDXL, 6.9 GB, the default) and Finest (FLUX.1-schnell, 10.3 GB,
  Apache 2.0). Downloads resume if interrupted, cancel if you change your mind, and **Remove and
  free the space** deletes the lot. The model stays loaded between pictures, so only the first
  drawing of a session waits for it.
- **…or keep the setup you already have** — same dropdown also takes **ComfyUI** (bring your own
  API-format workflow if you like), **AUTOMATIC1111 / SD.Next**, or **Ollama** (macOS only for
  image generation as of early 2026). Pictures are saved into the book's own folder as ordinary
  PNGs and flow into Pages, print and EPUB. And you can always draw them yourself and drop them
  in — the Art panel has taken your own files since day one.
- **Works from your phone** — icon rail becomes a tab bar, panels become drawers, the
  outline map takes touch. Run it on your desktop and open it from anywhere on your
  network **in the original upstream app only**. This edition disables unauthenticated
  LAN hosting and accepts loopback browser connections only (see [SECURITY.md](SECURITY.md)).
- **Everything is a file** — each book is a folder of Markdown + JSON on disk.
  Portable, backup-able, git-able.

## The guide

There's a full illustrated guide — how the interview works, how the memory engine keeps
your book straight, how to control the model's creativity, how to set up Ollama and pick
a model, and the original application's network features. This edition is
loopback-only; the original guide's phone/LAN instructions do not apply.

- **Online:** <https://joshuaopel.github.io/inkwell/>
- **Offline:** click the **?** in Inkwell's top bar (`http://localhost:4321/guide.html`)

It lives at [`index.html`](index.html) in the repo root — one file, which is both
the published site and the page the app serves.

It ships inside the app and uses no webfonts or CDNs, so like everything else here it
can be read with the network unplugged. ChatGPT generation and sign-in require
network access; selected context is sent to OpenAI.

## Screenshots

The outline as a draggable, act-coloured node map, with a live interview panel and memory snapshot:

Original Inkwell screenshots by Joshua Opel, shown from the credited upstream baseline:

![Outline map](https://raw.githubusercontent.com/joshuaopel/inkwell/09c297e121370c3f27ea7352cbc50919faa86655/promo/01-outline-map.png)

Give a passage editorial notes and get a diff you accept or reject — a code review for prose:

![Notes → revise](https://raw.githubusercontent.com/joshuaopel/inkwell/09c297e121370c3f27ea7352cbc50919faa86655/promo/05-write-notes.png)

Critique the whole structure and preview the revision before applying it:

![Refine structure](https://raw.githubusercontent.com/joshuaopel/inkwell/09c297e121370c3f27ea7352cbc50919faa86655/promo/refine-structure.png)

## Requirements

- [Node.js](https://nodejs.org) 22.12+
- For local generation: [Ollama](https://ollama.com) and a pulled model. Ollama is
  optional for ChatGPT and configured API-key providers.

Small models (like `qwen2.5:3b`) work for testing the flow, but for real prose pull
something bigger:

```bash
ollama pull gemma4:e4b     # ~10 GB, plans and writes well
ollama pull llama3.1:8b
ollama pull mistral-nemo
```

Model names move — `ollama.com/library` has the current releases, and `ollama list`
shows what you already have.

**For drawing picture books:** nothing extra to install. Inkwell downloads its own drawing
engine and model on request (Settings › Illustration) — budget 2–10 GB of disk depending on
which model you pick, and a graphics card if you want a picture in seconds rather than
minutes. Windows, Linux and Apple-silicon Macs are covered. If you already run
[ComfyUI](https://github.com/comfyanonymous/ComfyUI) or
[AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui), point Inkwell at
that instead.

## Run

```bash
npm install
npm start
```

Then open **http://localhost:4321**. Pick your model in the top-right, create a book,
and start in Plan mode.

## Validate the AI pipeline

Inkwell tests the request at the model boundary instead of judging only whether an
answer sounds plausible:

```bash
npm test
```

The suite checks prompt contracts directly and starts a protocol-compatible stand-in
Ollama server that captures Inkwell's real HTTP requests. It verifies that the full
interview transcript, breadth-first story dimensions, book tone, running summary,
chapter plan and local prose actually reach the model. It also tests the return path,
including one bounded repair when a model asks another question in the same dimension
while major dimensions remain open.

The deterministic suite tests wiring and contracts. Real-model scenario checks are a
separate quality layer: they ask whether the questions are insightful and the prose is
effective after the correct assignment has been delivered.

## Local HTTP access

Inkwell now binds to 127.0.0.1 by default and accepts localhost/loopback browser
requests only. State-changing cross-origin requests, foreign Host names, and
unauthenticated LAN hosting are rejected. Remote phone access is unavailable
until an authenticated LAN design is implemented. See SECURITY.md.

## Designing the page

The **Pages** tab in the rail shows your book as it will actually be printed, not as a
text box. Pagination is done by the browser's own layout engine at the real trim size, so
line breaks, justification, drop caps and text wrapping around art are the genuine
article — the same engine that draws the PDF.

- **Design panel** — trim size and margins (inner margin is the binding edge), typeface,
  size in points, leading, letter-spacing, justification and hyphenation, first-line
  indent, paragraph spacing, drop caps / raised caps / small caps, chapter-opener style
  and numbering (Chapter I / 1 / One), ornaments, running heads, page numbers, scene-break
  glyphs, paper tint, ink colour and texture. Every control previews live.
- **Let the model design it** — hands your genre, tone and themes to the same local model
  that writes your prose and gets back a full design plus a sentence on why. Its answer is
  validated against the catalogue, so a small model can't produce a broken page; anything
  it gets wrong falls back to the named look it was aiming at. Everything stays editable.
- **Art** — drag an image onto the page, or add it from the Art panel. Pick a side, a
  width, and how the text should wrap: box, circle, oval, or the artwork's own outline.
  Click any paragraph to move the picture there. Captions and frames optional.
- **Print / PDF** — prints at the chosen trim with the chosen type. Use your system print
  dialog's "Save as PDF". Running heads and folios are drawn by Inkwell on screen but left
  to the printer for PDFs, so a printed page won't show them.

Your design lives in `design.json` next to the book, and art in `assets/` — so a book
folder still holds everything.

## Where your work lives

```
Inkwell/books/<book-id>/
  book.json      title, author, premise, POV, tense
  bible.json     characters, locations, themes, tone, style, running summary
  outline.json   acts + chapter structure + map positions
  plan.json      the interview transcript (so Plan mode can resume)
  notes.md       freeform project notes
  design.json    trim size, margins, typography, page furniture
  art.json       where each picture sits in the prose
  assets/        the images and fonts you've uploaded
  chapters/*.md  your actual prose
```

Picture books use the same layout — a spread is stored as a chapter, so the folder is
identical and a book can be read either way. `book.json` gains `kind` and `ageBand`,
`bible.json` gains the visual style, palette and refrain, and each chapter gains what
its picture shows and the prompt last used to draw it.

Books created before the outline-map rewrite still open fine — they inherit the
default four acts and auto-arrange on first view.

Back this folder up and you've backed up everything. The one thing not worth backing up
is `engine/` — that's the downloaded drawing engine and its model, and Inkwell will
fetch them again on request. It's gitignored for the same reason.

## Cloud models (optional, and deliberately second)

Some machines genuinely can't run a model — a locked-down work laptop, an 8 GB
Chromebook, a tablet. For those, Settings → **Where the model runs** takes an API key
and adds those models to the picker under a **Cloud · billed per word** heading, so
it's always obvious which one costs money.

- **OpenAI-compatible** — OpenAI itself, or point the base URL at OpenRouter, Groq,
  Together, LM Studio, llama.cpp… anything speaking the same API.
- **Anthropic** — Claude models, direct.

Everything else is unchanged: same interview, same three-layer memory, same diff gate,
same EPUB. You can switch between a local and a cloud model mid-chapter.

Your key is written to `settings.json` on your machine (already git-ignored) and is
**never sent back to the browser** — the UI is only told whether one is set. Cloud
streaming is translated into the same wire format Ollama uses, so the rest of the app
can't tell the difference.

If you can run a model at home, run it at home. The cloud path re-introduces both
things this project exists to avoid: a meter, and your manuscript leaving your machine.

The provider layer lives in `lib/ollama.js` — adding another service means one more
entry with the same `{ listModels, chatOnce, chatStream, health }` shape.

## Settings

The gear icon opens a settings panel, saved to `settings.json` beside the `books/`
folder (not in browser storage, so it survives cache clears):

- **Model & generation** — default model, temperature, top-p, repeat penalty,
  context window, response length. These are passed straight to Ollama.
- **What the model is told** — how many words of surrounding prose to send, and
  whether to include the story bible and the running summary. Trim these if
  generations feel slow; everything here goes on *every* request. **Keep the summary
  current automatically** folds each chapter into the running "story so far" when you
  leave it, so the whole-book memory layer never goes stale (the Bible tab has a
  manual ↻ for catching up an older book).
- **Editor** — font size, line height, line width (in characters), spellcheck.
  Sliders preview live as you drag them.
- **Connection** — Ollama host, status, and a model refresh.

- **Voice** — which on-device voice reads to you, how fast, whether interview questions are
  read automatically, and whether dictation is corrected against the story bible. Dictation
  needs a browser that can transcribe on-device (Chrome or Edge today); reading aloud works
  everywhere. Inkwell will tell you which you've got.

- **Illustration** — for picture books. Off by default; nothing is downloaded and nothing
  tries to reach an image generator until you turn it on. The default engine is the one
  Inkwell installs itself — pick a model tier and press **Set it up for me**. Or switch the
  dropdown to ComfyUI, AUTOMATIC1111 / SD.Next or Ollama and give it an address, a checkpoint
  and optionally your own ComfyUI workflow in API format. Plus picture shape, detail (steps —
  leave it on *automatic* and the built-in engine uses what its model was built for), and a
  global "always avoid" list. **Test connection** says whether it answered.

Page design is per-book rather than global, and lives in the Pages tab.

## Config

Environment variables (all optional):

- `PORT` — web server port (default `4321`)
- `INKWELL_HOST` — loopback interface (default `127.0.0.1`); nonloopback addresses
  are rejected. This single-user runtime has no authenticated LAN mode.
- `OLLAMA_HOST` — Ollama URL (default `http://localhost:11434`)
- `INKWELL_BOOKS` — where books are stored (default `./books`)

## Repository layout and upstream relationship

This edition is an **independent repository based on** the original Inkwell,
not an official upstream release. The upstream project's authorship and MIT
notice are retained, while the independent modifications and the bundled SDK
are documented separately. Its repository need not be a GitHub-recognized fork
in order to attribute upstream or pull upstream changes through a Git remote.

The SDK's noncommercial license applies to the SDK, not automatically to every
line of Inkwell code or to ownership of manuscripts created with the app. The
in-app commercial-works acknowledgment is an extra user pledge, **not** an
assertion that OpenAI's SDK license by itself dictates the license or ownership
of generated writing. Review the actual license texts and terms for the
applicable restrictions; the README is not a substitute for them.

## Build and verification

Run `npm ci`, `npm run build`, `npm test`, then `npm start`. Tests use synthetic
data and mocked provider transport; they do not prove live provider entitlement.
Uploaded images must be supported raster formats; SVG/active documents are rejected.
Existing SVG assets cannot be served on the application origin.

## ChatGPT subscription (Windows)

Open **Settings → ChatGPT (Subscription)**, review the privacy notice, and use
**Add account / Continue with ChatGPT**. Each new-account attempt requires you to
review the licensing notice and actively check the agreement before authentication.
If you cancel or press Escape, authentication does not begin. An eligible plan and OpenAI permission for plan use are
required. The normal API-key provider remains separate. Model choices come from
the selected account; no hidden billing fallback is used.

Credentials are encrypted locally using Windows CurrentUser DPAPI. Other operating
systems fail closed for this provider; Ollama and API-key providers retain their
existing operation. Requires Node22.12+. The SDK uses OAuth+PKCE, rotating refresh
tokens, account-specific models and the public streaming Responses API. Context,
character memory and story bible still use Inkwell's shared prompt pipeline.

Automatic summaries require a separate opt-in, off by default, in Settings. They
consume subscription allowance when leaving an edited chapter; disable the opt-in
to stop these requests. Manual summaries remain available. Unsupported sampling
and output-token controls stay saved for other providers. Manage usage opens
ChatGPT settings; sign out clears local tokens and attempts remote revocation.

### ChatGPT setup and behaviour at a glance

1. Install or launch the app using the Windows instructions above.
2. In **Settings → ChatGPT (Subscription)**, review the privacy information and
   licensing acknowledgment, then choose **Add account**.
3. Leave the checkbox unchecked if you do not agree; **Cancel** or **Escape** stops
   the flow. To proceed, check the box and select **Agree & Continue**.
4. Complete sign-in and select the account and an available model. Your book's
   selected context is sent to OpenAI for generation when this provider is used.
5. To disable automatic summary requests, leave the **automatic summaries**
   opt-in off. You can still trigger summaries manually.

No ChatGPT sign-in is needed to use local Ollama or separately configured
API-key providers. On non-Windows systems, this provider is unavailable rather
than falling back to storing unencrypted ChatGPT tokens. If an account, model or
request is rejected by the service, check the account's eligibility and limits;
this project cannot override them. Rate limiting does not trigger automatic
account switching or an uncontrolled retry loop.

The local server is **loopback-only** by design. The official upstream guide's
instructions for opening Inkwell from a phone on your LAN do not apply to this
edition. Do not expose the local app to the internet as a workaround.

Read public/privacy.html and LICENSES.md before distributing this edition.
The bundled SDK is NOT MIT: commercial use needs a separate OpenAI agreement.
Upstream maintainers decide whether to accept this feature into their repository;
that decision is separate from distributing this independent edition under the applicable licenses.
The bundled SDK is now an unmodified copy of OpenAI's official package at commit
`0a36fefeb913055c8c7a1a29b63d82b96b2e841a`, including its package.json and
tsconfig.json. Inkwell's build wrapper and configuration live in `scripts/` and
`build/`; generated `vendor/siwc-local/dist` is disposable build output. The build
verifies the vendored source against official Git-blob SHA-256 hashes, then
compiles it and copies the official notices and dependency inventory into dist.
Run `npm run verify:sdk` separately to check integrity. See
[vendor/siwc-PROVENANCE.md](vendor/siwc-PROVENANCE.md) for provenance and comparison.
No SDK modification permission is relied upon. The noncommercial SDK license
and service Terms still apply. Missing explicit approval is not itself evidence
of a violation; this notice does not certify legal compliance.

Every Add account attempt displays a licensing acknowledgment before sign-in,
with links to the SDK license and service terms. Cancel starts no authentication;
Agree & Continue requires an unchecked-by-default checkbox. New connections via
Continue with ChatGPT use the same gate. Existing saved accounts can reconnect
and be selected normally. The acknowledgment is kept only in memory and is not
transmitted. The requested user pledge against commercial works is an application
acknowledgment, not a claim that the SDK license independently determines ownership
or licensing of generated works. Inkwell does not inspect manuscripts for commercial use.

For the reviewed source release, run `npm run release:source`; see [RELEASE.md](RELEASE.md).

Browser regression tests (development only): `npm run test:browser`.
Windows uses installed Microsoft Edge in headless mode. On other platforms,
install Playwright Chromium with npx playwright install chromium first.
The fixture uses a temporary books directory, blocks external transport and
never reads a saved account. To smoke-test the Original tree with this harness:
set INKWELL_UI_APP=../inkwell - New (PowerShell: $env:INKWELL_UI_APP='../inkwell - New')
and run npm run test:browser from this directory. Only shared workspace tests run
for Original; subscription/textarea cases are intentionally not applicable.
