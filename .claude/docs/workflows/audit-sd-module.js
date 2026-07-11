export const meta = {
  name: 'audit-sd-module',
  description: 'Audit 1 module System Design 2 GIAI DOAN (mac dinh Sonnet 5; Opus opt-in qua args.opus:true+only cho lesson kho). stage=review (mac dinh): brief + DE XUAT -> review.md -> STOP cho thay duyet. stage=apply (sau duyet): apply review.md + gate -> convergence loop (docker-compose e2e -> decision -> re-gate). Iter tung lesson song song. SD: 4-lang/agnostic, repo off-by-one, single docker compose up.',
  phases: [
    { title: 'Enumerate', detail: 'liet ke lesson folders', model: 'haiku' },
    { title: 'Review', detail: 'stage=review: brief + DE XUAT -> review.md -> STOP hoi thay', model: 'sonnet' },
    { title: 'Apply', detail: 'stage=apply: apply review.md da duyet', model: 'sonnet' },
    { title: 'Gate', detail: 'check-lesson.ps1 -Json (sau apply)', model: 'sonnet' },
    { title: 'Loop', detail: 'Sonnet docker-compose e2e + doi chieu snippet (.code/.e2e)', model: 'sonnet' },
    { title: 'Decision', detail: 'duyet + fix + decision.md (Opus neu escalate opus:true)', model: 'sonnet' },
    { title: 'References', detail: 'Append module vao .claude/docs/references.md', model: 'haiku' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/audit-sd-module.js", args: { module: "0-fundamentals-of-system-design", guidance: "..." } })
// args: object {module, guidance?, only?, expand?, stage?}, JSON-string, hoac chuoi slug tran.
// SD-specific (khac audit-fs-module.js):
//  - course = 1-system-design-mastery (KHONG 0-fullstack-mastery)
//  - rules = .claude/docs/rules/system-design/{contents,challenges,coding}.md
//  - repo name OFF-BY-ONE: system-design-mastery-module-<N+1>-<slug> (slot 0 -> module-1)
//  - lang track: 4-lang (typescript/java/csharp/go) default, single-track 0-agnostic cho pure-infra (k8s)
//  - e2e = SINGLE `docker compose up -d --build` (KHONG 4-port host-bind nhu FS); verify curl/CLI/dashboard; cleanup `docker compose down -v`
//  - codeImpl order typescript -> csharp -> go -> java
function asObj(a) {
  if (!a) return {}
  if (typeof a === 'object') return a
  if (typeof a === 'string') {
    const s = a.trim()
    if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) { /* fall through */ } }
    return { module: s }
  }
  return {}
}
const ARGS = asObj(args)
const MOD = (ARGS.module || '').trim().replace(/\/+$/, '')
if (!MOD) throw new Error('args.module required, vd {module:"0-fundamentals-of-system-design"}')
const GUIDANCE = (ARGS.guidance || '').trim()
const GBLOCK = GUIDANCE ? ('\n>>> CHI DAN RIENG MODULE (uu tien tuyet doi): ' + GUIDANCE + '\n') : ''
const EXPAND = ARGS.expand === true || ARGS.expand === 'true'
const STAGE = (ARGS.stage === 'apply') ? 'apply' : (ARGS.stage === 'curate') ? 'curate' : 'review'
// MODEL TIER (dong bo ca he .claude/docs 2026-07-09, xem pipeline.md §Phan vai MODEL):
//   DEFAULT = Sonnet 5 cho MOI viec nang (review/apply/decision/loop/author). Haiku giu enumerate/re-gate/refs.
//   Opus = OPT-IN escalation qua args.opus:true (thuong kem only:"<lesson>") khi Sonnet 5 chua dat 1 lesson kho.
const HEAVY = (ARGS.opus === true || ARGS.opus === 'true') ? 'opus' : 'sonnet'
const HEAVY_TAG = '[' + (HEAVY === 'opus' ? 'Opus 4.8' : 'Sonnet 5') + ']'
const MODDIR = '.mount/data/courses/1-system-design-mastery/modules/' + MOD
const REFS = '.claude/docs/references.md'
const RULES = '.claude/docs/rules/system-design'
const MAX_ITER = 3

const ONLY = (ARGS.only || '').trim()
const onlyList = ONLY ? ONLY.split(',').map(function (s) { return s.trim() }) : []

const ENUM_SCHEMA = {
  type: 'object',
  properties: { lessons: { type: 'array', items: { type: 'string' } } },
  required: ['lessons'],
}
const MODULE_GATE = {
  type: 'object',
  properties: {
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, fails: { type: 'array', items: { type: 'string' } } },
        required: ['name', 'fails'],
      },
    },
  },
  required: ['lessons'],
}
const LESSON_GATE = {
  type: 'object',
  properties: { fails: { type: 'array', items: { type: 'string' } } },
  required: ['fails'],
}

