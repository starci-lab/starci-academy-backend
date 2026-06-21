export const meta = {
  name: 'refactor-m0-accordion-terminology',
  description: 'Refactor toan bo M0 fullstack: (1) §2.1.5 testcase -> ::::accordion/:::panel; (2) ap quy uoc terminology+bold (.audits/rules/terminology-bold.md). Per-lesson parallel, moi agent tu verify (gate + parser extract). Report-only: KHONG push/seed.',
  phases: [
    { title: 'Refactor', detail: 'moi lesson 1 agent: accordion §2.1.5 (skip neu da accordion) + terminology sweep tat ca lang vi+en + challenges prose, roi verify' },
    { title: 'Gate', detail: 'gate toan module sau refactor (chi con github-ref fail la chap nhan)' },
  ],
}

const MOD = '0-nestjs-core-and-request-lifecycle'
const MOD_DIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD + '/contents'
const LESSONS = [
  '0-frameworks-in-backend',
  '1-request-response-lifecycle',
  '2-multi-environment-configuration',
  '3-production-grade-logging',
  '4-error-handling-and-response-shaping',
]
// L0 da co accordion (pilot) -> agent skip phan accordion cho L0, van lam terminology.
const ACCORDION_DONE = ['0-frameworks-in-backend']

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lesson', 'accordion', 'terminology', 'verify', 'notes'],
  properties: {
    lesson: { type: 'string' },
    accordion: { type: 'string', description: 'lang da convert §2.1.5 -> accordion, hoac "skip (da accordion)"' },
    terminology: { type: 'string', description: 'tom tat thay doi terminology/bold dang ke (file + so cho)' },
    verify: { type: 'string', enum: ['ok', 'issues'] },
    notes: { type: 'string', description: 'gotcha / cho phan van / vi sao issues (tieng Viet co dau)' },
  },
}

const RULE = '.audits/rules/terminology-bold.md'
const GOLD = MOD_DIR + '/0-frameworks-in-backend/bodies/0-typescript/vi.md'

function buildPrompt (les) {
  const dir = MOD_DIR + '/' + les
  const skipAccordion = ACCORDION_DONE.indexOf(les) >= 0
  return [
    'Ban refactor 1 lesson StarCi Fullstack M0: ' + dir + '. VIET/SUA TIENG VIET PHAI DU DAU (cam khong dau).',
    '',
    'CO 2 viec, lam DUNG pham vi, KHONG dao xao noi dung khac:',
    '',
    '=== VIEC 1 — ACCORDION cho §2.1.5 (testcase) ===',
    skipAccordion
      ? '- Lesson nay ' + les + ' DA accordion roi -> BO QUA viec 1 (KHONG dung §2.1.5). Chi lam viec 2.'
      : [
        '- Trong MOI file bodies/<lang>/{vi,en}.md (4 lang: 0-typescript 1-java 2-csharp 3-go), CHI section "#### 2.1.5" (Kiem thu/Verification):',
        '  (a) Gop intro: hien co 2 bullet-list cung danh Luong/Flow 1-2-3 (1 list muc tieu + 1 list route) -> GOP thanh 1 list 3 dong, moi dong = route + muc tieu, dang: "- **Luong N — `GET /...`:** <muc tieu>" (EN: "- **Flow N — `GET /...`:** <goal>").',
        '  (b) Thay 3 heading "##### 2.1.5.1/.2/.3" bang 1 khoi accordion: mo "::::accordion", moi luong = ":::panel{title=\"<ten luong khong so>\"}" ... noi dung luong (buoc + code fence + *Ket luan*) ... dong ":::"; ket thuc "::::". 4 dau hai cham o accordion boc 3 dau o panel.',
        '  (c) GIU NGUYEN noi dung tung luong (buoc/curl/json/ket luan), chi doi cau truc heading->panel. GIU NGUYEN moi section khac (2.1.3 van nest sau ##### la DUNG, KHONG dung).',
        '- GOLD tham khao (da lam dung): ' + GOLD + ' va ban en cua no. Lam y het pattern do.',
      ].join('\n'),
    '',
    '=== VIEC 2 — TERMINOLOGY + BOLD ===',
    '- DOC KY TOAN BO ' + RULE + ' truoc khi sua 1 ky tu (rule STRICT, sai 1 cho = sai ca module).',
    '- Ap 4 loai: L1 doi thuong -> DICH tieng Viet (khong bold); L2 EN nen tang -> GIU English (khong bold); L3 jargon -> English + **bold**; L4 code/dinh danh -> `inline code` (khong bold/dich).',
    '- RULING MOI (2026-06-21): "source code" -> GIU English "source code" (L2), KHONG dich "ma nguon".',
    '- Polysemy theo ngu canh (§2 rule): doc ca cum truoc khi doi, CAM search-replace mu. Protect code fence + inline code (KHONG dung chu ben trong). Guard collocation (mục đích/single source of truth...).',
    '- Pham vi sweep: prose trong "# body" cua bodies/<lang>/{vi,en}.md + prose trong challenges/<N>-<slug>/{vi,en}.md (# title, # description, cac ##### body cua requirements/steps/outputs/prerequisites — gom block :::muted). KHONG dung ##### lang, ### score, ten field heading.',
    '- Bold chi cho: jargon L3 + nhan template §3A (Senior Engineer/Mid-level Developer, Phan 2.1/2.2, Cau hoi N, Giai phap/Trade-off/Co che/Luu y, Buoc N...). CAM bold ad-hoc/L1/L2/quanh inline-code.',
    '',
    '=== VERIFY (bat buoc truoc khi tra ket qua) ===',
    '- Chay parser that tren MOI bodies/<lang>/vi.md da sua: node -e bang ExtractJsonFromMdService hoac don gian doc lai dam bao body > 200 ky tu, fence chan, KHONG vo cau truc.',
    '- Chay gate: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/' + MOD + '" -Json  -> dam bao lesson nay KHONG co fail MOI (fail "github ref ... KHONG khop folder .repo" la PRE-EXISTING, BO QUA; bat ky fail khac = phai sua lai cho den khi het).',
    '- Neu accordion: verify directive parse (1 accordion + 3 panel moi file §2.1.5).',
    '',
    'Tra ve dung schema. terminology = liet ke ngan file + loai thay doi (vd "java/vi: bold 4 jargon, dich 2 L1"). verify="ok" chi khi gate sach (tru github-ref) + parser ok.',
  ].join('\n')
}

phase('Refactor')
log('Refactor M0: ' + LESSONS.length + ' lessons (accordion §2.1.5 + terminology). Report-only, khong push/seed.')

const results = await parallel(LESSONS.map((les) => () =>
  agent(buildPrompt(les), { label: 'refactor:' + les, phase: 'Refactor', schema: SCHEMA }),
))

const done = results.filter(Boolean)
const issues = done.filter((r) => r.verify === 'issues')

phase('Gate')
const gateOut = await agent(
  'Chay gate toan module M0 va bao cao. Lenh: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/' + MOD + '" -Json . ' +
  'Parse JSON, voi MOI lesson liet ke fails. PHAN LOAI: "github ref ... KHONG khop folder .repo" = PRE-EXISTING (chap nhan); MOI fail khac = REGRESSION can sua. Tra ve text tieng Viet co dau: bang lesson x (pre-existing | regression).',
  { label: 'gate:module', phase: 'Gate' },
)

return {
  module: MOD,
  refactored: done.length,
  issues: issues.map((r) => ({ lesson: r.lesson, notes: r.notes })),
  perLesson: done,
  moduleGate: gateOut,
}
