export const meta = {
  name: 'author-react-effects-module',
  description: 'Build LAI module 7 (data-viz -> React Reactivity & Effects). Setup: rename mount+repo, rewrite module md, scaffold 4 lesson tu base reference. Author: per-lesson code+specs+body+challenges theo pattern m4/m5/m6. Gate cuoi.',
  phases: [
    { title: 'Setup', detail: 'rename module+repo, scaffold 4 lesson tu reference', model: 'opus' },
    { title: 'Author', detail: 'per-lesson: code+testid+playwright+body+challenges+test', model: 'opus' },
    { title: 'Gate', detail: 'check-lesson.ps1 module', model: 'sonnet' },
  ],
}

const MODOLD = '7-data-visualization'
const MODNEW = '7-react-reactivity-and-effects'
const REPOOLD = 'fullstack-mastery-module-8-data-visualization'
const REPONEW = 'fullstack-mastery-module-8-react-reactivity-and-effects'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'
const REF = '.repo/fullstack-mastery-module-7-client-state-zustand-jotai/0-zustand-store-and-selectors' // base scaffold + pattern gold
const REFMOUNT = MODDIR + '/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors' // body+challenge format gold

const LESSONS = [
  { slug: '0-you-might-not-need-an-effect', title: 'You Might Not Need an Effect', focus: 'derived state (tinh trong render, KHONG useEffect+setState), event handler vs effect (logic do user-action -> handler, KHONG effect), anti-patterns (effect dong bo state tu prop, fetch trong effect khong cleanup, reset state bang effect). Demo: 1 form/list nha co bug effect-derived-state (double render / state cu) roi version fix tinh derived inline. testid cho gia tri derived + so lan render.' },
  { slug: '1-usesyncexternalstore', title: 'useSyncExternalStore', focus: 'subscribe external/browser store dung cach (KHONG useEffect+useState de mirror). Demo: hook useOnlineStatus / useMediaQuery / useWindowSize hoac 1 vanilla store ngoai React, subscribe bang useSyncExternalStore (subscribe + getSnapshot + getServerSnapshot). Day tearing: 2 component doc cung store render NHAT QUAN. testid cho gia tri store + concurrent consistency.' },
  { slug: '2-refs-and-imperative-handle', title: 'Refs & Imperative Handle', focus: 'forwardRef + useImperativeHandle (expose API: focus()/scrollToBottom()/reset() tu child), do DOM (getBoundingClientRect/ResizeObserver), focus management, scroll. Demo: 1 input/list component expose imperative method cho parent goi qua ref; measure element. testid cho ket qua focus/scroll/measure.' },
  { slug: '3-race-conditions-and-cancellation', title: 'Race Conditions & Cancellation', focus: 'fetch trong effect bi race (last-write-wins sai khi query doi nhanh), fix bang AbortController + cleanup (ignore stale response / abort). Demo: search-as-you-type goi mock API delay khac nhau -> version buggy hien ket qua cu, version fixed dung AbortController/ignore-flag. testid cho ket qua hien thi + so request. CAN mock backend co delay.' },
]

