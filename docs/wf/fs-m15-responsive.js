export const meta = {
  name: 'v2-fs-m15-responsive-adaptive',
  description: 'Author FS M15 Responsive & Adaptive Rendering (slot 14, Vite sandbox, agnostic FE) — roots+bodies, fresh 4-tier challenges+submissions, finalize',
  phases: [
    { title: 'Bodies', detail: 'root + bodies/0-agnostic per lesson (Opus, Vite)' },
    { title: 'Challenges', detail: '4 tiers x 4 lessons + submissions (fresh authoring)' },
    { title: 'Finalize', detail: 'code-context.md + audited.md per lesson (sonnet)' },
  ],
}

const CONTENTS = '.mount/data/courses/0-fullstack-mastery/modules/14-responsive-and-adaptive-rendering/contents'
const CANON = 'fullstack-mastery-module-15-responsive-and-adaptive-rendering'
const MODSLUG = '14-responsive-and-adaptive-rendering'
const REF = '.mount/data/courses/0-fullstack-mastery/modules/4-server-state-with-tanstack-query/contents/0-usequery-and-cache-lifecycle'
const REF_BODY = `${REF}/bodies/0-agnostic`
const REF_CH = `${REF}/challenges/0-usequery-and-cache-lifecycle-easy`
const TODAY = '2026-06-05'

const SHARED = `
## FIXED RULES (V2, this module)
- Lang model: SINGLE-TRACK \`agnostic\`. Body dir = \`bodies/0-agnostic/\`. FE renderer hides language tabs. FE-only -> root \`# codeImplementations\` header STAYS but content EMPTY (no Java/C#/Go).
- STACK = Vite + React 18 + TypeScript 5 (NOT Next.js). Frontend dev server: \`npm run dev\` on Vite port 3001. A tiny NestJS mock backend (port 3000) serves product/image metadata at /api/products (multi-resolution image URLs); the frontend reads VITE_API_BASE (default http://localhost:3000). The MECHANISM under study is the FRONTEND (browser platform APIs) — the backend is a trivial static mock. Do NOT use next/image, next/dynamic, next-themes or any Next-only API; use native browser platform features (CSS @container, srcset/sizes, <picture>, IntersectionObserver, navigator.connection, fetchpriority).
- isSandbox = true. The §2.1.5 test flows are browser/DevTools/Playwright observations (Network panel candidate selection, CLS via PerformanceObserver, container-resize reflow). They MAY have HTTP 200 for the mock /api/products fetch but the focus is rendering behavior.
- description = PLAIN TEXT only (no markdown bold/backtick/link).
- Code comments inside fences = ENGLISH ONLY in BOTH vi.md and en.md.
- Step/requirement sub-blocks use \`:::muted\` callouts. Never \`### 1.\` numbered step headings.
- Do not force-translate technical terms (keep container query, srcset, sizes, LQIP, CLS, LCP, IntersectionObserver, deviceMemory...).
- Separators: exactly \`<!-- @starci/seperator -->\`; vi.md and en.md must have the SAME (even) separator count. Every code fence MUST have a language tag (no bare fence). Mermaid flowchart TD with italic caption; NO separator inside fences/mermaid.
- Repo references use CANONICAL name \`${CANON}\` (org StarCi-Academy). The source repo does NOT exist yet (new topic) — the maintainer builds it from code-context.md; reference the canonical URL and folder \`<slug>/frontend\` regardless.
- \`# verified\` = ${TODAY}.
- Write files with the Write tool under ${CONTENTS}/<slug>/. Repo root = cwd.

## SANDBOX ROOT METADATA (append to BOTH root vi.md and en.md, after isPremium, before verified — match ${REF}/en.md field order: isPremium -> isSandbox -> githubBaseUrl -> githubDir -> backendUrl -> verified):
# isSandbox
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
# githubBaseUrl
<!-- @starci/seperator -->
https://github.com/StarCi-Academy/${CANON}
<!-- @starci/seperator -->
# githubDir
<!-- @starci/seperator -->
<SLUG>/frontend
<!-- @starci/seperator -->
# backendUrl
<!-- @starci/seperator -->
/mocks/${MODSLUG}/<SLUG>
<!-- @starci/seperator -->
(replace <SLUG> with the actual lesson slug)
`