// ---- Phase: ENUMERATE ----
phase('Enumerate')
let names = []
if (onlyList.length >= 1) {
  names = onlyList
} else {
  const en = await agent(
    'LIET KE lesson (KHONG sua file). Chay (Windows -> powershell.exe): ' +
    'powershell -NoProfile -Command "Get-ChildItem -Path \'' + MODDIR + '/contents\' -Directory | Where-Object { Test-Path (Join-Path $_.FullName \'bodies\') } | ForEach-Object { $_.Name }"\n' +
    'BAT BUOC goi StructuredOutput {lessons:[<ten folder>...]}. Loi -> sua cach goi roi chay lai, KHONG bo cuoc.',
    { label: 'enum:' + MOD, phase: 'Enumerate', model: 'haiku', schema: ENUM_SCHEMA }
  )
  names = (en && en.lessons) || []
}
log('Module ' + MOD + ': ' + names.length + ' lessons' + (ONLY ? ' (only=' + ONLY + ')' : ''))

// ====================================================================================
// STAGE 'review' (MAC DINH): Sonnet brief + Opus DE XUAT -> review.md -> STOP cho thay duyet.
// ====================================================================================
if (STAGE === 'review') {
  phase('Review')
  const proposals = await parallel(names.map(function (name) {
    return function () {
      const dir = MODDIR + '/contents/' + name
      return agent(
        'BRIEF (Sonnet) noi dung + challenges lesson SD ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). DOC ' + dir + ' (bodies/*/{vi,en}.md + challenges/*/{vi,en}.md + submissions) + ' + RULES + '/{contents,challenges}.md.\n' +
        'Tra brief: 1.purpose+phan quan trong 2.flow 2.1.5 make-sense (4-6 luong, cuoi = edge/failure)? 3.VARIANT SD (4-lang vs 0-agnostic; generic/flexible/microservices-docker/k8s) 4.challenges hien co (slug+tier+do hop ly; slot<=3 chi easy+medium, slot>=4 full pyramid) 5.cho con thieu/guong.\n' +
        GBLOCK +
        'GHI ' + dir + '/research.md (tag [Sonnet 5], tieng Viet).',
        { label: 'brief:' + name, phase: 'Review', model: 'sonnet' }
      ).then(function () {
        return agent(
          'REVIEW + DE XUAT (Opus) lesson SD ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Doc research.md (brief Sonnet) + ' + dir + ' + ' + RULES + '/{contents,challenges,coding}.md. Tham khao gold cung variant o .claude/docs/references.md.\n' +
          GBLOCK +
          'QUAN TRONG: stage REVIEW = CHI DE XUAT, TUYET DOI KHONG sua/them/xoa file noi dung hay challenge. Chi GHI de xuat ra review.md de thay duyet.\n' +
          'Danh gia theo rule SD: 1) Noi dung OK? (purpose, flow 2.1.5 4-6 luong, theory 2 muc, interview 5-7 cau, mermaid TD, repo off-by-one system-design-mastery-module-<N+1>, table cot Cong/Port, prerequisites 2-bullet, single `docker compose up`, codeImpl order typescript->csharp->go->java KHONG dotnet) 2) Challenges DU + DUNG TIER? (slot<=3 easy+medium; slot>=4 easy/medium/hard/insane theo merit; score=100 outcome30/approach70 >=1 critical) 3) Lesson cho nao sai/yeu can sua.\n' +
          'GHI ' + dir + '/review.md (tag ' + HEAVY_TAG + ', tieng Viet) dang:\n' +
          '## Review: ' + name + '\n- **Verdict:** <DUYET LUON | CAN SUA>\n- **Variant:** <4-lang|agnostic + generic|flexible|microservices-docker|k8s>\n- **Noi dung:** <nhan xet + cho sua neu co>\n- **Challenges de xuat:** <THEM: ...(tier+ly do) | BOT: ...(ly do) | GIU NGUYEN>\n- **Sua lesson:** <liet ke cu the | khong>\n' +
          'TRA VE (text ngan 2-3 dong) tom tat verdict + de xuat de orchestrator gom lai hoi thay.',
          { label: 'review:' + name, phase: 'Review', model: HEAVY }
        ).then(function (txt) { return { name: name, summary: txt } })
      })
    }
  }))
  log('STAGE review xong: da ghi review.md cho ' + proposals.length + ' lesson. CHO THAY DUYET roi chay stage=apply.')
  return { module: MOD, stage: 'review', reviewed: proposals.length, proposals: proposals }
}

