export const meta = {
  name: 'v2-fs-m16-interaction-a11y',
  description: 'V2 FS M16 Interaction & Accessibility (slot 15, Next.js, agnostic FE) — roots+bodies, submissions backfill (challenges already authored), finalize',
  phases: [
    { title: 'Bodies', detail: 'root + bodies/0-agnostic per lesson (Opus, Next.js)' },
    { title: 'Submissions', detail: 'backfill submissions/0 for existing 4-tier challenges (sonnet)' },
    { title: 'Finalize', detail: 'code-context.md + audited.md per lesson (sonnet)' },
  ],
}

const CONTENTS = '.mount/data/courses/0-fullstack-mastery/modules/15-interaction-and-accessibility/contents'
const REPO = '.repo/fullstack-mastery-module-16-interaction-and-accessibility'
const CANON = 'fullstack-mastery-module-16-interaction-and-accessibility'
const REF = '.mount/data/courses/0-fullstack-mastery/modules/13-frontend-performance/contents/0-code-splitting-and-dynamic-import'
const REF_BODY = `${REF}/bodies/0-agnostic`
const TODAY = '2026-06-05'

const SHARED = `
## FIXED RULES (V2, this module)
- Lang model: SINGLE-TRACK \`agnostic\`. Body dir = \`bodies/0-agnostic/\`. FE renderer hides language tabs. FE-only -> root \`# codeImplementations\` header STAYS but content EMPTY.
- STACK = Next.js 15 (App Router) + React 18 + TypeScript 5 + HeroUI v3 + Tailwind. This is a Next.js module (NOT the Vite sandbox), so root isSandbox = false. Match the ROOT METADATA FIELD SET of the reference ${REF}/en.md EXACTLY (same fields, same order); set isSandbox=false and isPremium per the lesson.
- The §2.1.5 test flows are browser / Playwright / keyboard / screen-reader / axe observations (focus order, aria attributes, keyboard interaction, reduced-motion) — NO HTTP status lines, NO curl. Frontend Next.js dev port 3001.
- description = PLAIN TEXT only (no markdown). Code comments inside fences = ENGLISH ONLY in BOTH vi.md and en.md.
- Step/requirement sub-blocks use \`:::muted\` callouts. Never \`### 1.\` numbered step headings. Do not force-translate technical terms (keep DndContext, useSortable, cmdk, focus trap, aria-modal, layoutId, prefers-reduced-motion...).
- Separators: exactly \`<!-- @starci/seperator -->\`; vi.md and en.md must have the SAME (even) separator count. Every code fence MUST have a language tag. Mermaid flowchart TD + italic caption; NO separator inside fences/mermaid.
- Repo references use CANONICAL name \`${CANON}\` (org StarCi-Academy); on-disk source is \`${REPO}\` (same name, no rename needed). Lesson folder = the slug; frontend in \`<slug>/frontend\`.
- \`# verified\` = ${TODAY}. Write files with the Write tool under ${CONTENTS}/<slug>/. Repo root = cwd.
`

