export const meta = {
  name: 'refactor-fs-fast',
  description: 'FAST refactor: de-bold DA chay bang script (bold-inline=0). Workflow nay chi lo phan can doc-hieu: accordion §2.1.5 (skip neu da co) + terminology L1-dich/L3-bold. PARALLEL TAT CA lesson M1-M8 cung luc, model SONNET. Verify nhe. Report-only.',
  phases: [
    { title: 'Enumerate' },
    { title: 'Refactor' },
    { title: 'Gate' },
  ],
}

const MODULES = (args && Array.isArray(args.modules) && args.modules.length) ? args.modules : [
  '1-database-integration-and-caching',
  '2-rest-api-design-and-documentation',
  '3-authentication-and-authorization',
  '4-server-state-with-tanstack-query',
  '5-form-mastery-rhf-zod',
  '6-client-state-zustand-jotai',
  '7-react-reactivity-and-effects',
  '8-websocket-realtime-communication',
]
const BASE = '.mount/data/courses/0-fullstack-mastery/modules'
const RULE = '.audits/rules/terminology-bold.md'
const GOLD = BASE + '/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript/vi.md'

const LESSONS_SCHEMA = { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } }
const RES_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['lesson', 'accordion', 'terminology', 'verify'],
  properties: { lesson: { type: 'string' }, accordion: { type: 'string' }, terminology: { type: 'string' }, verify: { type: 'string', enum: ['ok', 'issues'] } },
}

function prompt (mod, les) {
  const dir = BASE + '/' + mod + '/contents/' + les
  return [
    'Refactor 1 lesson FS: ' + dir + '. VIET TIENG VIET DU DAU. 2 viec, KHONG dao xao section khac.',
    '',
    'LUU Y: DE-BOLD inline-code DA XONG bang script (0 con `**`...`**`). KHONG can de-bold nua — chi xac nhan.',
    '',
    '=== 1) ACCORDION §2.1.5 ===',
    'Trong MOI bodies/<lang>/{vi,en}.md (4-lang 0-typescript/1-java/2-csharp/3-go HOAC FE 0-agnostic), CHI section "#### 2.1.5":',
    '- Da la ::::accordion -> SKIP file do.',
    '- Con "##### 2.1.5.1/.2/.3": gop intro 2 list (muc tieu + route) -> 1 list "- **Luong N — `route`:** <muc tieu>" (EN "- **Flow N — `...`:** <goal>"); thay cac heading "##### 2.1.5.x" -> 1 "::::accordion" + moi luong 1 ":::panel{title=\"<ten luong khong so>\"}" ... noi dung (buoc/curl/json/*Ket luan*) GIU NGUYEN ... ":::"; dong "::::". GIU section khac (2.1.3 nest ##### la dung).',
    'GOLD: ' + GOLD + '.',
    '',
    '=== 2) TERMINOLOGY L1/L3 (de-bold da xong) ===',
    'DOC ' + RULE + '. Chi 2 thao tac con lai:',
    '- L1 doi thuong dang con tieng Anh -> DICH tieng Viet, KHONG bold (available->san sang, flow->luong).',
    '- L3 jargon chua bold -> them **bold** (bold lan-dau-moi-lesson; dependency graph, inversion of control, idempotent, single source of truth...). "do thi phu thuoc"->**dependency graph**.',
    '- GIU: L2 EN nen tang plain (lifecycle/request/container/queue/source code — "source code" GIU English), L4 code trong `backtick`, nhan template (Senior Engineer/Phan 2.1/Cau hoi N/Buoc N/Giai phap...). CAM bold ad-hoc/L1/L2/quanh code. Polysemy theo ngu canh, protect code fence.',
    'Pham vi: prose "# body" cua bodies + prose challenges/<N>/{vi,en}.md.',
    '',
    '=== VERIFY (nhe) ===',
    'grep 0 con "**`" trong bodies; §2.1.5 = 1 accordion + du panel; body khong vo (fence chan). Tra verify="ok" neu dat.',
  ].join('\n')
}

phase('Enumerate')
const lists = await parallel(MODULES.map((m) => () =>
  agent('ls -1 "' + BASE + '/' + m + '/contents" — chi ten folder lesson cap 1. Tra {lessons:[...]}.',
    { label: 'enum:' + m, phase: 'Enumerate', model: 'haiku', schema: LESSONS_SCHEMA })))

const tasks = []
MODULES.forEach((m, i) => { ((lists[i] && lists[i].lessons) || []).forEach((l) => tasks.push({ mod: m, lesson: l })) })
log('Fast refactor: ' + tasks.length + ' lesson (parallel, Sonnet)')

phase('Refactor')
const res = await parallel(tasks.map((t) => () =>
  agent(prompt(t.mod, t.lesson), { label: 'fast:' + t.mod.split('-')[0] + ':' + t.lesson, phase: 'Refactor', model: 'sonnet', schema: RES_SCHEMA })))

phase('Gate')
const gate = await parallel(MODULES.map((m) => () =>
  agent('Gate module ' + m + ': powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/' + BASE + '/' + m + '" -Json. Parse, liet ke fails moi lesson; github-ref=pre-existing. Tra text tieng Viet.',
    { label: 'gate:' + m.split('-')[0], phase: 'Gate', model: 'sonnet' })))

return { refactored: MODULES, lessons: tasks.length, results: res.filter(Boolean), gate }