// ====================================================================================
// STAGE 'curate' (no-test): chi review noi dung + SUA CHALLENGES/format, apply truc tiep.
// ====================================================================================
if (STAGE === 'curate') {
  phase('Curate')
  await parallel(names.map(function (name) {
    return function () {
      const dir = MODDIR + '/contents/' + name
      return agent(
        'CURATE FIX (Opus) lesson SD ' + name + ' — CHI SUA LOI CO HOC, KHONG TEST/E2E. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
        'Doc ' + dir + '/review.md (de xuat da co) + ' + dir + ' (bodies + challenges) + ' + RULES + '/{contents,challenges}.md. Tham khao gold o .claude/docs/references.md.\n' +
        GBLOCK +
        'CHI APPLY cac fix CO HOC tu review.md (KHONG can hoi duyet):\n' +
        '- §2.1.5 recap "muc tieu" inline (1)(2)(3) -> bullet list, dong bo CA lang + vi/en mirror.\n' +
        '- Challenge req/steps dung `### Muc dich/Rang buoc/Goi y` (V1) -> doi `:::muted` callout (challenges.md).\n' +
        '- Score sum sai (score!=100, outcome!=30/approach!=70, thieu critical) -> rescale dung V2; submission con format V1 -> dua ve V2 (outcomeCriterias 30 + approachCriterias 70 + >=1 critical + # verified).\n' +
        '- Repo URL sai off-by-one (phai system-design-mastery-module-<N+1>-<slug>) / thieu mention .docker / cd khong vao /.docker -> sua.\n' +
        '- codeImpl con entry `dotnet` -> doi `csharp`; order typescript->csharp->go->java.\n' +
        '- Mermaid flowchart LR >3 node -> TD; caption khong italic -> italic; table thieu cot Cong/Port -> them.\n' +
        '- Criteria text lech domain -> sua khop domain (giu score).\n' +
        'TUYET DOI KHONG: (a) them/bot TIER (giu nguyen tier hien co du review co de xuat); (b) chay e2e/test/docker; (c) dao xao noi dung da chot.\n' +
        'GHI ' + dir + '/decision.md (tag ' + HEAVY_TAG + ', tieng Viet) muc "## Curate (co-hoc, no-test)": da sua gi + bo qua de xuat tier nao.',
        { label: 'curate:' + name, phase: 'Curate', model: HEAVY }
      )
    }
  }))
  phase('Gate')
  const gc = await agent(
    'GATE deterministic (KHONG sua file). Chay (Windows -> powershell.exe): powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path "' + MODDIR + '" -Json\n' +
    'BAT BUOC goi StructuredOutput {lessons:[{name,fails}]} copy nguyen van. Loi -> sua cach goi roi chay lai.',
    { label: 'gate:' + MOD, phase: 'Gate', model: 'sonnet', schema: MODULE_GATE }
  )
  const gcl = (gc && gc.lessons) || []
  const gcBad = gcl.filter(function (l) { return l.fails && l.fails.length })
  log('Curate ' + MOD + ' xong: ' + gcBad.length + '/' + gcl.length + ' lesson con fail format (e2e KHONG check vi no-test).')
  return { module: MOD, stage: 'curate', lessons: gcl }
}

