export const meta = {
  name: 'refactor-fs-accordion-terminology',
  description: 'Refactor accordion §2.1.5 + terminology/bold cho cac module FS truyen qua args.modules. Moi module: enumerate lessons -> per-lesson agent (accordion + terminology sweep tat ca lang vi+en) -> verify gate+parser. Report-only: KHONG push/seed. Chay SAU khi apply (tranh dung file).',
  phases: [
    { title: 'Enumerate' },
    { title: 'Refactor' },
    { title: 'Gate' },
  ],
}

// args.modules = ["1-database-integration-and-caching", ...]; mac dinh M1-M8 neu khong truyen.
const MODULES = (args && Array.isArray(args.modules) && args.modules.length)
  ? args.modules
  : [
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
const RULE = '.claude/docs/rules/terminology-bold.md'
const GOLD = BASE + '/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript/vi.md'

const LESSONS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['lessons'],
  properties: { lessons: { type: 'array', items: { type: 'string' } } },
}
const REFA_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lesson', 'accordion', 'terminology', 'verify', 'notes'],
  properties: {
    lesson: { type: 'string' },
    accordion: { type: 'string' },
    terminology: { type: 'string' },
    verify: { type: 'string', enum: ['ok', 'issues'] },
    notes: { type: 'string' },
  },
}

function refactorPrompt (modDir, les) {
  const dir = modDir + '/contents/' + les
  return [
    'Refactor 1 lesson FS: ' + dir + '. VIET/SUA TIENG VIET PHAI DU DAU (cam khong dau). Lam dung 2 viec, KHONG dao xao noi dung khac.',
    '',
    '=== VIEC 1 — ACCORDION §2.1.5 ===',
    '- Trong MOI file bodies/<lang>/{vi,en}.md (4-lang: 0-typescript/1-java/2-csharp/3-go; hoac FE: 0-agnostic), CHI section "#### 2.1.5":',
    '  (a) Neu da la ::::accordion roi -> BO QUA file do.',
    '  (b) Neu con dang "##### 2.1.5.1/.2/.3": GOP intro 2 list (muc tieu + route) thanh 1 list, moi dong "- **Luong N — `route`:** <muc tieu>" (EN "- **Flow N — `...`:** <goal>"); thay cac heading "##### 2.1.5.x" bang 1 khoi "::::accordion" + moi luong 1 ":::panel{title=\"<ten luong khong so>\"}" ... noi dung (buoc/curl/json/*Ket luan*) GIU NGUYEN ... dong ":::"; ket thuc "::::". 4 dau hai cham boc 3 dau.',
    '  (c) GIU NGUYEN moi section khac (2.1.3 van nest ##### la DUNG).',
    '- GOLD tham khao: ' + GOLD + ' (+ ban en).',
    '',
    '=== VIEC 2 — TERMINOLOGY + BOLD ===',
    '- DOC KY TOAN BO ' + RULE + ' truoc khi sua (rule STRICT).',
    '- 4 loai: L1 doi thuong -> DICH tieng Viet (khong bold); L2 EN nen tang -> GIU English (khong bold); L3 jargon -> English + **bold** (bold lan-dau-moi-lesson, sau plain); L4 code/dinh danh -> `inline code`.',
    '- RULING 2026-06-21: "source code" -> GIU English (KHONG dich "ma nguon").',
    '- DE-BOLD bat buoc (rule §3B/§4): bo ** quanh inline-code va URL (**`curl`** -> `curl`, **http...** -> plain). Bo bold ad-hoc/L1/L2 giua van xuoi. GIU nhan template §3A (Senior Engineer/Mid-level Developer, Phan 2.1/2.2, Cau hoi N, Giai phap/Trade-off/Co che/Luu y, Buoc N, README-section) + jargon L3.',
    '- Polysemy theo ngu canh (§2), CAM search-replace mu. Protect code fence + inline code.',
    '- Pham vi: prose trong "# body" cua bodies/<lang>/{vi,en}.md + prose challenges/<N>/{vi,en}.md (title/description/cac ##### body requirements/steps/outputs/prerequisites). KHONG dung ##### lang/### score/ten field.',
    '',
    '=== VERIFY (bat buoc) ===',
    '- grep dam bao 0 con "**`" (bold-inline-code) trong bodies; 0 "***" vo (bold+italic hop le thi OK); body moi file > 200 ky tu, fence chan.',
    '- Chay gate: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.claude/docs/check-lesson.ps1" -Path "' + modDir.replace(/\//g, '/') + '" -Json -> lesson nay KHONG co fail MOI (github-ref pre-existing thi bo qua).',
    '- Neu accordion: moi file §2.1.5 = 1 accordion + dung so panel.',
    '',
    'Tra ve dung schema. verify="ok" chi khi gate sach (tru github-ref) + 0 bold-inline-code + parser ok.',
  ].join('\n')
}

const allResults = []
for (const mod of MODULES) {
  const modDir = BASE + '/' + mod
  phase('Enumerate')
  const en = await agent(
    'Liet ke ten cac thu muc lesson trong ' + modDir + '/contents (chi ten folder cap 1, KHONG path). Chay: ls -1 "' + modDir + '/contents". Tra {lessons:[...]}.',
    { label: 'enum:' + mod, phase: 'Enumerate', model: 'haiku', schema: LESSONS_SCHEMA },
  )
  const lessons = (en && en.lessons) || []
  log('Module ' + mod + ': ' + lessons.length + ' lessons -> refactor accordion+terminology')

  phase('Refactor')
  const res = await parallel(lessons.map((les) => () =>
    agent(refactorPrompt(modDir, les), { label: 'refa:' + mod + ':' + les, phase: 'Refactor', schema: REFA_SCHEMA }),
  ))

  phase('Gate')
  const gate = await agent(
    'Chay gate module ' + mod + ': powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.claude/docs/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/' + modDir + '" -Json . Parse JSON, moi lesson liet ke fails; phan loai github-ref = pre-existing, con lai = regression. Tra text tieng Viet co dau.',
    { label: 'gate:' + mod, phase: 'Gate' },
  )
  allResults.push({ module: mod, lessons: res.filter(Boolean), gate })
}

return { refactored: MODULES, results: allResults, note: 'Accordion + terminology xong. Report-only, chua push/seed.' }
