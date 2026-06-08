export const meta = {
  name: 'fe-semantic-pass',
  description: 'Apply HeroUI semantic/visual convention rules to FE modules, run playwright, screenshot',
  phases: [
    { title: 'Wave1' },
    { title: 'Wave2' },
  ],
}

// repo module dir, mount-agnostic FE modules only (M9/M12 handled separately).
// band = base FE port; BE port = band+5. Each lesson uses band + lessonIndex.
const MODULES = [
  { m: 5, dir: 'fullstack-mastery-module-5-server-state-with-tanstack-query', band: 3900, backend: true,  next: false },
  { m: 6, dir: 'fullstack-mastery-module-6-form-mastery-rhf-zod',            band: 3910, backend: true,  next: false },
  { m: 7, dir: 'fullstack-mastery-module-7-client-state-zustand-jotai',      band: 3920, backend: false, next: false },
  { m: 8, dir: 'fullstack-mastery-module-8-react-reactivity-and-effects',    band: 3930, backend: false, next: false },
  { m: 13, dir: 'fullstack-mastery-module-13-server-components-suspense-streaming', band: 3940, backend: false, next: true },
  { m: 14, dir: 'fullstack-mastery-module-14-frontend-performance',         band: 3950, backend: false, next: false },
  { m: 15, dir: 'fullstack-mastery-module-15-responsive-and-adaptive-rendering', band: 3960, backend: false, next: false },
  { m: 16, dir: 'fullstack-mastery-module-16-interaction-and-accessibility', band: 3970, backend: false, next: false },
]

const RULES = `
STANDARD FE CONVENTION RULES (HeroUI v3 + Tailwind v4 + Vite). Apply to every .tsx under frontend/src:

VISUAL / SEMANTIC (this pass):
1. CARD: every root <Card ...> gets a visible border + compact padding: add classes "border border-default-200 p-3" (merge into existing className; do NOT add to Card.Content/Card.Header/Card.Footer, only the root <Card). Do not double-pad: if Card.Content already has p-*, leave it.
2. INPUT: a standalone <Input> (NOT inside a <Card>) must look bordered (default/bordered variant). An <Input> INSIDE a <Card> uses variant="secondary".
3. BUTTON: primary call-to-action = variant="primary"; secondary/neutral = variant="outline"; destructive = variant="danger". No color= prop.
4. TITLE: the lesson title heading = <Typography.Heading level={4} className="text-sm font-semibold"> (keep the heading element for a11y; just size it via className). Replace any weight="semibold" on the title with the className. Section sub-headings keep their own Typography.Heading level.
5. PURE HEROUI: block-level text must use HeroUI components, not raw tags. <p> -> <Typography.Paragraph size="sm" color="muted">; raw <h1..h3> -> <Typography.Heading level={N}>; field labels -> HeroUI <Label>. KEEP <span> when it is inline text/icon wrapper (those are fine).
6. SPACING (gap, not spacer divs): remove empty spacer <div className="h-3"/> / <div className="h-6"/>. Express spacing with flex gap on the container: blocks that are RELATED/close = gap-3; blocks that are FAR/unrelated = gap-6. Group the title+description in one <div className="flex flex-col gap-3"> and separate that group from the content with gap-6 on the outer container.
7. LABEL <-> INPUT gap = gap-1.5 (wrap the field in flex flex-col gap-1.5; do NOT use padding p-1.5).
8. CONTAINER: keep "mx-auto max-w-2xl"; ensure responsive — replace any fixed pixel widths (style width:NNN / w-[NNNpx]) on layout boxes with responsive classes (w-full max-w-*). Modals/dialogs: use max-w-* not fixed left/top px.

HARD CONSTRAINTS:
- Do NOT edit any playwright spec or playwright.config (you may only edit code under frontend/src and frontend/index.html/globals.css if needed).
- Preserve every data-testid exactly (tests depend on them).
- Keep comments English-only.
- Components are already arrow functions with interface props (do not revert).
`