const LESSONS = [
  {
    n: 0, slug: '0-drag-and-drop-with-dnd-kit', premium: false,
    topic: 'Accessible drag-and-drop with @dnd-kit: DndContext, sensors, useSortable, arrayMove, and full keyboard a11y.',
    contract: `Demo: a sortable list/board built with @dnd-kit/core + @dnd-kit/sortable. DndContext wraps the board; PointerSensor (activationConstraint distance 5px) + KeyboardSensor (sortableKeyboardCoordinates) drive interaction; useSortable provides attributes/listeners/transform; arrayMove reorders on dragEnd. Flows (Playwright/keyboard): (1) pointer drag reorders items; (2) keyboard: Tab to an item, Space to pick up (aria-pressed/announcements), Arrow keys to move, Space to drop; (3) ESC cancels a drag and restores position; (4) screen-reader announcements via the dnd-kit live region.`,
    deep: 'dnd-kit decouples the sensor (how an input starts/moves a drag) from the sortable strategy (how positions are computed) — the activation constraint prevents accidental drags, and the KeyboardSensor makes drag-and-drop fully operable without a mouse (WCAG), with a live region announcing state. The transform is applied via CSS, not by mutating the DOM order until dragEnd.',
    tiers: [
      '0-drag-and-drop-with-dnd-kit-easy', '1-drag-and-drop-with-dnd-kit-medium',
      '2-drag-and-drop-with-dnd-kit-hard', '3-drag-and-drop-with-dnd-kit-insane',
    ],
  },
  {
    n: 1, slug: '1-command-palette-with-cmdk', premium: false,
    topic: 'A command palette with cmdk: global Cmd/Ctrl+K, Command.Dialog primitives, fuzzy filter, and listbox ARIA.',
    contract: `Demo: a global command palette built on cmdk (Radix Dialog underneath). A window keydown listener opens it on Cmd/Ctrl+K; Command.Dialog/Input/List/Group/Item render the results; cmdk's built-in fuzzy filter ranks items as you type; selecting an item runs an action (router.push). Flows: (1) Cmd/Ctrl+K opens the palette and focuses the input; (2) typing fuzzy-filters and ranks items; (3) Arrow keys move aria-selected through role=option items; (4) Enter runs the command / navigates; ESC closes and restores focus.`,
    deep: 'cmdk implements the combobox/listbox ARIA pattern: the input owns focus while Arrow keys move a virtual cursor (aria-activedescendant / aria-selected) without moving DOM focus, so the screen reader announces the active option. The fuzzy filter is a ranking function over item values; the dialog traps focus and restores it on close.',
    tiers: [
      '0-command-palette-with-cmdk-easy', '1-command-palette-with-cmdk-medium',
      '2-command-palette-with-cmdk-hard', '3-command-palette-with-cmdk-insane',
    ],
  },
  {
    n: 2, slug: '2-focus-trap-and-a11y-patterns', premium: true,
    topic: 'Hand-built focus trap, skip links, ARIA landmarks, and axe-clean dialog patterns.',
    contract: `Demo: a modal dialog with a from-scratch useFocusTrap hook (no library) plus broader a11y patterns. The hook cycles Tab/Shift+Tab within the dialog, closes on ESC, and restores focus to the previously-focused element (saved activeElement) on close; a skip link (WCAG 2.4.1) jumps to main; ARIA landmarks (header/nav/main) structure the page; the dialog uses role=dialog + aria-modal + aria-labelledby. Flows (Playwright + axe-core): (1) opening the dialog moves focus in and Tab cannot escape it; (2) Shift+Tab from the first element wraps to the last; (3) ESC closes and focus returns to the trigger; (4) axe-core reports 0 violations.`,
    deep: 'A focus trap works by intercepting Tab at the boundaries: query the focusable elements, and on Tab from the last (or Shift+Tab from the first) move focus to the other end; aria-modal tells assistive tech the rest of the page is inert; restoring activeElement on close preserves the user\\u2019s place. This is the mechanism every modal library implements.',
    tiers: [
      '0-focus-trap-and-a11y-patterns-easy', '1-focus-trap-and-a11y-patterns-medium',
      '2-focus-trap-and-a11y-patterns-hard', '3-focus-trap-and-a11y-patterns-insane',
    ],
  },
  {
    n: 3, slug: '3-animation-with-framer-motion', premium: true,
    topic: 'Motion with framer-motion: shared-layout FLIP, AnimatePresence exit, and reduced-motion respect.',
    contract: `Demo: list/card animations with framer-motion. motion.div/button animate layout; a shared layoutId morphs an element between two positions (FLIP); AnimatePresence animates exit when items unmount; a usePrefersReducedMotion hook (matchMedia '(prefers-reduced-motion: reduce)') swaps to an opacity-only / instant fallback and sets data-reduced. Flows: (1) adding/removing list items animates enter/exit via AnimatePresence; (2) a shared layoutId morphs the selected card to a detail view (FLIP, not re-render jank); (3) layout shifts animate smoothly with the layout prop; (4) with prefers-reduced-motion the animations degrade to opacity/instant.`,
    deep: 'framer-motion uses the FLIP technique (First/Last/Invert/Play): it measures an element\\u2019s start and end box, applies an inverse transform, then animates the transform to zero on the GPU — so layout changes animate without animating expensive layout properties. layoutId links two elements as one continuous morph. Respecting prefers-reduced-motion is an accessibility requirement, not a nicety.',
    tiers: [
      '0-animation-with-framer-motion-easy', '1-animation-with-framer-motion-medium',
      '2-animation-with-framer-motion-hard', '3-animation-with-framer-motion-insane',
    ],
  },
]

phase('Bodies')

