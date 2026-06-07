export const meta = {
  name: 'audit-fs-module',
  description: 'Audit 1 module Fullstack 2 GIAI DOAN. stage=review (mac dinh): Sonnet brief + Opus DE XUAT -> review.md -> STOP cho thay duyet. stage=apply (sau duyet): Opus apply review.md + gate -> convergence loop (Sonnet code/e2e -> Opus fix -> re-gate). Iter tung lesson song song.',
  phases: [
    { title: 'Enumerate', detail: 'liet ke lesson folders', model: 'haiku' },
    { title: 'Review', detail: 'stage=review: Sonnet brief + Opus DE XUAT (duyet/them-bot challenge/sua lesson) -> review.md -> STOP hoi thay', model: 'opus' },
    { title: 'Apply', detail: 'stage=apply: Opus apply review.md da duyet (them/bot challenge, sua lesson)', model: 'opus' },
    { title: 'Gate', detail: 'check-lesson.ps1 -Json (sau apply)', model: 'sonnet' },
    { title: 'Loop', detail: 'Sonnet viet code + test + doi chieu snippet (.code/.e2e)', model: 'sonnet' },
    { title: 'Decision', detail: 'Opus duyet + fix + decision.md', model: 'opus' },
    { title: 'References', detail: 'Append module vao .audits/references.md', model: 'haiku' },
  ],
}

// invoke: Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "13-frontend-performance", guidance: "..." } })
// args co the la object {module, guidance?, only?, expand?}, JSON-string, hoac chuoi slug tran -> normalize het.
// guidance = chi-dan rieng cho module (vd "FE thuan -> Vite + Sandbox, KHONG Next") chen vao moi phase.
// LUONG (theo ruling thay): REVIEW TREN TRUOC (Sonnet brief + Opus check noi dung+challenges, duyet/curate)
//   -> SAU DO moi vo luong GATE -> per-lesson convergence loop (mechanical: code/e2e/format).
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
if (!MOD) throw new Error('args.module required, vd {module:"13-frontend-performance"}')
const GUIDANCE = (ARGS.guidance || '').trim()
const GBLOCK = GUIDANCE ? ('\n>>> CHI DAN RIENG MODULE (uu tien tuyet doi): ' + GUIDANCE + '\n') : ''
// EXPAND: ep loop chay >=1 vong du gate PASS — dung khi MO RONG noi dung (vd them lang 4-lang/agnostic)
// ma gate khong tu phat hien (gate chi fail format/structure, khong biet "dang le phai co them lang").
const EXPAND = ARGS.expand === true || ARGS.expand === 'true'
// STAGE (ruling thay): audit 2 giai doan, DUNG lai cho thay duyet giua chung.
//   'review' (MAC DINH) = Enumerate + Sonnet brief + Opus DE XUAT -> ghi review.md -> STOP (khong gate/loop). Roi hoi thay.
//   'apply'             = thay DA DUYET -> Opus apply review.md (them/bot challenge, sua lesson) + Gate -> convergence loop.
const STAGE = (ARGS.stage === 'apply') ? 'apply' : (ARGS.stage === 'curate') ? 'curate' : 'review'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD
const REFS = '.audits/references.md' // registry gold modules (append sau khi PASS, de lan sau tot hon)
const MAX_ITER = 3 // so vong hoi tu toi da moi lesson

// ONLY: chi xu ly 1 (hoac vai) lesson cu the — dung khi them/sua 1 lesson, khong dong cac lesson da xong.
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