async function processModule(mod, phase) {
  const lessonsHint = `Repo dir: .repo/${mod.dir}. Lessons are the numbered subfolders (0-*, 1-*, ...). Each lesson has frontend/ (Vite${mod.next ? ' — but THIS module is Next.js' : ''})${mod.backend ? ' and backend/ (NestJS, in-memory)' : ''} and a playwright config (find playwright.config.ts under the lesson).`
  const portHint = mod.backend
    ? `For lesson index i (0-based): FE_PORT=${mod.band}+i, BE_PORT=${mod.band + 5}+i. Kill any process on those ports first (netstat -ano | grep ":<port> " ... taskkill //PID <pid> //F). Run playwright from the playwright.config dir with: BE_PORT=<be> FE_PORT=<fe> npx playwright test --project=chromium --reporter=line (if project chromium not found, run without --project).`
    : `For lesson index i (0-based): FE_PORT=${mod.band}+i. Kill any process on that port first. Run playwright from the playwright.config dir with: FE_PORT=<fe> npx playwright test --reporter=line (use --project=chromium if it exists).`
  const snap = '/c/Repositories/ac/starci-academy-backend/scratch/codemod/snap.mjs'
  const modSlug = mod.dir.replace('fullstack-mastery-module-', '') // e.g. 5-server-state-...
  const shotsBase = `/c/Repositories/ac/starci-academy-backend/scratch/shots/${modSlug}`

  const prompt = `You are standardizing the frontend of ONE module to the StarCi HeroUI convention, then validating with Playwright and capturing a screenshot. Work entirely under C:/Repositories/ac/starci-academy-backend.

${lessonsHint}

${RULES}

STEPS for EACH lesson in the module (do them one lesson at a time, sequentially):
1. Read the lesson's frontend/src files and APPLY the visual/semantic rules above. Edit only what a rule requires; keep diffs minimal and correct.
2. Typecheck: (cd <lesson>/frontend && npx tsc --noEmit). Fix any error you introduced.
3. Run Playwright. ${portHint} If a flow FAILS, diagnose and fix the CODE (never the spec) until it passes or you are confident it is a pre-existing/environment issue (note it).
4. Screenshot ALL views/routes/tabs of the lesson (not just one):
   a. Discover the routes: grep the lesson's playwright scripts for every distinct path passed to page.goto(...) (e.g. "/", "/users?mode=naive", "/csv", "/dashboard"). Always also include "/" and "/?sandbox=1". Dedupe.
   b. Start the FE dev server in background on its FE_PORT (${mod.next ? 'npx next dev -p <fe> in frontend/' : 'FE_PORT=<fe> npx vite --port <fe> in frontend/'})${mod.backend ? ' AND the backend on its BE_PORT (needed so data renders)' : ''}. Wait ~4s until ready.
   c. mkdir -p "${shotsBase}/<lessonSlug>" then for EACH distinct route snap it:
      node ${snap} "http://localhost:<fe><route>" "${shotsBase}/<lessonSlug>/page-<routeSlug>.png"
      where routeSlug = "local" for "/", "sandbox" for "/?sandbox=1", else the path/query slugified (strip leading /, non-alphanumeric -> "-"). For routes that need interaction to reveal a panel, snap the base state is fine.
   d. Kill the dev server${mod.backend ? ' and backend' : ''}.
5. Record the result for this lesson (screenshot = the lesson folder "${shotsBase}/<lessonSlug>").

Return a structured summary of every lesson: playwright pass/fail with flow counts, screenshot path, files edited count, and any notes. Be precise and truthful — do not claim pass if you did not see "N passed".`

  return agent(prompt, {
    label: `M${mod.m}-semantic`,
    phase,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        module: { type: 'string' },
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              lesson: { type: 'string' },
              playwright: { type: 'string', enum: ['pass', 'fail', 'skip'] },
              flowsPassed: { type: 'number' },
              flowsFailed: { type: 'number' },
              screenshot: { type: 'string' },
              filesEdited: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['lesson', 'playwright', 'flowsPassed', 'flowsFailed', 'screenshot', 'filesEdited', 'notes'],
          },
        },
      },
      required: ['module', 'lessons'],
    },
  })
}

// Wave 1: M5,M6,M7,M8 ; Wave 2: M13,M14,M15,M16 (RAM-safe, 4 concurrent each)
const wave1 = MODULES.slice(0, 4)
const wave2 = MODULES.slice(4)

log(`Wave 1: ${wave1.map((x) => 'M' + x.m).join(', ')}`)
const r1 = await parallel(wave1.map((mod) => () => processModule(mod, 'Wave1')))
log(`Wave 2: ${wave2.map((x) => 'M' + x.m).join(', ')}`)
const r2 = await parallel(wave2.map((mod) => () => processModule(mod, 'Wave2')))

const all = [...r1, ...r2].filter(Boolean)
return all
