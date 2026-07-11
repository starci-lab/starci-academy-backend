export const meta = {
  name: 'content-fix-sd',
  description: 'Content-fix SD (NO audit-review, NO e2e): per-lesson pipeline Opus author challenge thieu tier (4-challenge: easy/medium/hard/insane) -> Sonnet accordion §2.1.5 + terminology L1/L3. Parallel theo lesson, sequential theo module. De-bold = SCRIPT chay ngoai (truoc+sau). Report-only: KHONG push.',
  phases: [
    { title: 'Enumerate', detail: 'liet ke lesson', model: 'haiku' },
    { title: 'Challenge', detail: 'Opus author tier thieu (no e2e)', model: 'opus' },
    { title: 'Content', detail: 'Sonnet accordion + terminology', model: 'sonnet' },
    { title: 'Gate', detail: 'check-lesson.ps1 per module', model: 'sonnet' },
  ],
}

const COURSE_DIR = '.mount/data/courses/1-system-design-mastery/modules'
const RULES = '.claude/docs/rules/system-design'
const TERM_RULE = '.claude/docs/rules/terminology-bold.md'
const ABS = 'C:/Repositories/ac/starci-academy-backend'

const MODULES = (args && Array.isArray(args.modules) && args.modules.length)
  ? args.modules
  : [
    '0-fundamentals-of-system-design',
    '1-database-fundamentals',
    '2-kubernetes-fundamentals',
    '3-communication-patterns',
    '4-kafka-streaming-and-reliability',
  ]

const ENUM_SCHEMA = { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } }
const CONTENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lesson', 'accordion', 'terminology', 'verify', 'notes'],
  properties: {
    lesson: { type: 'string' },
    accordion: { type: 'string', description: 'so file da convert §2.1.5 -> accordion + so panel/file' },
    terminology: { type: 'string', description: 'tom tat L1 dich / L3 bold / de-bold con sot' },
    verify: { type: 'string', enum: ['ok', 'issues'] },
    notes: { type: 'string', description: 'tieng Viet co dau: gotcha / vi sao issues' },
  },
}

// ---- Stage 1 (Opus): author challenge thieu tier theo rule 4-challenge, NO e2e ----
function challengePrompt (dir, les) {
  return [
    'CHALLENGE AUTHOR (Opus) lesson SD ' + les + ' — apply THANG 4-challenge, KHONG review-stop, KHONG e2e/test/docker. VIET TIENG VIET CO DAU DAY DU (cam khong dau).',
    'Doc: ' + dir + ' (bodies/*/{vi,en}.md + challenges/*/{vi,en}.md hien co + submissions) + ' + RULES + '/challenges.md. Neu co ' + dir + '/review.md thi doc lam GOI Y (khong bat buoc theo).',
    '',
    'NHIEM VU: dam bao lesson du DUNG 4 challenge = 1 moi tier easy+medium+hard+insane (rule 2026-06-21, bo luat cu slot 1-3 chi 2 tier).',
    '- Liet ke tier hien co. Tier nao THIEU -> AUTHOR moi: topic cu the (khong overlap tier khac), depth production that (hard/insane = co che that, KHONG guong cho du so).',
    '- Folder: challenges/<N>-<slug>-<tier>/{vi.md,en.md} + submissions/0/... theo V2: score=100, outcomeCriterias Sigma=30 + approachCriterias Sigma=70, >=1 critical:true, co `# verified`, vi/en mirror, callout `:::muted` (KHONG `### N.` heading kieu V1).',
    '- Re-index folder challenge lien mach: 0-...-easy, 1-...-medium, 2-...-hard, 3-...-insane.',
    '- Neu them tier gay GUONG that su (khong co dat dien production) -> VAN author nhung GHI canh bao trong decision.md cho thay biet (uu tien rule 4-challenge, nhung neu rui ro thi neu ro).',
    'TUYET DOI KHONG: chay e2e/test/docker/server; sua accordion/terminology (de Sonnet stage sau lam); dao xao body da chot.',
    'GHI ' + dir + '/decision.md (tag [Opus 4.8], tieng Viet) muc "## Content-fix challenge": tier da them + ly do + canh bao neu co.',
    'TRA VE text ngan 2-3 dong: tier truoc/sau + da author gi.',
  ].join('\n')
}