// ---- Phase: ENUMERATE — liet ke lesson folders TRUOC review (de review chay truoc gate) ----
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
// KHONG sua file noi dung/challenge o stage nay (chi DE XUAT). Thay doc review.md, duyet, roi chay stage=apply.
// ====================================================================================
if (STAGE === 'review') {
  phase('Review')
  const proposals = await parallel(names.map(function (name) {
    return function () {
      const dir = MODDIR + '/contents/' + name
      // Sonnet brief: doc ky noi dung + challenges
      return agent(
        'BRIEF (Sonnet) noi dung + challenges lesson ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). DOC ' + dir + ' (bodies/*/{vi,en}.md + challenges/*/{vi,en}.md + submissions).\n' +
        'Tra brief: 1.purpose+phan quan trong 2.flow 2.1.5 make-sense? 3.loai bai (pure-BE/BE+Playwright/pure-FE) 4.challenges hien co (slug+tier+do hop ly) 5.cho con thieu/guong.\n' +
        GBLOCK +
        'GHI ' + dir + '/research.md (tag [Sonnet 4.x], tieng Viet).',
        { label: 'brief:' + name, phase: 'Review', model: 'sonnet' }
      ).then(function () {
        // Opus DE XUAT (KHONG sua file) -> review.md
        return agent(
          'REVIEW + DE XUAT (Opus) lesson ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Doc research.md (brief Sonnet) + ' + dir + '. Tham khao gold cung variant o .audits/references.md.\n' +
          GBLOCK +
          'QUAN TRONG: stage REVIEW = CHI DE XUAT, TUYET DOI KHONG sua/them/xoa file noi dung hay challenge. Chi GHI de xuat ra review.md de thay duyet.\n' +
          'Danh gia: 1) Noi dung OK chua? (purpose, flow 2.1.5, theory 2 muc, khong sai khai niem) 2) Challenges DU + DUNG TIER chua? (easy/medium/hard/insane theo merit; cho nao guong/thieu) 3) Lesson cho nao sai/yeu can sua.\n' +
          'GHI ' + dir + '/review.md (tag [Opus 4.8], tieng Viet) dang:\n' +
          '## Review: ' + name + '\n- **Verdict:** <DUYET LUON | CAN SUA>\n- **Noi dung:** <nhan xet + cho sua neu co>\n- **Challenges de xuat:** <THEM: ...(tier+ly do) | BOT: ...(ly do) | GIU NGUYEN>\n- **Sua lesson:** <liet ke cu the | khong>\n' +
          'TRA VE (text ngan 2-3 dong) tom tat verdict + de xuat de orchestrator gom lai hoi thay.',
          { label: 'review:' + name, phase: 'Review', model: 'opus' }
        ).then(function (txt) { return { name: name, summary: txt } })
      })
    }
  }))
  // STOP — tra ve cho orchestrator (main loop) doc review.md + hoi thay duyet. KHONG gate/loop.
  log('STAGE review xong: da ghi review.md cho ' + proposals.length + ' lesson. CHO THAY DUYET roi chay stage=apply.')
  return { module: MOD, stage: 'review', reviewed: proposals.length, proposals: proposals }
}