// ---- Phase Setup (skip neu orchestrator da scaffold tay) ----
const SKIP_SETUP = (typeof args === 'object' && args && (args.skipSetup === true || args.skipSetup === 'true'))
if (!SKIP_SETUP) {
phase('Setup')
const SETUP_SCHEMA = { type: 'object', properties: { ok: { type: 'boolean' }, lessonsCreated: { type: 'array', items: { type: 'string' } }, repoRenamed: { type: 'boolean' }, notes: { type: 'string' } }, required: ['ok', 'lessonsCreated', 'notes'] }
const setup = await agent(
  'SETUP build lai module 7 (data-viz -> React Reactivity & Effects). cwd = C:/Repositories/ac/starci-academy-backend. VIET TIENG VIET CO DAU.\n' +
  '1) RENAME mount module folder: `git -C .mount/data mv courses/0-fullstack-mastery/modules/' + MODOLD + ' courses/0-fullstack-mastery/modules/' + MODNEW + '` (hoac mv thuong neu git mv loi).\n' +
  '2) REWRITE ' + MODDIR + '/' + MODNEW + '/vi.md + en.md: GIU NGUYEN FORMAT (# title / <!-- @starci/seperator --> / value / separator; # description; # previewContents voi ## 0..3 / ### text). title="React Reactivity & Effects" (vi giu tieng Anh thuat ngu). description: mo ta module day 4 ky thuat React nang cao sach it day: derived-state vs effect, useSyncExternalStore, refs/imperative handle, race-condition/cancellation. previewContents 4 muc = 4 lesson title. en.md mirror.\n' +
  '3) XOA 4 lesson chart cu trong ' + MODDIR + '/' + MODNEW + '/contents/ (0-line-and-bar-charts, 1-responsive-and-tooltips, 2-interactive-brush-and-zoom, 3-dashboard-composition) + trong repo .repo/' + REPOOLD + '/ (cac folder tuong ung). XOA file antigravity_test.md neu con.\n' +
  '4) RENAME repo: `git -C .repo/' + REPOOLD + ' ...` KHONG can; doi folder local: mv .repo/' + REPOOLD + ' .repo/' + REPONEW + '. Roi `gh repo rename ' + REPONEW.replace('fullstack', 'fullstack') + ' --repo StarCi-Academy/fullstack-mastery-module-8-data-visualization --yes` (doi ten repo GitHub data-visualization -> react-reactivity-and-effects). Cap nhat remote: `git -C .repo/' + REPONEW + ' remote set-url origin https://github.com/StarCi-Academy/' + REPONEW + '.git`. Neu gh rename fail (scope/quyen) -> ghi notes, KHONG block.\n' +
  '5) Tao 4 lesson dir + scaffold base: voi moi slug [' + LESSONS.map(function (l) { return l.slug }).join(', ') + ']:\n' +
  '   - mkdir ' + MODDIR + '/' + MODNEW + '/contents/<slug>/bodies/0-agnostic/ (se author sau).\n' +
  '   - COPY base Vite scaffold tu reference .repo/' + REPONEW + '/... KHONG co -> dung ' + REF + ' (client-state L0): copy frontend/ + .playwright/ vao .repo/' + REPONEW + '/<slug>/. Loai bo node_modules khi copy. Strip cac thu rieng-zustand (vd dep zustand trong package.json neu lesson khong dung) — de Author phase xu chi tiet.\n' +
  'TRA VE {ok, lessonsCreated:[slug...], repoRenamed, notes}.',
  { label: 'setup:react-effects', phase: 'Setup', model: 'opus', schema: SETUP_SCHEMA }
)
log('Setup: ' + (setup && setup.notes))
if (!setup || !setup.ok) { return { error: 'setup failed', setup } }
} else {
  log('Setup SKIPPED — orchestrator da rename+scaffold tay; vao thang Author.')
}

