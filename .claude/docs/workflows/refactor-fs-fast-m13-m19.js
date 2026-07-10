export const meta = {
  name: 'refactor-fs-fast-m13-m19',
  description: 'FAST refactor M13-M19 (HARDCODE). De-bold da chay script (bold=0). Per-lesson Sonnet song song: accordion §2.1.5 (skip neu da co) + terminology L1-dich/L3-bold. Verify nhe. Report-only.',
  phases: [{ title: 'Enumerate' }, { title: 'Refactor' }, { title: 'Gate' }],
}

const MODULES = [
  '13-frontend-performance',
  '14-responsive-and-adaptive-rendering',
  '15-interaction-and-accessibility',
  '16-observability-logs-tracing-errors',
  '17-security-end-to-end',
  '18-testing-strategy',
  '19-deploy-and-devops-workflow',
]
const BASE = '.mount/data/courses/0-fullstack-mastery/modules'
const RULE = '.audits/rules/terminology-bold.md'
const GOLD = BASE + '/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript/vi.md'
const ABS = 'D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1'

const LESSONS_SCHEMA = { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } }
const RES_SCHEMA = { type: 'object', additionalProperties: false, required: ['lesson', 'accordion', 'terminology', 'verify'], properties: { lesson: { type: 'string' }, accordion: { type: 'string' }, terminology: { type: 'string' }, verify: { type: 'string', enum: ['ok', 'issues'] } } }

function prompt (mod, les) {
  const dir = BASE + '/' + mod + '/contents/' + les
  return [
    'Refactor 1 lesson FS: ' + dir + '. VIET TIENG VIET DU DAU. 2 viec, KHONG dao xao section khac.',
    'LUU Y: DE-BOLD inline-code DA XONG bang script (0 con `**`...`**`). Chi xac nhan, KHONG de-bold nua.',
    '',
    '=== 1) ACCORDION §2.1.5 ===',
    'Trong MOI bodies/<lang>/{vi,en}.md (4-lang 0-typescript/1-java/2-csharp/3-go HOAC FE 0-agnostic), CHI section "#### 2.1.5":',
    '- Da la ::::accordion -> SKIP file do.',
    '- Con "##### 2.1.5.N": gop intro list -> 1 list "- **Luong N — `route`:** <muc tieu>" (EN "- **Flow N — `...`:** <goal>"); thay heading "##### 2.1.5.N" -> 1 "::::accordion" (4 dau) + moi luong 1 ":::panel{title=\"<ten khong so>\"}" (3 dau) ... noi dung GIU NGUYEN ... ":::"; dong "::::". GIU section khac (2.1.3 nest ##### dung). So panel = so luong (co the 3-5).',
    'GOLD: ' + GOLD + '.',
    '',
    '=== 2) TERMINOLOGY L1/L3 ===',
    'DOC ' + RULE + '. L1 doi thuong con English -> DICH Viet, KHONG bold. L3 jargon chua bold -> **bold** (lan-dau-moi-lesson). GIU L2 plain (lifecycle/request/container/queue/source code giu English), L4 `backtick`, nhan template. CAM bold ad-hoc/quanh code. Protect code fence. Pham vi: prose body + challenges prose.',
    '',
    '=== VERIFY ===',
    'grep 0 con "**`" trong bodies; §2.1.5 = 1 accordion + du panel; fence chan. verify="ok" neu dat.',
  ].join('\n')
}

phase('Enumerate')
const lists = await parallel(MODULES.map((m) => () =>
  agent('ls -1 "' + BASE + '/' + m + '/contents" — chi ten folder lesson. Tra {lessons:[...]}.',
    { label: 'enum:' + m.split('-')[0], phase: 'Enumerate', model: 'haiku', schema: LESSONS_SCHEMA })))
const tasks = []
MODULES.forEach((m, i) => { ((lists[i] && lists[i].lessons) || []).forEach((l) => tasks.push({ mod: m, lesson: l })) })
log('Fast refactor M13-M19: ' + tasks.length + ' lesson (parallel Sonnet)')

phase('Refactor')
// GENTLE: chay TUNG MODULE mot (lessons cua module do parallel ~4-5 agent), KHONG bung het 1 luc.
// Tranh hammer API dang overload (529). Module 529 thi chi batch nho fail, retry de.
const res = []
for (const m of MODULES) {
  const mt = tasks.filter((t) => t.mod === m)
  const r = await parallel(mt.map((t) => () =>
    agent(prompt(t.mod, t.lesson), { label: 'fast:' + t.mod.split('-')[0] + ':' + t.lesson, phase: 'Refactor', model: 'sonnet', schema: RES_SCHEMA })))
  res.push(...r)
  log('Module ' + m + ' xong (' + r.filter(Boolean).length + '/' + mt.length + ' lesson)')
}

phase('Gate')
const gate = []
for (const m of MODULES) {
  const g = await agent('Gate module ' + m + ': powershell.exe -NoProfile -File "' + ABS + '" -Path "D:/Repositories/starci-academy-backend/' + BASE + '/' + m + '" -Json. Liet ke fails moi lesson; github-ref=pre-existing. Tra text tieng Viet.',
    { label: 'gate:' + m.split('-')[0], phase: 'Gate', model: 'sonnet' })
  gate.push(g)
}

return { refactored: MODULES, lessons: tasks.length, results: res.filter(Boolean), gate }