// ====================================================================================
// STAGE 'curate' (ruling thay: 4 luong da chot -> KHONG TEST/e2e): chi review noi dung
// + SUA CHALLENGES neu can, apply TRUC TIEP (khong approval gate, khong convergence loop e2e).
// Dung cho module da chot noi dung, chi can nghiem thu + curate challenge.
// ====================================================================================
if (STAGE === 'curate') {
  phase('Curate')
  // Lean: review.md (de xuat) + research.md DA CO san tu stage review -> KHONG brief lai, Opus apply thang.
  // Ruling thay: GIU 2-TIER (easy+medium), KHONG them hard/insane; chi sua LOI CO HOC; KHONG test/e2e.
  await parallel(names.map(function (name) {
    return function () {
      const dir = MODDIR + '/contents/' + name
      return agent(
        'CURATE FIX (Opus) lesson ' + name + ' — CHI SUA LOI CO HOC, GIU 2-TIER, KHONG TEST/E2E. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
        'Doc ' + dir + '/review.md (de xuat da co) + ' + dir + ' (bodies + challenges). Tham khao gold o .audits/references.md.\n' +
        GBLOCK +
        'CHI APPLY cac fix CO HOC tu review.md (KHONG can hoi duyet):\n' +
        '- §2.1.5 liet ke "3 luong/muc tieu" LAP 2 lan -> bo 1 block, dong bo CA 4 lang + vi/en mirror.\n' +
        '- Challenge req/steps dung `### Muc dich/Rang buoc/Goi y/Purpose/Hints/Steps` (V1) -> doi `:::muted` callout (rule §9.3).\n' +
        '- Score sum sai (vd requirements/criteria != 100, outcome!=30/approach!=70) -> rescale dung; submission con format V1 -> dua ve V2 (outcomeCriterias 30 + approachCriterias 70 + >=1 critical + # verified).\n' +
        '- Criteria text lech domain (vd noi "counter" nhung bai dung "content") -> sua text khop domain (giu score).\n' +
        '- Loi cu the khac trong review.md: header/label sai, JSON demo lech challenge, repo intro sai lang (Go bcrypt vo nghia), envelope body<->challenge lech, id mau sai format, mock thieu state-note, submission thieu #type/githubUrl, message tieng Viet trong code -> sua theo review.md.\n' +
        'TUYET DOI KHONG: (a) them/bot TIER (giu nguyen easy+medium, KHONG gen hard/insane du review co de xuat); (b) chay e2e/test/server; (c) dao xao noi dung da chot.\n' +
        'GHI ' + dir + '/decision.md (tag [Opus 4.8], tieng Viet) muc "## Curate (co-hoc, no-test, giu 2-tier)": da sua gi + bo qua de xuat tier nao.',
        { label: 'curate:' + name, phase: 'Curate', model: 'opus' }
      )
    }
  }))
  // Gate verify format sau khi sua (KHONG e2e loop) — chi bao fail format de biet con gi
  phase('Gate')
  const gc = await agent(
    'GATE deterministic (KHONG sua file). Chay (Windows -> powershell.exe): powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "' + MODDIR + '" -Json\n' +
    'BAT BUOC goi StructuredOutput {lessons:[{name,fails}]} copy nguyen van. Loi -> sua cach goi roi chay lai.',
    { label: 'gate:' + MOD, phase: 'Gate', model: 'sonnet', schema: MODULE_GATE }
  )
  const gcl = (gc && gc.lessons) || []
  const gcBad = gcl.filter(function (l) { return l.fails && l.fails.length })
  log('Curate ' + MOD + ' xong: ' + gcBad.length + '/' + gcl.length + ' lesson con fail format (e2e KHONG check vi no-test).')
  return { module: MOD, stage: 'curate', lessons: gcl }
}

// ====================================================================================
// STAGE 'apply' (sau khi thay duyet): Opus apply de xuat trong review.md (them/bot challenge, sua lesson)
// roi moi vo luong gate -> convergence loop.
// ====================================================================================
phase('Apply')
await parallel(names.map(function (name) {
  return function () {
    const dir = MODDIR + '/contents/' + name
    return agent(
      'APPLY (Opus) de xuat DA DUYET trong ' + dir + '/review.md, lesson ' + name + '. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
      GBLOCK +
      'Doc review.md -> THUC HIEN dung de xuat da duyet: (a) sua lesson (bodies vi.md Opus viet, en.md mirror); (b) THEM/BOT challenge (tao/xoa folder challenges/<N>-<slug>-<diff>/ + submissions/0 theo rule .audits/rules/fullstack/challenges.md: outcome 30 + approach 70, >=1 critical, # verified, vi/en mirror, callout :::muted KHONG ### N.); (c) re-index challenge folder lien mach (0-,1-,2-,3-).\n' +
      'GHI ' + dir + '/decision.md (tag [Opus 4.8], tieng Viet) muc "## Apply" liet ke da lam gi theo review.md.',
      { label: 'apply:' + name, phase: 'Apply', model: 'opus' }
    )
  }
}))