// ====================================================================================
// STAGE 'apply' (sau khi thay duyet): Opus apply review.md -> gate -> convergence loop.
// ====================================================================================
phase('Apply')
await parallel(names.map(function (name) {
  return function () {
    const dir = MODDIR + '/contents/' + name
    return agent(
      'APPLY (Opus) de xuat DA DUYET trong ' + dir + '/review.md, lesson SD ' + name + '. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
      GBLOCK +
      'Doc review.md + ' + RULES + '/{contents,challenges}.md -> THUC HIEN dung de xuat da duyet: (a) sua lesson (bodies vi.md Opus viet, en.md mirror); (b) THEM/BOT challenge (tao/xoa folder challenges/<N>-<slug>-<diff>/ + submissions/0 theo ' + RULES + '/challenges.md: score=100, outcome 30 + approach 70, >=1 critical, # verified, vi/en mirror, callout :::muted KHONG ### N.); (c) re-index challenge folder lien mach (0-,1-,2-,3-).\n' +
      'GHI ' + dir + '/decision.md (tag ' + HEAVY_TAG + ', tieng Viet) muc "## Apply" liet ke da lam gi theo review.md.',
      { label: 'apply:' + name, phase: 'Apply', model: HEAVY }
    )
  }
}))

// ---- Phase: GATE ----
phase('Gate')
const GATEDIR = (onlyList.length === 1) ? (MODDIR + '/contents/' + onlyList[0]) : MODDIR
const gate0 = await agent(
  'GATE deterministic (KHONG sua file, KHONG doc tung file). Chay DUNG 1 lenh nay (Windows -> dung powershell.exe, KHONG pwsh, KHONG bash):\n' +
  'powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path "' + GATEDIR + '" -Json\n' +
  'Lenh IN RA JSON dang {lessons:[{name,fails:[...]}]} (fails rong = []). BAT BUOC goi StructuredOutput voi DUNG JSON do (copy nguyen van). Neu lenh loi, sua cach goi powershell roi chay lai — KHONG bo cuoc, KHONG tra loi text.',
  { label: 'gate:' + MOD, phase: 'Gate', model: 'sonnet', schema: MODULE_GATE }
)
let lessons = (gate0 && gate0.lessons) || []
if (onlyList.length === 1) {
  const allFails = lessons.reduce(function (acc, l) { return acc.concat(l.fails || []) }, [])
  lessons = [{ name: onlyList[0], fails: allFails }]
} else if (onlyList.length > 1) {
  lessons = lessons.filter(function (l) { return onlyList.indexOf(l.name) !== -1 })
}
log('Gate: ' + lessons.filter(function (l) { return l.fails.length }).length + '/' + lessons.length + ' lesson co fail sau review')