const results = await pipeline(
  LESSONS,
  (L) => agent(
    `Author ONE lesson of the StarCi Fullstack course (FS M16 Interaction & Accessibility) in V2 format. Write 4 files for lesson "${L.slug}".

STEP A — read the EXACT-format reference (a finished V2 Next.js agnostic lesson) and match its structure/numbering/separators/depth and its ROOT METADATA FIELD SET:
- ${REF}/vi.md and ${REF}/en.md (root metadata — copy the field set + order; this is a Next.js non-sandbox module)
- ${REF_BODY}/vi.md and ${REF_BODY}/en.md (body shape: "## 1. Lời mở đầu" -> "## 2. Các khái niệm cốt lõi" -> "### 2.1. Thực hành" (2.1.1 chuẩn bị source + Next.js dev, 2.1.2 kiến trúc + mermaid TD, 2.1.3 giải thích code with fenced React/TS snippets, 2.1.4 chạy, 2.1.5 Kiểm thử with "##### 2.1.5.N Luồng N" keyboard/aria/axe/Playwright observations, 2.1.6 dọn dẹp, 2.1.7 đọc thêm) -> "### 2.2. Lý thuyết" (2.2.1 Bản chất DEEP, 2.2.2 edge cases) -> "## 3. Tổng kết" (3.1 5 câu hỏi phỏng vấn)).

STEP B — read source to migrate:
- V1 lesson: ${CONTENTS}/${L.slug}/vi.md and en.md (existing root content)
- Repo code: ${REPO}/${L.slug}/frontend (components + hooks) and any ${REPO}/${L.slug}/.playwright scripts (the asserted flows).

LESSON FACTS:
- Topic: ${L.topic}
- Concrete contract (demo + §2.1.5 flows): ${L.contract}
- §2.2.1 "Bản chất" MUST teach the MECHANISM: ${L.deep}

${SHARED}

PREMIUM: isPremium = ${L.premium}.

STEP C — write 4 files (Write tool):
1. ${CONTENTS}/${L.slug}/vi.md (root: title, description PLAIN TEXT, EMPTY body/codeExplaining/codeImplementations headers, references 3-4 REAL docs links (dnd-kit / cmdk / WAI-ARIA APG / framer-motion / MDN prefers-reduced-motion as relevant), minutesRead ~18-22, isPremium ${L.premium}, isSandbox=false, verified ${TODAY} — MATCH the reference field set/order)
2. ${CONTENTS}/${L.slug}/en.md (English root mirror)
3. ${CONTENTS}/${L.slug}/bodies/0-agnostic/vi.md (# lang=agnostic + # body, full Vietnamese with diacritics; in 2.1.5 note Opus does not run E2E — flows verified by Playwright/chủ nhiệm)
4. ${CONTENTS}/${L.slug}/bodies/0-agnostic/en.md (English mirror, SAME separator count as vi.md)

Return ONLY: {"slug":"${L.slug}","files":<count>}.`,
    { label: `body:${L.slug}`, phase: 'Bodies', agentType: 'general-purpose' }
  ),
  (_b, L) => parallel(L.tiers.map((folder) => () => agent(
    `Backfill the submission files for an EXISTING FS M16 challenge (do NOT touch the challenge vi.md/en.md — only create the submissions). Lesson "${L.slug}", challenge folder "${folder}".

Write 2 files (Write tool):
1. ${CONTENTS}/${L.slug}/challenges/${folder}/submissions/0/en.md
# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
GitHub Repository Link
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
A public repository containing your solution to the "${folder}" challenge — with a README describing how to run it and evidence (screenshots or logs) for each requirement met.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

2. ${CONTENTS}/${L.slug}/challenges/${folder}/submissions/0/vi.md
# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Link Repository GitHub
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Một repo công khai chứa lời giải cho thử thách "${folder}", kèm README mô tả cách chạy và bằng chứng thật (ảnh màn hình hoặc log) cho từng yêu cầu đã đạt.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

Return ONLY: {"folder":"${folder}"}.`,
    { label: `sub:L${L.n}:${folder.slice(-12)}`, phase: 'Submissions', model: 'sonnet', agentType: 'general-purpose' }
  ).catch(() => null)))
)

phase('Finalize')
await parallel(LESSONS.map((L) => () => agent(
  `Write finalize files for FS M16 lesson "${L.slug}".
1. ${CONTENTS}/${L.slug}/code-context.md — canonical repo ${CANON} (org StarCi-Academy), lesson folder ${L.slug}/frontend; on-disk source ${REPO} (same name, no rename); stack Next.js 15 + React 18 + TypeScript 5 + HeroUI v3 + Tailwind, FE-only, dev port 3001, no backend/Docker, single-track agnostic, isSandbox=false. Read ${REPO}/${L.slug}/frontend to ground the file. Document the demo + the §2.1.5 keyboard/aria/axe/Playwright flows from: ${L.contract}. Reference format: ${REF}/code-context.md
2. ${CONTENTS}/${L.slug}/audited.md — V2 audit log: format (root + bodies/0-agnostic + 4-tier challenges already authored + submissions backfilled this pass), lang=agnostic, isSandbox=false, isPremium=${L.premium}, verified=${TODAY}, gate expect 0 blocking, E2E = "PENDING — chủ nhiệm/Gemini verify via Playwright (Opus does not run E2E)", list the 4 tiers: ${L.tiers.join(', ')}.
Use Write. Return ONLY: {"slug":"${L.slug}","done":true}.`,
  { label: `final:${L.slug}`, phase: 'Finalize', model: 'sonnet', agentType: 'general-purpose' }
)))

return { module: 'FS M16 interaction-and-accessibility', lessons: LESSONS.length }