// ---- Phase Author (parallel per-lesson) ----
phase('Author')
const authored = await parallel(LESSONS.map(function (L) {
  return function () {
    const dir = MODDIR + '/' + MODNEW + '/contents/' + L.slug
    const repoLesson = '.repo/' + REPONEW + '/' + L.slug
    return agent(
      'AUTHOR lesson "' + L.slug + '" (title: ' + L.title + ') cho module React Reactivity & Effects. cwd = repo root. VIET TIENG VIET CO DAU. THEO PATTERN m4/m5/m6.\n' +
      'CHU DE + demo can dung: ' + L.focus + '\n' +
      'HOC PATTERN TRUOC (BAT BUOC doc): ' + REF + '/frontend/src/App.tsx (Local/Sandbox split, HeroUI Typography, ?sandbox), components/{providers,Local,Sandbox}, .playwright/playwright.config.ts; va body+challenge gold ' + REFMOUNT + '/bodies/0-agnostic/vi.md + challenges/*/. GIU Y HET convention: agnostic single-track, HeroUI v3, spacing h-6/h-3, testid data-testid, App = Label+Description + {isSandbox?<Sandbox/>:<Local/>}.\n' +
      '1) CODE (repo ' + repoLesson + '/frontend/src): thay demo zustand bang demo CHU DE nay — component(s) minh hoa ky thuat (buggy-vs-fixed neu hop), data-testid cho moi gia tri/trang thai Playwright can kiem. Local = client don khop testid; Sandbox = truc quan (single-client -> Sandbox=Local OK). Cap nhat package.json deps dung (bo zustand neu khong dung; them gi can). Comment English-only, JSDoc.\n' +
      (L.slug.indexOf('race') >= 0 ? '   - CAN mock backend: tao ' + repoLesson + '/backend (NestJS mock) GET endpoint co delay query-param de demo race; HOAC mock bang setTimeout trong client neu du (uu tien mock client-side cho don gian, agnostic FE-only).\n' : '   - FE-only (khong can backend); neu can data dung mock client-side.\n') +
      '2) PLAYWRIGHT (' + repoLesson + '/.playwright/scripts): viet 3 (hoac 4) spec flow kiem ky thuat (vd L0: derived value dung + render-count khong tang; L1: 2 component nhat quan; L2: focus/scroll/measure dung; L3: ket qua = query MOI NHAT du response cu ve sau). Dung playwright.config san (port 3001 vite.config, bind 127.0.0.1).\n' +
      '3) BODY (' + dir + '/bodies/0-agnostic/vi.md + en.md): theo cau truc gold §2.1.x (2.1.1 Source+clone+cd, 2.1.2 thanh phan, 2.1.3 phan tich code+snippet KHOP source, 2.1.4 cach chay `npm run dev` KHONG -p, 2.1.5 cac luong + testid khop spec, 2.2 ly thuyet 2 muc, 3 interview 3-5 cau). Source URL = https://github.com/StarCi-Academy/' + REPONEW + ' thu muc ' + L.slug + '. vi goc, en mirror.\n' +
      '4) CHALLENGES (' + dir + '/challenges/): 4 tier 0-easy/1-medium/2-hard/3-insane theo merit, slug ro nghia, vi/en + submissions/0 (outcomeCriterias sum 30 + approachCriterias sum 70, >=1 critical, # verified, callout :::muted KHONG ### heading). Lang agnostic.\n' +
      '5) TEST: npm install + chay playwright (chromium headless) -> PASS. Kill port 3000/3001 truoc. Ghi .e2e/agnostic/flow-N-*-done.md output that.\n' +
      '6) synced.yaml status ok.\n' +
      'TRA VE text ngan: da author gi + playwright pass may flow.',
      { label: 'author:' + L.slug, phase: 'Author', model: 'opus' }
    )
  }
}))
log('Author xong ' + authored.filter(Boolean).length + '/' + LESSONS.length + ' lesson')

// ---- Phase Gate ----
phase('Gate')
const GATE = { type: 'object', properties: { lessons: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, fails: { type: 'array', items: { type: 'string' } } }, required: ['name', 'fails'] } } }, required: ['lessons'] }
const gate = await agent(
  'GATE (KHONG sua file). Chay: powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "' + MODDIR + '/' + MODNEW + '" -Json. BAT BUOC StructuredOutput {lessons:[{name,fails}]} copy nguyen van.',
  { label: 'gate:react-effects', phase: 'Gate', model: 'sonnet', schema: GATE }
)
const bad = ((gate && gate.lessons) || []).filter(function (l) { return l.fails && l.fails.length })
log('Gate: ' + bad.length + ' lesson con fail')
return { module: MODNEW, gate: gate, authored: authored.filter(Boolean).length }