// ---- Per-lesson CONVERGENCE LOOP (SD: docker-compose e2e) ----
async function auditLesson(name, initialFails) {
  const dir = MODDIR + '/contents/' + name
  const aud = dir

  let fails = initialFails || []
  let pass = EXPAND ? false : (fails.length === 0)
  let iter = 0

  while (!pass && iter < MAX_ITER) {
    iter++

    // Sonnet: loop code<->docs (SD docker-compose e2e + doi chieu snippet §2.1.3 <-> .repo/src)
    await agent(
      'LOOP code<->docs (Sonnet) lesson SD ' + name + ', vong ' + iter + '/' + MAX_ITER + '. dir=' + dir + '. Doc ' + RULES + '/{contents,coding}.md.\n' +
      'Gate fails hien tai: ' + JSON.stringify(fails) + '.\n' +
      'Ap cho CA luong 2.1.5 VA code-walkthrough §2.1.3 (snippet body phai khop .repo/src, khong bia).\n' +
      GBLOCK +
      '1) Code repo thieu lang nao -> VIET (contract bai + repo gold; lang track theo body: 4-lang typescript/java/csharp/go HOAC agnostic). COMMENT CODE KI theo coding.md (JSDoc per-member + inline // gan tung dong giai thich WHY, English-only).\n' +
      '2) E2E SD = DOCKER COMPOSE (KHONG host-bind 4-port nhu FS):\n' +
      '   - Repo off-by-one: .repo/system-design-mastery-module-<N+1>-<slug>/<lesson>. `cd <lesson>/.docker` -> `docker compose up -d --build` (single command). Doi service len (docker compose ps / logs).\n' +
      '   - Verify theo VARIANT: generic/microservices-docker -> curl host-mapped port (PowerShell Invoke-RestMethod, doc port tu compose ports:); flexible -> them CLI tool (vault/etcdctl/mc/kafka-console) hoac dashboard URL reachable; k8s (agnostic) -> kubectl apply + wait + port-forward + curl.\n' +
      '   - Chay tung LUONG 2.1.5 theo body, ghi OUTPUT THAT.\n' +
      '   - Cleanup: `docker compose down -v` sau khi xong lesson (KHONG up/down moi luong — up 1 lan dau, down cuoi).\n' +
      '   - 4-lang: neu repo co per-lang service/stack rieng -> chay tung lang, proof tach .e2e/<lang>/. Module agnostic -> .e2e/agnostic/.\n' +
      '   - FIREWALL: popup da tat (memory). Docker port publish hit qua localhost:<host-port>. Neu lo gap popup -> chap nhan/skip-note, KHONG treo.\n' +
      '   Ghi proof THEO RULE pipeline.md (BAT BUOC, KHONG gop 1 file): MOI LUONG = 1 FILE ' + aud + '/.e2e/<lang>/flow-<N>-<slug>-<status>.md (status: done|fail|require-creds), chua: lenh chay, OUTPUT THAT, PORT/URL thuc te, ket luan. Co the them .e2e/summary.md. NEU lesson co .e2e/proof.md cu -> TACH ra flow-<N>-... roi XOA proof.md.\n' +
      '3) Tra danh sach LECH (luong sai HOAC snippet != repo). KHONG tu quyet sua ben nao.\n' +
      '4) GHI ' + aud + '/synced.yaml (marker body<->repo, idempotent). DOI CHIEU VOI .repo LOCAL (KHONG clone GitHub). Check: gitClone (URL Source off-by-one tro dung folder .repo ton tai) · cdPaths (moi `cd <path>` ke ca /.docker resolve that) · contentMatch (snippet §2.1.2/§2.1.3 khop code repo). Schema: status(ok|mismatch|pending), checkedBy, checkedAt, repo, lessonPath, checks:{gitClone,cdPaths,contentMatch}, log (tieng Viet co dau), issues:[]. status=ok CHI khi ca 3 khop.',
      { label: 'loop:' + name + ':' + iter, phase: 'Loop', model: 'sonnet' }
    )

    // Opus: decision + AP FIX
    await agent(
      'DECISION (Opus) lesson SD ' + name + ', vong ' + iter + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Input: research + review (decision.md muc Review) + loop findings + gate fails ' + JSON.stringify(fails) + '. Doc ' + RULES + '/{contents,challenges,coding}.md.\n' +
      'Tham khao gold modules cung variant o .claude/docs/references.md TRUOC khi quyet.\n' +
      GBLOCK +
      'DUYET + AP FIX: (a) challenge criteria/outputs/requirements (score=100, outcome30/approach70, >=1 critical); (b) lech code<->docs -> sua CODE hay DOCS; (c) sai-format -> rewrite theo gold; (d) leak/bullet/theory/mirror/interview-5-7.\n' +
      '(e) SD-specific: repo off-by-one system-design-mastery-module-<N+1>; §2.1.1 mention .docker + cd vao /.docker; table cot Cong/Port; mermaid TD + caption italic; prerequisites 2-bullet; single `docker compose up -d --build`; cleanup `docker compose down -v` plain; codeImpl order typescript->csharp->go->java KHONG dotnet.\n' +
      '(f) ENV (coding.md): chay out-of-box nho ConfigModule default committed? -> body KHONG mention .env (ngoai tru lesson day env). Code doc env CO default, KHONG hard-code; container bind 0.0.0.0 (Docker).\n' +
      '(g) GIT/COMMENT: code .repo Sonnet vua viet/sua -> comment KI chua? Neu co thay doi .repo source -> ghi vao decision.md de chu nhiem commit+push (conventional + Co-Authored-By), audit KHONG tu push. KHONG commit secret.\n' +
      'APPEND vao ' + aud + '/decision.md (tag ' + HEAVY_TAG + ', tieng Viet) muc "## Decision vong ' + iter + '" — ghi THANG vao folder contents/' + name + '/ (KHONG xoa muc Review).',
      { label: 'decision:' + name + ':' + iter, phase: 'Decision', model: HEAVY }
    )

    const g = await agent(
      'RE-GATE 1 lesson (KHONG sua file). Chay DUNG lenh (Windows -> powershell.exe, KHONG pwsh/bash):\n' +
      'powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path "' + dir + '" -Json\n' +
      'Lenh in JSON {lessons:[{name,fails}]} (1 lesson). BAT BUOC goi StructuredOutput voi {fails: <mang fails cua lesson do, rong = []>}. Neu lenh loi -> sua cach goi powershell roi chay lai, KHONG bo cuoc, KHONG tra text.',
      { label: 'regate:' + name + ':' + iter, phase: 'Gate', model: 'haiku', schema: LESSON_GATE }
    )
    fails = (g && g.fails) || []
    pass = (fails.length === 0)
    log(name + ' vong ' + iter + ': ' + (pass ? 'PASS' : fails.length + ' fails con lai'))
  }

  if (pass) {
    await agent(
      'Ghi ' + aud + '/claude_submitted.md (TIENG VIET CO DAU DAY DU, CAM khong dau; ghi THANG vao folder contents/' + name + '/): gate PASS sau ' + iter + ' vong, review duyet + .e2e du proof. 1 dong tag [Sonnet 5].\n' +
      'VA: neu ' + aud + '/synced.yaml CHUA co -> tao no: doi chieu body bodies/<lang>/{vi,en}.md voi .repo LOCAL (gitClone URL off-by-one ton tai · moi `cd <path>` resolve · snippet khop code), ghi status(ok|mismatch|pending)+checks+log+issues.',
      { label: 'submit:' + name, phase: 'Decision', model: 'haiku' }
    )
  } else {
    log(name + ': CHUA PASS sau ' + MAX_ITER + ' vong -> can Opus/chu nhiem xem tay (fails: ' + JSON.stringify(fails) + ')')
  }
  return { name: name, pass: pass, iters: iter, fails: fails }
}

