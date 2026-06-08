export const meta = {
  name: 'fe-m9-m12-pass',
  description: 'Semantic pass + TS playwright + multi-lang/sandbox screenshots for M9 (websocket) and M12 (file-upload)',
  phases: [
    { title: 'M9-websocket' },
    { title: 'M12-fileupload' },
  ],
}

const RULES = `
STANDARD FE CONVENTION RULES (HeroUI v3). Apply to every .tsx under frontend/src:
1. CARD: root <Card> gets "border border-default-200 p-3" (merge className; only the root, not Card.Content/Header/Footer; don't double-pad).
2. INPUT: standalone bordered; INSIDE a Card variant="secondary".
3. BUTTON: primary CTA variant="primary"; secondary variant="outline"; destructive variant="danger". No color= prop.
4. TITLE: lesson title = <Typography.Heading level={4} className="text-sm font-semibold"> (keep heading element; size via className). Section sub-headings keep their level.
5. PURE HEROUI: block text -> Typography.Paragraph / Typography.Heading / Description; field labels -> <Label>. KEEP inline <span> for icons/inline highlights.
6. SPACING: remove empty spacer <div className="h-3|h-6"/>; use flex gap on container — related=gap-3, far/unrelated=gap-6; group title+desc in gap-3, separate from content by gap-6.
7. LABEL<->INPUT gap = gap-1.5 (flex flex-col gap-1.5, not padding).
8. CONTAINER mx-auto max-w-2xl; replace fixed px widths with responsive (w-full max-w-*).
HARD CONSTRAINTS: never edit playwright specs/config; preserve every data-testid; English-only comments; components stay arrow + interface props.
`

const snap = '/c/Repositories/ac/starci-academy-backend/scratch/codemod/snap.mjs'
const shotsRoot = '/c/Repositories/ac/starci-academy-backend/scratch/shots'

function moduleAgent(mod) {
  const shotsBase = `${shotsRoot}/${mod.slug}`
  const langNote = mod.hasLangTabs
    ? `This module has language tabs via ?lang= (typescript|java|csharp|go) and a Sandbox via ?sandbox=1. The shared FE renders the per-lang connect pane; the TypeScript backend is the one Playwright/webServer starts.`
    : `This module's lessons use a single FE; some have multiple routes (discover via goto() in specs).`

  const prompt = `Finalize the frontend of module ${mod.slug} (repo dir .repo/${mod.dir}) to the StarCi HeroUI convention, validate the TypeScript stack with Playwright, and capture screenshots of every view. Work under C:/Repositories/ac/starci-academy-backend.

${langNote}

${RULES}

For EACH lesson (numbered subfolders), sequentially:
1. Apply the visual/semantic rules to <lesson>/frontend/src. Minimal correct diffs. (cd <lesson>/frontend && npx tsc --noEmit) must stay clean.
2. Playwright (TypeScript stack): find the playwright.config under the lesson; run it. It auto-starts docker postgres + the TS backend + the FE. Use env BE_PORT/FE_PORT if the config reads them (pick free high ports, kill stale first); otherwise run as-is. Command: BE_PORT=<be> FE_PORT=<fe> npx playwright test --project=chromium --reporter=line (drop --project if not found). If a flow fails, fix the CODE (never the spec). Record "N passed".
3. Screenshots — start the FE dev server (FE_PORT=<fe> npx vite --port <fe> in frontend/, background) AND the TS backend if the page needs it (the lesson's backend/0-typescript: cd there, PORT=<be> npm run start:dev, background; also start docker pg if the lesson needs it: docker compose -f <lesson>/.docker/compose.yaml up -d). Wait until ready. Then mkdir -p "${shotsBase}/<lessonSlug>" and snap:
   - node ${snap} "http://localhost:<fe>/" "${shotsBase}/<lessonSlug>/page-local.png"
   - node ${snap} "http://localhost:<fe>/?sandbox=1" "${shotsBase}/<lessonSlug>/page-sandbox.png"
${mod.hasLangTabs ? `   - for each lang in typescript,java,csharp,go: node ${snap} "http://localhost:<fe>/?lang=<lang>" "${shotsBase}/<lessonSlug>/page-lang-<lang>.png"  (the TS pane will be connected; non-TS panes will show their UI in a connecting/disconnected state since only the TS backend is running — that is expected and fine for a UI screenshot).` : `   - plus any extra route found in the specs (goto paths) as page-<routeSlug>.png`}
   Then kill the dev server, backend, and (docker compose down) if you started them.
4. Record the lesson result.

Return a structured summary per lesson: playwright pass/fail + flow counts, screenshots captured (list filenames), files edited, notes (truthful — only say pass if you saw "N passed").`

  return agent(prompt, {
    label: mod.slug,
    phase: mod.phase,
    schema: {
      type: 'object', additionalProperties: false,
      properties: {
        module: { type: 'string' },
        lessons: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            properties: {
              lesson: { type: 'string' },
              playwright: { type: 'string', enum: ['pass', 'fail', 'skip'] },
              flowsPassed: { type: 'number' },
              flowsFailed: { type: 'number' },
              screenshots: { type: 'array', items: { type: 'string' } },
              filesEdited: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['lesson', 'playwright', 'flowsPassed', 'flowsFailed', 'screenshots', 'filesEdited', 'notes'],
          },
        },
      },
      required: ['module', 'lessons'],
    },
  })
}

// Sequential: M9 then M12 (both need postgres on host port 5432 -> cannot overlap).
phase('M9-websocket')
const r9 = await moduleAgent({
  slug: '9-websocket-realtime-communication',
  dir: 'fullstack-mastery-module-9-websocket-realtime-communication',
  hasLangTabs: true, phase: 'M9-websocket',
})
phase('M12-fileupload')
const r12 = await moduleAgent({
  slug: '12-file-upload-and-storage',
  dir: 'fullstack-mastery-module-12-file-upload-and-storage',
  hasLangTabs: false, phase: 'M12-fileupload',
})

return [r9, r12].filter(Boolean)