// ---- Stage 2 (Sonnet): accordion §2.1.5 + terminology L1/L3 (de-bold da chay bang script ngoai) ----
function contentPrompt (dir, les) {
  return [
    'CONTENT-FIX (Sonnet) lesson SD: ' + dir + '. VIET/SUA TIENG VIET DU DAU (cam khong dau).',
    '',
    '=== VIEC 1 — ACCORDION §2.1.5 ===',
    '- Trong MOI file bodies/<lang>/{vi,en}.md (4 lang typescript/java/csharp/go, hoac agnostic), CHI section "#### 2.1.5":',
    '  (a) Intro: dua ve 1 list, moi dong = "- **Luong N — `route/action`:** <muc tieu>" (EN "- **Flow N — `...`:** <goal>"). Da 1 list thi reformat ve khuon nay. Them duoi "— mo tung luong de chay" / "— expand a flow to run it".',
    '  (b) Thay cac heading "##### 2.1.5.N" bang 1 khoi "::::accordion" voi N panel ":::panel{title=\"<ten luong khong so>\"}" — SO PANEL = SO LUONG that (3/4/5, KHONG fix 3). Moi panel giu NGUYEN noi dung luong. Dong panel ":::", dong accordion "::::" (4 dau boc 3 dau). Da accordion roi -> skip.',
    '  (c) GIU NGUYEN section khac (2.1.3 nest ##### la dung). Chi dung §2.1.5.',
    '',
    '=== VIEC 2 — TERMINOLOGY + BOLD ===',
    '- DOC KY ' + TERM_RULE + '. L1 doi thuong->DICH Viet (khong bold); L2 EN nen tang->GIU English (khong bold; "source code" GIU English, KHONG "ma nguon" — ruling 2026-06-21); L3 jargon->English+**bold** (bold lan-dau/lesson); L4 code->`inline`.',
    '- DE-BOLD da chay bang script roi, nhung neu thay sot "**`x`**" / "**http...**" -> go bo. GIU bold L3 + nhan template (Senior Engineer/Mid-level Developer, Phan 2.1/2.2, Cau hoi N, Giai phap/Trade-off/Co che, Buoc N). CAM bold ad-hoc.',
    '- Pham vi: prose body bodies/<lang>/{vi,en}.md + prose challenges/*/{vi,en}.md (KE CA challenge Opus vua them). Protect code fence + inline code.',
    '',
    '=== GUARD ===',
    '- KHONG sua/them/bot challenge (Opus stage da lo). KHONG repo clone/cd/.repo/docker/e2e.',
    '',
    '=== VERIFY truoc khi tra ===',
    '- Gate: powershell.exe -NoProfile -File "' + ABS + '/.claude/docs/check-lesson.ps1" -Path "' + ABS + '/' + dir + '" -Json -> KHONG fail MOI (fail "github ref" = pre-existing, bo qua).',
    '- Parser: bodies/<lang>/vi.md da sua: body > 200 ky tu, fence chan, accordion = N panel khop, 0 con "##### 2.1.5."; 0 con "**`" (bold-inline-code); 0 "***" vo.',
    'Tra ve dung schema.',
  ].join('\n')
}

const allResults = []
for (const mod of MODULES) {
  const modDir = COURSE_DIR + '/' + mod
  log('=== Content-fix SD: ' + mod + ' ===')
  phase('Enumerate')
  const en = await agent(
    'Liet ke ten thu muc lesson (contents/* co bodies/) cua ' + modDir + '/contents. Tra ve JSON {lessons:[...]} theo so-prefix.',
    { label: 'enum:' + mod, phase: 'Enumerate', model: 'haiku', schema: ENUM_SCHEMA },
  )
  const lessons = (en && en.lessons) || []
  log(mod + ': ' + lessons.length + ' lessons')

  // per-lesson pipeline: Opus challenge -> Sonnet content. Parallel across lessons, NO barrier between stages.
  const modResults = await pipeline(
    lessons,
    (les) => agent(challengePrompt(modDir + '/contents/' + les, les), { label: 'challenge:' + mod + ':' + les, phase: 'Challenge', model: 'opus' }).then(() => les),
    (les) => agent(contentPrompt(modDir + '/contents/' + les, les), { label: 'content:' + mod + ':' + les, phase: 'Content', model: 'sonnet', schema: CONTENT_SCHEMA }),
  )
  allResults.push({ module: mod, lessons: modResults.filter(Boolean) })

  phase('Gate')
  const g = await agent(
    'Chay gate module: powershell.exe -NoProfile -File "' + ABS + '/.claude/docs/check-lesson.ps1" -Path "' + ABS + '/' + modDir + '" -Json . Parse, moi lesson liet ke fails; phan loai github-ref=pre-existing vs regression MOI. Tra ve text tieng Viet co dau.',
    { label: 'gate:' + mod, phase: 'Gate', model: 'sonnet' },
  )
  allResults[allResults.length - 1].gate = g
}

return {
  course: 'system-design',
  task: 'content-fix (challenge 4-tier + accordion + terminology, no-e2e)',
  modules: MODULES,
  note: 'De-bold chay bang script ngoai (truoc + sau). Report-only, KHONG push. Sau workflow: chay lai de-bold + verify doc lap roi thay duyet push.',
  results: allResults,
}