const results = await parallel(lessons.map(function (l) {
  return function () { return auditLesson(l.name, l.fails) }
}))

const passed = results.filter(function (r) { return r && r.pass }).length
log('Xong: ' + passed + '/' + lessons.length + ' lesson PASS')

// ---- References ----
phase('References')
await agent(
  'Cap nhat registry gold modules, VIET TIENG VIET CO DAU DAY DU (CAM khong dau). APPEND (KHONG sua block cu) 1 block vao cuoi ' + REFS + ' cho module SD "' + MOD + '".\n' +
  'Doc ket qua lesson: ' + JSON.stringify(results.map(function (r) { return { name: r.name, pass: r.pass, iters: r.iters } })) + '.\n' +
  'Lay them bai hoc tu cac decision.md vua ghi trong ' + MODDIR + '/contents/*/decision.md neu can.\n' +
  'Block dung format:\n' +
  '### [SD] ' + MOD + ' — <variant: 4-lang | agnostic + generic|flexible|microservices-docker|k8s> — ' + passed + '/' + lessons.length + ' lesson PASS — <ngay>\n' +
  '- Lesson gold (PASS sach, dung lam mau): ...\n' +
  '- Bai hoc rut ra cho audit sau: ...\n' +
  '- Repo lien quan (off-by-one): ...',
  { label: 'refs:' + MOD, phase: 'References', model: 'haiku' }
)

return { module: MOD, passed: passed, total: lessons.length, lessons: results }