// ---- Phase: GATE — sau apply, enumerate fails de vo luong convergence ----
phase('Gate')
// Khi audit DUNG 1 lesson -> gate quet THANG folder lesson do (JSON nho).
const GATEDIR = (onlyList.length === 1) ? (MODDIR + '/contents/' + onlyList[0]) : MODDIR
const gate0 = await agent(
  'GATE deterministic (KHONG sua file, KHONG doc tung file). Chay DUNG 1 lenh nay (Windows -> dung powershell.exe, KHONG pwsh, KHONG bash):\n' +
  'powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "' + GATEDIR + '" -Json\n' +
  'Lenh IN RA JSON dang {lessons:[{name,fails:[...]}]} (fails rong = []). BAT BUOC goi StructuredOutput voi DUNG JSON do (copy nguyen van). Neu lenh loi, sua cach goi powershell roi chay lai — KHONG bo cuoc, KHONG tra loi text.',
  // Sonnet (not Haiku): module-wide gate JSON gets large when many lessons fail (scaffold+e2e),
  // and Haiku unreliably copies a big payload into StructuredOutput (fails after nudges). Sonnet is robust.
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

// ---- Per-lesson CONVERGENCE LOOP (review da xong o tren; day chi lo mechanical: code/e2e/format) ----
async function auditLesson(name, initialFails) {
  const dir = MODDIR + '/contents/' + name
  const aud = dir // artifact ghi THANG vao mount, trong tung folder contents/<lesson>/

  let fails = initialFails || []
  // EXPAND mode: ep chay it nhat 1 vong du gate da PASS (de them lang/mo rong noi dung gate khong phat hien)
  let pass = EXPAND ? false : (fails.length === 0)
  let iter = 0

  // VONG HOI TU: lap toi khi gate PASS hoac het MAX_ITER
  while (!pass && iter < MAX_ITER) {
    iter++

    // Sonnet: loop code<->docs (viet code thieu + test luong + doi chieu snippet §2.1.3 <-> .repo/src)
    await agent(
      'LOOP code<->docs (Sonnet) lesson ' + name + ', vong ' + iter + '/' + MAX_ITER + '. dir=' + dir + '.\n' +
      'Gate fails hien tai: ' + JSON.stringify(fails) + '.\n' +
      'Ap cho CA luong 2.1.5 VA code-walkthrough §2.1.3 (snippet body phai khop .repo/src, khong bia).\n' +
      GBLOCK +
      '1) Code repo thieu lang nao -> VIET (contract bai + repo gold), ghi ' + aud + '/.code/. COMMENT CODE KI theo coding.md §A7 (JSDoc per-member + inline // gan tung dong giai thich WHY, English-only).\n' +
      '1b) DOC HYGIENE (deterministic): `bash .audits/fix-doc-paths.sh ' + dir + '` (sua link source) -> `python3 .audits/fix-cd-format.py ' + dir + '` (cd clone->lesson, run->cd backend/<lang>). CD CONVENTION §A2: (i) XOA block SCAFFOLD from-scratch (npm/yarn create / create-vite / create-react-app) — dung repo clone san; (ii) block CLONE chi `git clone` + `cd <repo>/<lesson>` (KHONG kem npm install); (iii) FE run-block dung cd tuong minh: `cd backend` cai+chay BE -> `cd ..` -> `cd frontend` cai+chay FE (moi lenh npm co cd dung truoc). Gate (check-lesson.ps1) bat scaffold + run-block thieu cd-first.\n' +
      '2) Test luong theo docs + doi chieu tung snippet voi .repo/src. 4-lang PARALLEL.\n' +
      '   PORT: TIM PORT RANH TRUOC ROI MOI ASSIGN (KHONG khoi dong o port mac dinh roi xu ly va cham). Cach (PowerShell): $u=(Get-NetTCPConnection -State Listen -EA SilentlyContinue).LocalPort; chon 4 port dau tien trong day 3000..3100 (hoac random 1000-9999) KHONG nam trong $u -> assign ts/java/net/go. Dat qua env/config (PORT=...), GIU NGUYEN flow logic, chi doi base URL theo port da assign. KHONG fail/skip e2e vi port.\n' +
      '   BIND 127.0.0.1 BAT BUOC (KHONG 0.0.0.0/::): server nghe 0.0.0.0 -> Windows Firewall bat popup "Allow access" -> TREO agent cho click. Loopback thi firewall KHONG quan. NestJS/Node (ke ca Socket.IO gateway): app.listen(port, "127.0.0.1"); Java: -Dserver.address=127.0.0.1; C#: ASPNETCORE_URLS=http://127.0.0.1:<p>; Go: ListenAndServe("127.0.0.1:<p>")/gin r.Run("127.0.0.1:<p>").\n' +
      '   QUAN TRONG (Go & binary compiled hay popup nhat): env/flag KHONG override duoc bind cua Go -> PHAI SUA SOURCE truoc khi chay. TRUOC moi lang: grep source xem con bind tran ":<port>" / "0.0.0.0" khong (Go main.go ListenAndServe/r.Run; NestJS main.ts listen; C# Program.cs; Java application.yml) -> SUA het sang 127.0.0.1, build/run lai. Sau khi server len: Get-NetTCPConnection -State Listen | check LocalAddress = 127.0.0.1 (KHONG 0.0.0.0/::) TRUOC khi curl/Playwright. Neu lo popup -> da bind sai, sua source roi chay lai.\n' +
      '   TOI UU BUILD (cho le, BE 4-lang hay cham): (a) SUA bind source 127.0.0.1 + patch khac TRUOC khi build LAN DAU -> build 1 lan, KHONG build->patch->rebuild 2 vong. (b) Cache deps GLOBAL co san, KHONG xoa giua lesson (~/.m2 Maven, ~/.nuget dotnet, GOMODCACHE Go, npm cache) -> lesson dau tai, cac lesson sau hit cache. (c) Build nhanh: Maven `-q -DskipTests` (+ `-o` offline sau khi .m2 da co); dotnet `build --no-restore` sau lan restore dau; npm `ci --prefer-offline` HOAC BO QUA install neu node_modules co + lock khong doi; Go build cache tu dong. (d) Docker infra (Redis/MailHog/...) dung CHUNG: `up -d` 1 lan dau module, `down -v` cuoi cung — KHONG up/down moi lesson. (e) 4 lang chay PARALLEL (da co), dung serialize.\n' +
      '   Ghi proof THEO RULE pipeline.md (BAT BUOC, KHONG gop 1 file): TACH theo lang -> .e2e/<lang>/ (4-lang: typescript|java|csharp|go; module agnostic single-track -> .e2e/agnostic/). MOI LUONG = 1 FILE rieng ' + aud + '/.e2e/<lang>/flow-<N>-<slug>-<status>.md (status: done|fail|require-creds), chua: lenh chay, OUTPUT THAT, PORT THUC TE da assign, ket luan. Co the them .e2e/summary.md (bang flow x lang) de nhin nhanh, NHUNG per-lang per-flow la BAT BUOC. NEU lesson dang co .e2e/proof.md (format cu gop 1 file) -> TACH no ra cac file flow-<N>-... roi XOA proof.md cu.\n' +
      '3) Tra danh sach LECH (luong sai HOAC snippet != repo). KHONG tu quyet sua ben nao.\n' +
      '4) GHI ' + aud + '/synced.yaml (marker dong nhat body<->repo, per-lesson, idempotent — xem pipeline.md). DOI CHIEU VOI .repo LOCAL (KHONG clone GitHub vi repo hay ahead chua push). Check: gitClone (URL Source/clone body tro dung folder .repo ton tai) · cdPaths (MOI `cd <path>` trong block cach-chay resolve that trong repo) · contentMatch (snippet §2.1.2/§2.1.3 khop code repo). Schema: status(ok|mismatch|pending), checkedBy, checkedAt, repo, lessonPath, checks:{gitClone,cdPaths,contentMatch}, log (tieng Viet co dau), issues:[]. status=ok CHI khi ca 3 khop; lech -> mismatch + issues ghi RO path/file thieu.',
      { label: 'loop:' + name + ':' + iter, phase: 'Loop', model: 'sonnet' }
    )

    // Opus: decision + AP FIX (decision.md TIENG VIET, ghi thang vao mount)
    await agent(
      'DECISION (Opus) lesson ' + name + ', vong ' + iter + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Input: research + review (decision.md muc Review) + loop findings + gate fails ' + JSON.stringify(fails) + '.\n' +
      'Tham khao gold modules cung variant o .audits/references.md TRUOC khi quyet.\n' +
      GBLOCK +
      'DUYET + AP FIX: (a) challenge criteria/outputs/requirements; (b) lech code<->docs -> sua CODE hay DOCS; (c) sai-format -> rewrite theo gold; (d) leak/bullet/theory/mirror.\n' +
      '(e) ENV (coding.md §A9): chay out-of-box nho default committed? CO -> body KHONG mention .env (xoa disclosure thua); KHONG (can secret that: OAuth/payment) -> tro .env.local + ship .env.example placeholder. Code 4 lang doc env CO default, KHONG hard-code literal.\n' +
      '(f) CD (coding.md §A2): block CLONE ket thuc `cd <repo>/<lesson>`; block RUN mo bang `cd backend/<lang>` (3-step vao->cai->chay); block docker chay tu thu muc lesson. CAM block scaffold from-scratch.\n' +
      '(g) GIT/COMMENT: code .repo Sonnet vua viet/sua -> da comment KI chua (§A7)? Neu co thay doi .repo source -> ghi vao decision.md de chu nhiem commit+push (message conventional + Co-Authored-By), audit KHONG tu push (tranh push nham). KHONG commit secret (.env.local/.oauth.env).\n' +
      'APPEND vao ' + aud + '/decision.md (tag [Opus 4.8], tieng Viet) muc "## Decision vong ' + iter + '" — ghi THANG vao folder contents/' + name + '/ trong mount (KHONG xoa muc Review o tren).',
      { label: 'decision:' + name + ':' + iter, phase: 'Decision', model: 'opus' }
    )

    // Re-gate CHI lesson nay -> cap nhat fails, quyet dinh lap tiep hay dung
    const g = await agent(
      'RE-GATE 1 lesson (KHONG sua file). Chay DUNG lenh (Windows -> powershell.exe, KHONG pwsh/bash):\n' +
      'powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "' + dir + '" -Json\n' +
      'Lenh in JSON {lessons:[{name,fails}]} (1 lesson). BAT BUOC goi StructuredOutput voi {fails: <mang fails cua lesson do, rong = []>}. Neu lenh loi -> sua cach goi powershell roi chay lai, KHONG bo cuoc, KHONG tra text.',
      { label: 'regate:' + name + ':' + iter, phase: 'Gate', model: 'haiku', schema: LESSON_GATE }
    )
    fails = (g && g.fails) || []
    pass = (fails.length === 0)
    log(name + ' vong ' + iter + ': ' + (pass ? 'PASS' : fails.length + ' fails con lai'))
  }

  if (pass) {
    await agent(
      'Ghi ' + aud + '/claude_submitted.md (TIENG VIET CO DAU DAY DU, CAM khong dau; ghi THANG vao folder contents/' + name + '/ trong mount): gate PASS sau ' + iter + ' vong, review duyet + .e2e du proof. 1 dong tag [Sonnet 4.x].\n' +
      'VA: neu ' + aud + '/synced.yaml CHUA co (lesson PASS khong qua loop) -> tao no: doi chieu body bodies/<lang>/{vi,en}.md voi .repo LOCAL (gitClone URL ton tai · moi `cd <path>` resolve · snippet khop code), ghi status(ok|mismatch|pending)+checks+log+issues theo schema pipeline.md.',
      { label: 'submit:' + name, phase: 'Decision', model: 'haiku' }
    )
  } else {
    log(name + ': CHUA PASS sau ' + MAX_ITER + ' vong -> can Opus/chu nhiem xem tay (fails: ' + JSON.stringify(fails) + ')')
  }
  return { name: name, pass: pass, iters: iter, fails: fails }
}

// Iter TUNG lesson (song song) — moi lesson chay vong hoi tu rieng
const results = await parallel(lessons.map(function (l) {
  return function () { return auditLesson(l.name, l.fails) }
}))

const passed = results.filter(function (r) { return r && r.pass }).length
log('Xong: ' + passed + '/' + lessons.length + ' lesson PASS')

// ---- References: append module vao registry gold (de lan sau lam tot hon) ----
phase('References')
await agent(
  'Cap nhat registry gold modules, VIET TIENG VIET CO DAU DAY DU (CAM khong dau). APPEND (KHONG sua block cu) 1 block vao cuoi ' + REFS + ' cho module "' + MOD + '".\n' +
  'Doc ket qua lesson: ' + JSON.stringify(results.map(function (r) { return { name: r.name, pass: r.pass, iters: r.iters } })) + '.\n' +
  'Lay them bai hoc tu cac decision.md vua ghi trong ' + MODDIR + '/contents/*/decision.md neu can.\n' +
  'Block dung format:\n' +
  '### ' + MOD + ' — <variant: FE-Vite | BE-4lang | BE+Playwright> — ' + passed + '/' + lessons.length + ' lesson PASS — <ngay>\n' +
  '- Lesson gold (PASS sach, dung lam mau): ...\n' +
  '- Bai hoc rut ra cho audit sau: ...\n' +
  '- Repo lien quan: ...',
  { label: 'refs:' + MOD, phase: 'References', model: 'haiku' }
)

return { module: MOD, passed: passed, total: lessons.length, lessons: results }