const LESSONS = [
  {
    n: 0, slug: '0-responsive-layout-without-media-query-soup', premium: false,
    topic: 'Container queries, intrinsic sizing, fluid type with clamp(), and CSS Grid auto-fit/minmax for components that respond to their CONTAINER, not the viewport.',
    contract: `Demo: a product grid where each card responds to its OWN container width via CSS @container queries (not viewport @media). The SAME ProductCard component renders a compact layout inside a narrow sidebar and a rich layout inside the wide main column AT THE SAME viewport width. Grid uses repeat(auto-fit, minmax(220px, 1fr)); type scales with clamp(). Flows (browser/Playwright): (1) shrink the container -> cards switch layout at CONTAINER breakpoints while viewport is unchanged; (2) place the same card in sidebar vs main -> different layouts simultaneously; (3) clamp() font scales smoothly between min and max; (4) no horizontal scrollbar at any width 320px..1920px.`,
    deep: 'Container queries decouple a component from the viewport: a component becomes responsive to the size of its own container (container-type: inline-size), so one component is truly reusable in any slot — the death of media-query-soup. Intrinsic sizing (min-content/max-content/fit-content) plus auto-fit/minmax let the browser compute the column count instead of hardcoded breakpoints.',
    tiers: [
      { idx:0, folder:'0-responsive-product-card-grid-easy', difficulty:'easy', purpose:'A product card grid using auto-fit/minmax that reflows without any @media query.' },
      { idx:1, folder:'1-container-query-component-library-medium', difficulty:'medium', purpose:'A small component that adapts via @container so it works in sidebar and main without prop changes.' },
      { idx:2, folder:'2-nested-container-contexts-hard', difficulty:'hard', purpose:'Nested container contexts (card inside panel inside layout) each with their own container query scope.' },
      { idx:3, folder:'3-fully-fluid-dashboard-zero-media-queries-insane', difficulty:'insane', purpose:'A full dashboard that is fully responsive 320..1920px using ZERO @media queries (only container queries + intrinsic sizing + clamp).' },
    ],
  },
  {
    n: 1, slug: '1-responsive-images-with-srcset-and-picture', premium: false,
    topic: 'Native responsive images: srcset/sizes resolution switching, <picture> art direction and format negotiation, DPR, loading=lazy, decoding=async.',
    contract: `Demo: a product gallery using native <img srcset sizes> for resolution switching and <picture> for art direction + format. The browser (not JS) picks the candidate from srcset using sizes + viewport + DPR. Flows (DevTools Network / Playwright): (1) at a given viewport+DPR the browser downloads exactly the candidate matching sizes (e.g. 1x vs 2x); (2) changing sizes changes the chosen candidate; (3) <picture> serves AVIF when supported, else WebP, else JPG (type fallback); (4) art-directed <source media> swaps to a square crop below a breakpoint. loading="lazy" + decoding="async" on below-fold images.`,
    deep: 'The browser selects the optimal source from srcset BEFORE layout using the sizes hint (display width), the viewport, and DPR — sizes is what lets it choose pre-layout. Division of labor: srcset/sizes = RESOLUTION switching chosen by the BROWSER; <picture><source> = ART DIRECTION and FORMAT chosen by the DEVELOPER. This is why next/image is unnecessary — the platform already does it.',
    tiers: [
      { idx:0, folder:'0-responsive-hero-image-easy', difficulty:'easy', purpose:'A hero image with srcset/sizes so the browser downloads the right resolution per device.' },
      { idx:1, folder:'1-art-directed-picture-medium', difficulty:'medium', purpose:'A <picture> with art-directed crops (wide on desktop, square on mobile) via <source media>.' },
      { idx:2, folder:'2-format-negotiation-avif-webp-hard', difficulty:'hard', purpose:'Format negotiation: AVIF -> WebP -> JPG fallback via <source type>, measured in the Network panel.' },
      { idx:3, folder:'3-responsive-image-pipeline-insane', difficulty:'insane', purpose:'A build-time responsive image pipeline (generate a srcset ladder) wired into the gallery with correct sizes for every layout slot.' },
    ],
  },
  {
    n: 2, slug: '2-zero-cls-image-loading-with-lqip', premium: true,
    topic: 'Zero-CLS image loading: aspect-ratio/width-height space reservation, LQIP blur-up, a from-scratch IntersectionObserver lazy loader, fetchpriority and preload for the LCP image.',
    contract: `Demo: an image-heavy product listing engineered for CLS=0 and a fast LCP. Every image reserves its box via width/height attributes (or aspect-ratio) BEFORE bytes arrive; a tiny base64 LQIP placeholder is blurred then swapped for the sharp image on load; a hand-written IntersectionObserver (NO library) lazy-loads below-fold images via rootMargin; the LCP hero uses fetchpriority="high" and <link rel="preload">. Flows (PerformanceObserver / Lighthouse / Playwright): (1) CLS stays 0 throughout image load (measured); (2) blurred LQIP visible then crossfades to sharp; (3) off-screen images only fetch when scrolled within rootMargin; (4) the preloaded fetchpriority=high hero loads measurably earlier (LCP improves).`,
    deep: 'Layout shift happens because the browser does not know an image\\u2019s dimensions until bytes arrive; supplying width/height (or aspect-ratio) lets it reserve the box pre-load, so CLS=0. IntersectionObserver defers off-screen work to the main-thread-friendly callback. fetchpriority and preload re-order the browser\\u2019s image priority queue so the LCP image jumps ahead of default-low-priority images.',
    tiers: [
      { idx:0, folder:'0-aspect-ratio-no-shift-easy', difficulty:'easy', purpose:'Reserve image space with width/height or aspect-ratio so a slow-loading grid produces CLS=0.' },
      { idx:1, folder:'1-blur-up-lqip-medium', difficulty:'medium', purpose:'LQIP blur-up: tiny base64 placeholder blurred then crossfaded to the full image on load.' },
      { idx:2, folder:'2-from-scratch-lazy-loader-hard', difficulty:'hard', purpose:'A reusable lazy-image component built on a hand-written IntersectionObserver (no library), with rootMargin and unobserve-on-load.' },
      { idx:3, folder:'3-lcp-optimized-image-gallery-insane', difficulty:'insane', purpose:'An image gallery tuned for a green LCP + CLS=0: preload + fetchpriority for the hero, lazy + async-decode for the rest, measured under throttling.' },
    ],
  },
  {
    n: 3, slug: '3-adaptive-loading-for-network-and-device', premium: true,
    topic: 'Adaptive loading: Network Information API (saveData, effectiveType), prefers-reduced-data, deviceMemory to tune image quality and conditionally load heavy components, with feature-detect fallbacks.',
    contract: `Demo: a storefront that adapts its payload to the user\\u2019s real constraints. It reads navigator.connection (effectiveType, saveData), the prefers-reduced-data media query, and navigator.deviceMemory to: serve lower-resolution images, skip autoplay/heavy components on slow or data-saver connections, and prefetch the next route only on fast/high-memory devices. All behind feature-detection (graceful when APIs are absent). Flows (Playwright/DevTools emulation): (1) emulate slow 3G -> low-res images + heavy widget deferred; (2) saveData=on -> no video autoplay, smaller images; (3) prefers-reduced-data honored; (4) fast connection + high deviceMemory -> next-route assets prefetched.`,
    deep: 'Adaptive loading personalizes the payload to the user\\u2019s device and network instead of shipping one heavy bundle to everyone. The Network Information API, Client Hints, prefers-reduced-data, and deviceMemory expose those signals; the app branches on them with feature-detection so it degrades gracefully where the APIs are missing (Safari/Firefox). The mechanism is conditional resource loading driven by runtime capability signals.',
    tiers: [
      { idx:0, folder:'0-save-data-image-quality-easy', difficulty:'easy', purpose:'Switch image quality/resolution based on navigator.connection.saveData with a feature-detect fallback.' },
      { idx:1, folder:'1-network-aware-media-medium', difficulty:'medium', purpose:'Network-aware media: disable autoplay and load lighter assets on 2g/3g/effectiveType, honoring prefers-reduced-data.' },
      { idx:2, folder:'2-adaptive-component-loading-hard', difficulty:'hard', purpose:'Conditionally load a heavy component (chart/map) only on fast connections + sufficient deviceMemory; lightweight fallback otherwise.' },
      { idx:3, folder:'3-full-adaptive-storefront-insane', difficulty:'insane', purpose:'A full adaptive storefront combining network + device + reduced-data signals to drive image quality, prefetch, and component loading, with graceful degradation everywhere.' },
    ],
  },
]

