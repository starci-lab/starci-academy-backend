export const meta = {
  name: 'refactor-sd-accordion-terminology',
  description: 'Refactor SD: §2.1.5 testcase -> ::::accordion/:::panel (so luong bien thien N) + terminology+bold (.claude/docs/rules/terminology-bold.md, course-agnostic) gom de-bold inline-code + source-code giu English. Per-lesson parallel theo module, moi agent tu verify (gate + parser). Report-only: KHONG push. Guard: chi §2.1.5 accordion, KHONG dung repo-ref/cd, KHONG docker.',
  phases: [
    { title: 'Refactor' },
    { title: 'Gate' },
  ],
}

const COURSE_DIR = '.mount/data/courses/1-system-design-mastery/modules'
const RULE = '.claude/docs/rules/terminology-bold.md'
// Default M1-M3 (M0 dang chay challenge-apply). Override bang args.modules.
const MODULES = (args && Array.isArray(args.modules) && args.modules.length)
  ? args.modules
  : ['1-database-fundamentals', '2-kubernetes-fundamentals', '3-communication-patterns']

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lesson', 'accordion', 'terminology', 'verify', 'notes'],
  properties: {
    lesson: { type: 'string' },
    accordion: { type: 'string', description: 'so file da convert §2.1.5 -> accordion + so panel/file (vd "8/8 file, 4 panel")' },
    terminology: { type: 'string', description: 'tom tat thay doi terminology/bold (de-bold inline-code bao nhieu, dich/bold gi)' },
    verify: { type: 'string', enum: ['ok', 'issues'] },
    notes: { type: 'string', description: 'tieng Viet co dau: gotcha / vi sao issues' },
  },
}

function buildPrompt (modDir, les) {
  const dir = modDir + '/contents/' + les
  return [
    'Refactor 1 lesson System Design: ' + dir + '. VIET/SUA TIENG VIET DU DAU (cam khong dau).',
    '',
    '=== VIEC 1 — ACCORDION §2.1.5 (testcase) ===',
    '- Trong MOI file bodies/<lang>/{vi,en}.md (thuong 4 lang typescript/java/csharp/go, hoac agnostic), CHI section "#### 2.1.5":',
    '  (a) Intro: dua ve 1 list, moi dong = "- **Luong N — `route/action`:** <muc tieu>" (EN "- **Flow N — `...`:** <goal>"). Neu da 1 list thi chi reformat ve dung khuon nay. Them duoi "— mo tung luong de chay" / "— expand a flow to run it".',
    '  (b) Thay cac heading "##### 2.1.5.N" bang 1 khoi "::::accordion" voi N panel ":::panel{title=\"<ten luong khong so>\"}" — SO PANEL = SO LUONG that cua lesson (3, 4, hoac 5; KHONG fix 3). Moi panel giu NGUYEN noi dung luong (buoc/curl/docker/json/*Ket luan*). Dong panel ":::", dong accordion "::::".',
    '  (c) GIU NGUYEN moi section khac (2.1.3 van nest ##### la DUNG). Chi dung §2.1.5.',
    '  - Khuon accordion: "::::" (4 dau) boc cac ":::" (3 dau). Vi du 1 panel:\n    ::::accordion\n    :::panel{title="Luong 1 — ..."}\n    <noi dung luong>\n    :::\n    ::::',
    '',
    '=== VIEC 2 — TERMINOLOGY + BOLD ===',
    '- DOC KY ' + RULE + ' (course-agnostic, ap ca SD). 4 loai: L1 doi thuong->DICH Viet (khong bold); L2 EN nen tang->GIU English (khong bold); L3 jargon->English+**bold**; L4 code->`inline code`.',
    '- RULING 2026-06-21: "source code" -> GIU English (L2), KHONG dich "ma nguon".',
    '- DE-BOLD: bo ** quanh inline-code/URL (rule §3B CAM): "**`curl`**" -> "`curl`", "**http://...**" -> URL plain. Bo bold ad-hoc cum giua doan + bold L1/L2. GIU bold jargon L3 + nhan template §3A (Senior Engineer/Mid-level Developer, Phan 2.1/2.2, Cau hoi N, Giai phap/Trade-off/Co che, Buoc N).',
    '- Polysemy theo ngu canh; protect code fence + inline code (KHONG dung chu ben trong). Pham vi: prose "# body" cua bodies/<lang>/{vi,en}.md + prose challenges/<N>-<slug>/{vi,en}.md.',
    '',
    '=== GUARD ===',
    '- KHONG dung repo clone URL / cd path / code-context / .repo (blocker repo = bao nham, body tro repo THAT tren GitHub). KHONG chay docker/e2e.',
    '',
    '=== VERIFY truoc khi tra ===',
    '- Gate: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.claude/docs/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/' + modDir + '" -Json -> lesson nay KHONG co fail MOI (fail "github ref" = pre-existing, bo qua).',
    '- Parser: moi bodies/<lang>/vi.md da sua: body > 200 ky tu, fence chan, accordion = N panel khop so luong, 0 con "##### 2.1.5.".',
    '- grep: 0 con "**`" (bold-inline-code) trong bodies da sua; 0 "***" vo.',
    'Tra ve dung schema.',
  ].join('\n')
}

const allResults = []
for (const mod of MODULES) {
  const modDir = COURSE_DIR + '/' + mod
  phase('Refactor')
  log('=== Refactor SD accordion+terminology: ' + mod + ' ===')
  const enum0 = await agent(
    'Liet ke ten thu muc lesson (contents/*) cua ' + modDir + '/contents. Tra ve JSON {lessons:[...]} theo thu tu so-prefix.',
    { label: 'enum:' + mod, phase: 'Refactor', model: 'haiku', schema: { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } } },
  )
  const lessons = (enum0 && enum0.lessons) || []
  log(mod + ': ' + lessons.length + ' lessons')

  const modResults = await parallel(lessons.map((les) => () =>
    agent(buildPrompt(modDir, les), { label: 'refactor:' + mod + ':' + les, phase: 'Refactor', model: 'opus', schema: SCHEMA }),
  ))
  allResults.push({ module: mod, lessons: modResults.filter(Boolean) })

  phase('Gate')
  const g = await agent(
    'Chay gate module: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.claude/docs/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/' + modDir + '" -Json . Parse, moi lesson liet ke fails; phan loai github-ref=pre-existing vs regression. Tra ve text tieng Viet co dau.',
    { label: 'gate:' + mod, phase: 'Gate', model: 'sonnet' },
  )
  allResults[allResults.length - 1].gate = g
}

return {
  course: 'system-design',
  task: 'accordion+terminology',
  modules: MODULES,
  note: 'Report-only, KHONG push. CHO THAY DUYET roi push + (neu can) seed.',
  results: allResults,
}
