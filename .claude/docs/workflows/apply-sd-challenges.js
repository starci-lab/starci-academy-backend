export const meta = {
  name: 'apply-sd-challenges',
  description: 'Apply 4-tier challenge expansion cho SD (theo review.md da duyet): them hard+insane cho lesson thieu, KHONG docker e2e (challenge la spec, body da audit). Guard: KHONG dung body/repo-ref/cd (blocker repo = bao nham, da verify GitHub). Default scope = M0 pilot; truyen args.modules de mo rong.',
  phases: [
    { title: 'Apply challenges' },
    { title: 'Gate' },
  ],
}

const COURSE_DIR = '.mount/data/courses/1-system-design-mastery/modules'
const RULES = '.audits/rules/system-design'

// Default: M0 pilot. Override bang args.modules = ["1-database-fundamentals", ...]
const MODULES = (args && Array.isArray(args.modules) && args.modules.length)
  ? args.modules
  : ['0-fundamentals-of-system-design']

const fs = null // no fs in workflow; agents do file IO via their tools

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lesson', 'tiersAdded', 'slugs', 'gate', 'notes'],
  properties: {
    lesson: { type: 'string' },
    tiersAdded: { type: 'string', description: 'tier da them (vd "hard+insane" hoac "none - da du 4")' },
    slugs: { type: 'string', description: 'slug folder challenge sau khi re-index (0-..-easy,1-..-medium,2-..-hard,3-..-insane)' },
    gate: { type: 'string', enum: ['pass', 'fail'] },
    notes: { type: 'string', description: 'tieng Viet co dau: lam gi, overlap xu ly sao, gate fail thi vi sao' },
  },
}

function applyPrompt (modDir, les) {
  const dir = modDir + '/contents/' + les
  return [
    'Ban APPLY mo rong challenge 4-tier cho 1 lesson System Design: ' + dir + '. VIET TIENG VIET DU DAU (cam khong dau); criteria trong submissions = English-only.',
    '',
    'NHIEM VU DUY NHAT: dam bao lesson co DU 4 challenge = dung 1 moi tier easy+medium+hard+insane, theo de xuat da duyet trong ' + dir + '/review.md.',
    '1. Doc ' + dir + '/review.md (de xuat tier + topic cu the) + ' + dir + '/challenges/* (tier hien co) + ' + RULES + '/challenges.md + .audits/rules-lean.md. Tham khao gold .audits/references.md.',
    '2. Xac dinh tier con THIEU (thuong hard + insane). Tao folder challenge cho tung tier thieu: challenges/<N>-<slug>-<tier>/{vi,en}.md + submissions/0/{vi,en}.md.',
    '   - Theo DUNG topic/goc trong review.md. Neu review canh bao OVERLAP module sau (vd Saga<->Communication, CDC<->Kafka) -> doi goc cho khoi trung (ghi ro trong notes).',
    '   - Format V2 (BAT BUOC): # score=100; requirements/steps/outputs/prerequisites item-major (## N -> ### langs -> #### M -> ##### lang), body sub = callout :::muted (KHONG ### N.); # verified; vi/en mirror; KHONG # references/# submissions inline.',
    '   - submissions/0/en.md: # type/title/description/score(100) + # outcomeCriterias (Sigma ### score = 30) + # approachCriterias (Sigma = 70, >=1 critical:true =40). Criteria English-only, neu Kiem gi/Bang chung quan sat/Fail neu. vi.md chi type/title/description.',
    '   - lang bucket khop body lesson (4-lang typescript/java/csharp/go, hoac agnostic).',
    '3. RE-INDEX lien mach toan bo challenges/ theo tier order: 0-<slug>-easy, 1-<slug>-medium, 2-<slug>-hard, 3-<slug>-insane (git mv / doi ten folder; cap nhat # sortIndex neu co).',
    '',
    'GUARD (TUYET DOI):',
    '- KHONG sua bodies/ (noi dung lesson da audit). KHONG sua repo clone URL / cd path / code-context / .repo. Cac "blocker repo" trong review.md la BAO NHAM (da verify body tro repo THAT tren GitHub) -> BO QUA, dung dung.',
    '- KHONG chay docker / e2e / server. Challenge la spec cham diem, khong execute.',
    '- Neu lesson DA du 4 tier roi -> tiersAdded="none", chi verify gate, KHONG tao thua.',
    '',
    'VERIFY truoc khi tra: chay gate "powershell.exe -NoProfile -File D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1 -Path ' + modDir.replace(/\//g, '/') + ' -Json" -> lesson nay phai PASS phan challenge (score=100, Sigma30+Sigma70, >=1 critical, no ###N, verified, parity vi/en). Neu fail -> sua lai cho den khi pass.',
    'Tra ve dung schema.',
  ].join('\n')
}

const allResults = []
for (const mod of MODULES) {
  const modDir = COURSE_DIR + '/' + mod
  phase('Apply challenges')
  log('=== Apply SD challenges: module ' + mod + ' ===')
  // Enumerate lessons via an agent (workflow has no fs).
  const enum0 = await agent(
    'Liet ke ten cac thu muc lesson (contents/*) cua module SD ' + modDir + '/contents. Tra ve JSON {lessons:[ten-folder,...]} dung thu tu so-prefix.',
    { label: 'enum:' + mod, phase: 'Apply challenges', model: 'haiku', schema: { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } } },
  )
  const lessons = (enum0 && enum0.lessons) || []
  log(mod + ': ' + lessons.length + ' lessons')

  const modResults = await parallel(lessons.map((les) => () =>
    agent(applyPrompt(modDir, les), { label: 'apply:' + mod + ':' + les, phase: 'Apply challenges', model: 'opus', schema: SCHEMA }),
  ))
  allResults.push({ module: mod, lessons: modResults.filter(Boolean) })

  phase('Gate')
  const g = await agent(
    'Chay gate module SD: powershell.exe -NoProfile -File "D:/Repositories/starci-academy-backend/.audits/check-lesson.ps1" -Path "D:/Repositories/starci-academy-backend/' + modDir + '" -Json . Parse JSON, voi MOI lesson liet ke fails. Phan loai: "github ref ... KHONG khop .repo" = pre-existing/bo qua; fail khac = can sua. Tra ve text tieng Viet co dau: bang lesson x (pass | fails).',
    { label: 'gate:' + mod, phase: 'Gate', model: 'sonnet' },
  )
  allResults[allResults.length - 1].gate = g
}

return {
  course: 'system-design',
  stage: 'apply-challenges-only',
  modules: MODULES,
  note: 'Da them tier thieu theo review.md (KHONG docker e2e, KHONG dung body/repo-ref). CHO THAY DUYET chat luong roi push + fan module sau.',
  results: allResults,
}