phase('Bodies')

const results = await pipeline(
  LESSONS,
  (L) => agent(
    `Author ONE lesson of the StarCi Fullstack course (FS M15 Responsive & Adaptive Rendering) in V2 format. Write 4 files for lesson "${L.slug}".

STEP A — read the EXACT-format Vite-sandbox reference (a finished V2 lesson) and match its structure/numbering/separators/depth and its ROOT METADATA FIELD ORDER (it has isSandbox/githubBaseUrl/githubDir/backendUrl):
- ${REF}/vi.md and ${REF}/en.md (root metadata — copy the field set + order)
- ${REF_BODY}/vi.md and ${REF_BODY}/en.md (body shape: "## 1. Lời mở đầu" -> "## 2. Các khái niệm cốt lõi" -> "### 2.1. Thực hành" (2.1.1 chuẩn bị source + Vite frontend + NestJS mock backend, 2.1.2 kiến trúc + mermaid TD, 2.1.3 giải thích code with fenced React/TS + CSS snippets, 2.1.4 chạy, 2.1.5 Kiểm thử with "##### 2.1.5.N Luồng N" browser/DevTools observations, 2.1.6 dọn dẹp, 2.1.7 đọc thêm) -> "### 2.2. Lý thuyết" (2.2.1 Bản chất DEEP, 2.2.2 edge cases) -> "## 3. Tổng kết" (3.1 5 câu hỏi phỏng vấn)).

LESSON FACTS:
- Topic: ${L.topic}
- Concrete contract (what the demo does + the §2.1.5 flows): ${L.contract}
- §2.2.1 "Bản chất" MUST teach the MECHANISM (the why, browser-level): ${L.deep}

${SHARED}

PREMIUM: isPremium = ${L.premium}.

STEP C — write 4 files (Write tool):
1. ${CONTENTS}/${L.slug}/vi.md (root: title, description PLAIN TEXT, EMPTY body/codeExplaining/codeImplementations headers, references 3-4 REAL MDN / web.dev / spec links relevant to ${L.topic}, minutesRead ~18-22, isPremium ${L.premium}, then the SANDBOX METADATA block with <SLUG> replaced by ${L.slug}, then verified ${TODAY})
2. ${CONTENTS}/${L.slug}/en.md (English root mirror, same fields)
3. ${CONTENTS}/${L.slug}/bodies/0-agnostic/vi.md (# lang=agnostic + # body, full Vietnamese with diacritics; in 2.1.5 note Opus does not run E2E — flows are verified by Playwright/chủ nhiệm)
4. ${CONTENTS}/${L.slug}/bodies/0-agnostic/en.md (English mirror, SAME separator count as vi.md)

Use REAL authoritative URLs (MDN container queries, web.dev responsive images, MDN srcset, web.dev CLS/LCP, MDN IntersectionObserver, MDN NetworkInformation). NOT example.com.
Return ONLY: {"slug":"${L.slug}","files":<count>}.`,
    { label: `body:${L.slug}`, phase: 'Bodies', agentType: 'general-purpose' }
  ),
  (_b, L) => parallel(L.tiers.map((T) => () => agent(
    `Author a FRESH V2 challenge + submission for FS M15 lesson "${L.slug}", tier ${T.difficulty}, folder "${T.folder}". (This is a NEW topic — there is no V1 challenge to reuse; author from scratch.)

STEP A — read challenge/submission format: ${REF_CH}/vi.md, ${REF_CH}/en.md, ${REF_CH}/submissions/0/vi.md, ${REF_CH}/submissions/0/en.md. (Sections: # title, # description PLAIN TEXT, # requirements [## i with ### purpose / ### technicalConstraints / ### proTipsHints / ### score / ### promptText ; scores across requirements sum to 100], optional ### forbidden, # outputs, # prerequisites, # difficulty, # score=100, # verified.)
STEP B — Tier GOAL: ${T.purpose}. Lesson contract: ${L.contract}. The challenge builds a small Vite + React + TS app (FE-only; native browser platform APIs only — no next/image, no Next.js). Difficulty must genuinely fit ${T.difficulty} (easy/medium reproduce the lesson mechanism; hard/insane push concept depth — measured CLS/LCP budgets, zero-media-query constraints, format negotiation pipelines, adaptive matrices — NOT "build a big CRUD app").
${SHARED}
STEP C — write 4 files (Write): ${CONTENTS}/${L.slug}/challenges/${T.folder}/{vi.md,en.md} + ${CONTENTS}/${L.slug}/challenges/${T.folder}/submissions/0/{vi.md,en.md}. difficulty=${T.difficulty}, scores sum 100, submission score=100, lang=agnostic, githubUrl type. verified=${TODAY}.
Return ONLY: {"folder":"${T.folder}"}.`,
    { label: `ch:L${L.n}:${T.difficulty}`, phase: 'Challenges', agentType: 'general-purpose' }
  ).catch(() => null)))
)

