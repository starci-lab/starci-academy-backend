# Historical partial apply notes

## Authority limit

This is a sanitized historical observation from `apply-progress.md`, not proof of the current product, a completed implementation, or current UI approval. Runtime ports, process identifiers, session locks, unrelated dirty-tree notes, and local-only server state are intentionally omitted.

## Recorded as applied and browser-checked

- `apps/app/src/app/globals.css` imported the HeroUI stylesheet and added a `.dark` variant.
- `apps/app/src/app/providers.tsx` added a React Aria locale provider fixed to Vietnamese and a class-based theme provider. The note explicitly says no `NextIntlClientProvider` was added because the app had no approved catalogue shape.
- `apps/app/src/app/layout.tsx` wrapped the app providers and applied background/foreground semantic classes to the page body.
- The historical note recorded a non-transparent background, resolved ink/button/input styling, and a 384px sign-in column during one local browser inspection. No screenshot or durable browser capture accompanied the source directory, so these measurements are retained only as claims from that note.

## Explicit color limitation

Color remained undecided. The partial apply used HeroUI defaults and did not establish Nivo brand tokens. The decision prohibited copying the StarCi Academy palette as Nivo branding.

## Recorded stop and remaining work

- The sign-in panel still lacked its own visible card surface; the next proposed step was to project the shared `SurfaceFormCard` into the panel slot and verify a bounded, non-transparent rounded surface.
- Sidebar chrome and dashboard work were blocked because the confirmed write boundary excluded `packages/ui/src/contracts/index.ts`, which owned the approved `sidebar-then-body-app`, `titled-body`, and `sidebar-nav-cluster` contracts.
- The second-factor completion decision was not implemented in that run.
- The GraphQL client, three dashboard blocks, and the recorded state matrix remained untouched.

## Current interpretation

These notes establish only that a legacy apply was partial. They cannot complete any current Work node and do not replace or approve `design.login-form`.