phase('Finalize')
await parallel(LESSONS.map((L) => () => agent(
  `Write finalize files for FS M15 lesson "${L.slug}".
1. ${CONTENTS}/${L.slug}/code-context.md — canonical repo ${CANON} (org StarCi-Academy), lesson folder ${L.slug}/frontend. The source repo does NOT exist yet: mark "TO BE BUILT by maintainer from this spec". Stack: Vite + React 18 + TypeScript 5 frontend (port 3001, VITE_API_BASE) + tiny NestJS mock backend (port 3000, GET /api/products with multi-resolution image URLs); isSandbox=true; single-track agnostic; FE-only. Document the demo + the §2.1.5 Playwright/browser flows from: ${L.contract}. List the key frontend files a maintainer must create (components, CSS, the platform APIs used). Reference format: ${REF}/code-context.md
2. ${CONTENTS}/${L.slug}/audited.md — V2 audit log: format (root + bodies/0-agnostic + 4-tier challenges + submissions), lang=agnostic, isSandbox=true, isPremium=${L.premium}, verified=${TODAY}, gate expect 0 blocking, E2E = "PENDING — chủ nhiệm/Gemini verify via Playwright (Opus does not run E2E; source repo to be built)", list the 4 tiers: ${L.tiers.map(t=>t.folder).join(', ')}.
Use Write. Return ONLY: {"slug":"${L.slug}","done":true}.`,
  { label: `final:${L.slug}`, phase: 'Finalize', model: 'sonnet', agentType: 'general-purpose' }
)))

return { module: 'FS M15 responsive-and-adaptive-rendering', lessons: LESSONS.length }
