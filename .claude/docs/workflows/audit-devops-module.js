export const meta = {
  name: 'audit-devops-module',
  description: 'Audit 1 module DevOps Mastery 2 GIAI DOAN (mac dinh Sonnet 5; Opus opt-in qua args.opus:true+only cho lesson kho). stage=review (mac dinh): brief + DE XUAT -> review.md -> STOP cho thay duyet. stage=apply (sau duyet): CREDENTIAL GATE (bat buoc dung neu thieu key dung cloud) -> apply review.md + gate -> convergence loop (terraform e2e THAT hoac docker local -> decision -> re-gate). Devops: agnostic-only (KHONG 4-lang), repo off-by-one, e2e = terraform apply/destroy that (co creds) hoac docker run --rm local, accordion-conversion cho lesson con pre-accordion.',
  phases: [
    { title: 'Enumerate', detail: 'liet ke lesson folders', model: 'haiku' },
    { title: 'Review', detail: 'stage=review: brief + DE XUAT -> review.md -> STOP hoi thay', model: 'sonnet' },
    { title: 'Check Credentials', detail: 'stage=apply: gate cloud creds dung module truoc khi vo e2e', model: 'sonnet' },
    { title: 'Apply', detail: 'stage=apply: apply review.md da duyet', model: 'sonnet' },
    { title: 'Gate', detail: 'check-lesson.ps1 -Json (sau apply)', model: 'sonnet' },
    { title: 'Loop', detail: 'Sonnet terraform/docker e2e THAT + doi chieu snippet (.code/.e2e)', model: 'sonnet' },
    { title: 'Decision', detail: 'duyet + fix + decision.md (Opus neu escalate opus:true)', model: 'sonnet' },
    { title: 'References', detail: 'Append module vao .claude/docs/references.md', model: 'haiku' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/audit-devops-module.js", args: { module: "2-aws-foundations", guidance: "..." } })
// args: object {module, guidance?, only?, expand?, stage?, opus?}, JSON-string, hoac chuoi slug tran.
// DEVOPS-specific (khac audit-fs/sd-module.js):
//  - course = 2-devops-mastery
//  - rules = .claude/docs/rules/devops/{domain,contents,challenges,coding}.md
//  - repo name OFF-BY-ONE: devops-mastery-module-<N+1>-<slug> (slot 0 -> module-1)
//  - lang track: LUON agnostic (0-agnostic) - KHONG 4-lang, KHONG codeImplementations
//  - e2e = 2 KIEU: (a) CLOUD (terraform plan/apply/destroy that, CAN credential dung cloud -
//    xem CLOUD_BY_MODULE duoi) - offline (fmt/validate/init) luon chay duoc; (b) LOCAL disposable
//    (docker run --rm, cho linux-fundamentals) - khong can credential.
//  - CREDENTIAL GATE (STAGE=apply, TRUOC Loop): neu module can cloud X ma X CHUA READY (theo
//    .claude/docs/rules/devops/creds/verify-devops-creds.ps1) -> HALT, KHONG chay tiep, bao ro
//    lenh provision-X-lab.ps1 can chay. Day la yeu cau THAY chot (2026-07-10): "check keys roi
//    vo flow, may nao chua co thi bat set bang ps1" - KHONG am tham ha xuong require-creds.
//  - ACCORDION: content devops HIEN TAI dung `##### 2.1.5.x` (pre-accordion, CHUA refactor nhu
//    FS/SD) -> Loop/Decision phai TU CHUYEN sang `::::accordion` khi dung toi lesson do.
function asObj (a) {
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
if (!MOD) throw new Error('args.module required, vd {module:"2-aws-foundations"}')
const GUIDANCE = (ARGS.guidance || '').trim()
const GBLOCK = GUIDANCE ? ('\n>>> CHI DAN RIENG MODULE (uu tien tuyet doi): ' + GUIDANCE + '\n') : ''
const EXPAND = ARGS.expand === true || ARGS.expand === 'true'
const STAGE = (ARGS.stage === 'apply') ? 'apply' : (ARGS.stage === 'curate') ? 'curate' : 'review'
// MODEL TIER (dong bo ca he .claude/docs, xem pipeline.md §Phan vai MODEL):
//   DEFAULT = Sonnet 5 cho MOI viec nang. Haiku giu enumerate/re-gate/refs.
//   Opus = OPT-IN escalation qua args.opus:true (thuong kem only:"<lesson>") khi Sonnet 5 chua dat.
const HEAVY = (ARGS.opus === true || ARGS.opus === 'true') ? 'opus' : 'sonnet'
const HEAVY_TAG = '[' + (HEAVY === 'opus' ? 'Opus 4.8' : 'Sonnet 5') + ']'
const MODDIR = '.mount/data/courses/2-devops-mastery/modules/' + MOD
const REFS = '.claude/docs/references.md'
const RULES = '.claude/docs/rules/devops'
const CREDS_DIR = '.claude/docs/rules/devops/creds'
const MAX_ITER = 3

const ONLY = (ARGS.only || '').trim()
const onlyList = ONLY ? ONLY.split(',').map(function (s) { return s.trim() }) : []

// ---- module -> cloud can credential (prefix cua MOD, KHONG phai lesson) ----
// linux-fundamentals + terraform-fundamentals = offline-only (KHONG can cloud nao).
// Module ngoai 17-module nen-tang+4cloud (vd docker/k8s/CI-CD/observability, slot 17+) mac dinh
// KHONG can cloud (an toan - se khong false-block); guidance co the override qua args.cloud neu sau nay can.
function cloudForModule (mod) {
  if (ARGS.cloud) return String(ARGS.cloud).toLowerCase() // override thu cong khi can
  if (/^(0-linux-fundamentals|1-terraform-fundamentals)$/.test(mod)) return null
  if (/^(2-aws-foundations|3-aws-compute|4-aws-managed-services|5-aws-iam-and-security-deep)$/.test(mod)) return 'aws'
  if (/^(6-do-foundations|7-do-compute|8-do-managed-services)$/.test(mod)) return 'digitalocean'
  if (/^(9-gcp-foundations|10-gcp-compute|11-gcp-managed-services|12-gcp-iam-and-security-deep)$/.test(mod)) return 'gcp'
  if (/^(13-azure-foundations|14-azure-compute|15-azure-managed-services|16-azure-iam-and-security-deep)$/.test(mod)) return 'azure'
  return null // module khac (17+) - chua map, khong bat cloud
}
const REQUIRED_CLOUD = cloudForModule(MOD)
const CLOUD_LABEL = { aws: 'AWS', digitalocean: 'DigitalOcean', gcp: 'GCP', azure: 'Azure' }
const PROVISION_SCRIPT = {
  aws: CREDS_DIR + '/provision-aws-lab.ps1',
  digitalocean: CREDS_DIR + '/set-devops-creds.ps1 (khong co provision script rieng cho DO - dien tay phan DigitalOcean)',
  gcp: CREDS_DIR + '/provision-gcp-lab.ps1',
  azure: CREDS_DIR + '/provision-azure-lab.ps1',
}

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
const CREDS_SCHEMA = {
  type: 'object',
  properties: {
    aws: { type: 'boolean' },
    digitalocean: { type: 'boolean' },
    gcp: { type: 'boolean' },
    azure: { type: 'boolean' },
  },
  required: ['aws', 'digitalocean', 'gcp', 'azure'],
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
log('Module ' + MOD + ': ' + names.length + ' lessons' + (ONLY ? ' (only=' + ONLY + ')' : '') + (REQUIRED_CLOUD ? ' | can cloud: ' + CLOUD_LABEL[REQUIRED_CLOUD] : ' | offline-only, khong can cloud'))

// ====================================================================================
// STAGE 'review' (MAC DINH): Sonnet brief + Opus DE XUAT -> review.md -> STOP cho thay duyet.
// KHONG dung toi cloud/credential o stage nay - an toan chay bat ky luc nao.
// ====================================================================================
if (STAGE === 'review') {
  phase('Review')
  const proposals = await parallel(names.map(function (name) {
    return function () {
      const dir = MODDIR + '/contents/' + name
      return agent(
        'BRIEF (Sonnet) noi dung + challenges lesson DevOps ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). DOC ' + dir + ' (bodies/0-agnostic/{vi,en}.md + challenges/*/{vi,en}.md + submissions) + ' + RULES + '/{domain,contents,challenges}.md.\n' +
        'Tra brief: 1.purpose+phan quan trong (component/service gi cua ' + (REQUIRED_CLOUD ? CLOUD_LABEL[REQUIRED_CLOUD] : 'lab local') + ') 2.flow 2.1.5 make-sense? (may luong, offline vs cloud, cuoi = failure/edge) 3.FORMAT §2.1.5: dang bullet-cu `##### 2.1.5.x` (CAN CHUYEN sang accordion) hay da `::::accordion` roi? 4.challenges hien co (slug+tier+do hop ly voi tac vu infra that) 5.cho con thieu/guong/argument HCL bia.\n' +
        GBLOCK +
        'GHI ' + dir + '/research.md (tag [Sonnet 5], tieng Viet).',
        { label: 'brief:' + name, phase: 'Review', model: 'sonnet' }
      ).then(function () {
        return agent(
          'REVIEW + DE XUAT (Opus) lesson DevOps ' + name + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Doc research.md (brief Sonnet) + ' + dir + ' + ' + RULES + '/{domain,contents,challenges,coding}.md. Tham khao gold cung variant o .claude/docs/references.md neu co.\n' +
          GBLOCK +
          'QUAN TRONG: stage REVIEW = CHI DE XUAT, TUYET DOI KHONG sua/them/xoa file noi dung hay challenge. Chi GHI de xuat ra review.md de thay duyet.\n' +
          'Danh gia theo rule DevOps: 1) Noi dung OK? (purpose, agnostic-only, §2.1.2 table KHONG cot Port cho pure-IaC, §2.1.3 HCL/YAML that + giai thich TUNG argument theo Terraform Registry - KHONG bia flag, repo off-by-one devops-mastery-module-<N+1>) 2) §2.1.5 format: neu con `##### 2.1.5.x` -> DE XUAT chuyen accordion (intro bullet-list + `::::accordion` panel, giu nguyen noi dung tung luong) 3) Challenges DU + DUNG TIER? (easy+medium+hard+insane, tac vu infra that vd least-privilege/state-secret/idempotent/DR, KHONG viet-feature-app nhu FS) 4) Lesson cho nao sai/yeu can sua.\n' +
          'GHI ' + dir + '/review.md (tag ' + HEAVY_TAG + ', tieng Viet) dang:\n' +
          '## Review: ' + name + '\n- **Verdict:** <DUYET LUON | CAN SUA>\n- **Format 2.1.5:** <da accordion | can chuyen accordion>\n- **Noi dung:** <nhan xet + cho sua neu co>\n- **Challenges de xuat:** <THEM: ...(tier+ly do) | BOT: ...(ly do) | GIU NGUYEN>\n- **Sua lesson:** <liet ke cu the | khong>\n' +
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
        'CURATE FIX (Opus) lesson DevOps ' + name + ' — CHI SUA LOI CO HOC, KHONG TEST/E2E. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
        'Doc ' + dir + '/review.md (de xuat da co) + ' + dir + ' (bodies + challenges) + ' + RULES + '/{contents,challenges}.md.\n' +
        GBLOCK +
        'CHI APPLY cac fix CO HOC tu review.md (KHONG can hoi duyet):\n' +
        '- §2.1.5 con `##### 2.1.5.x` -> CHUYEN sang `::::accordion` (intro bullet-list `- **Luong N — \\`route\\`:** <muc tieu>` + moi luong 1 `:::panel{title="<ten, KHONG so>"}` ... `:::`, dong `::::`). GIU NGUYEN noi dung/lenh/output trong tung luong, chi doi FORMAT.\n' +
        '- Challenge req/steps dung heading tu do -> doi `:::muted` callout.\n' +
        '- Score sum sai (score!=100, outcome!=30/approach!=70, thieu critical) -> rescale dung V2.\n' +
        '- Repo URL sai off-by-one (phai devops-mastery-module-<N+1>-<slug>).\n' +
        '- Table §2.1.2 co cot Port cho pure-IaC (khong service/port that) -> bo cot Port.\n' +
        '- Comment code (HCL/YAML/bash) con tieng Viet khong dau -> doi English.\n' +
        'TUYET DOI KHONG: (a) them/bot TIER; (b) chay e2e/terraform/docker; (c) dao xao noi dung da chot.\n' +
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
// STAGE 'apply': CREDENTIAL GATE truoc tien (neu module can cloud) -> Opus apply -> loop.
// ====================================================================================

// ---- Phase: CHECK CREDENTIALS (chi khi module can 1 cloud cu the - HALT neu chua san sang) ----
if (REQUIRED_CLOUD) {
  phase('Check Credentials')
  const creds = await agent(
    'Chay DUNG lenh (Windows -> powershell.exe, KHONG pwsh/bash): powershell -NoProfile -File "' + CREDS_DIR + '/verify-devops-creds.ps1"\n' +
    'Lenh in ra trang thai 4 cloud (AWS/DigitalOcean/GCP/Azure) + dong "=== Summary ===" voi tung dong "READY" hoac "not ready". ' +
    'BAT BUOC goi StructuredOutput {aws, digitalocean, gcp, azure} (true = dong Summary cua cloud do ghi "READY", false = "not ready"). ' +
    'KHONG doc/in gia tri secret nao (script tu no da khong in value, chi can copy dung trang thai READY/not-ready). Loi chay lenh -> sua cach goi roi chay lai, KHONG bo cuoc.',
    { label: 'creds-check:' + MOD, phase: 'Check Credentials', model: 'sonnet', schema: CREDS_SCHEMA }
  )
  const ready = creds && creds[REQUIRED_CLOUD]
  if (!ready) {
    const msg = 'DUNG LAI: module ' + MOD + ' can credential ' + CLOUD_LABEL[REQUIRED_CLOUD] +
      ' nhung CHUA SAN SANG (verify-devops-creds.ps1 bao "not ready"). ' +
      'THAY PHAI chay script sau TRUOC (terminal rieng cua thay), roi dong/mo lai Claude Code session, roi chay lai stage=apply:\n' +
      '  powershell -NoProfile -ExecutionPolicy Bypass -File "' + PROVISION_SCRIPT[REQUIRED_CLOUD] + '"\n' +
      'Xem huong dan day du: ' + CREDS_DIR + '/README.md'
    log(msg)
    return { module: MOD, stage: 'apply', halted: true, reason: 'missing-credentials', cloud: REQUIRED_CLOUD, instructions: msg }
  }
  log('Credential ' + CLOUD_LABEL[REQUIRED_CLOUD] + ': READY. Tiep tuc stage=apply.')
} else {
  log('Module offline-only (khong can cloud) - bo qua Check Credentials.')
}

phase('Apply')
await parallel(names.map(function (name) {
  return function () {
    const dir = MODDIR + '/contents/' + name
    return agent(
      'APPLY (Opus) de xuat DA DUYET trong ' + dir + '/review.md, lesson DevOps ' + name + '. VIET TIENG VIET CO DAU DAY DU (CAM khong dau).\n' +
      GBLOCK +
      'Doc review.md + ' + RULES + '/{contents,challenges}.md -> THUC HIEN dung de xuat da duyet: (a) sua lesson (bodies vi.md Opus viet, en.md mirror); ' +
      '(b) neu review de xuat chuyen accordion §2.1.5 -> CHUYEN NGAY (intro bullet-list + `::::accordion` panel, giu nguyen lenh/output tung luong, GIU NGUYEN §2.1.3 nest `#####`); ' +
      '(c) THEM/BOT challenge (tao/xoa folder challenges/<N>-<slug>-<diff>/ + submissions/0 theo ' + RULES + '/challenges.md: score=100, outcome 30 + approach 70, >=1 critical, # verified, vi/en mirror, callout :::muted KHONG heading tu do); (d) re-index challenge folder lien mach (0-,1-,2-,3-).\n' +
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

// ---- Per-lesson CONVERGENCE LOOP (DevOps: terraform e2e that HOAC docker local disposable) ----
async function auditLesson (name, initialFails) {
  const dir = MODDIR + '/contents/' + name
  const aud = dir

  let fails = initialFails || []
  let pass = EXPAND ? false : (fails.length === 0)
  let iter = 0

  while (!pass && iter < MAX_ITER) {
    iter++

    // Sonnet: loop code<->docs (terraform/docker e2e THAT + doi chieu snippet §2.1.3 <-> .repo/src)
    await agent(
      'LOOP code<->docs (Sonnet) lesson DevOps ' + name + ', vong ' + iter + '/' + MAX_ITER + '. dir=' + dir + '. Doc ' + RULES + '/{contents,coding}.md.\n' +
      'Gate fails hien tai: ' + JSON.stringify(fails) + '.\n' +
      'Ap cho CA luong 2.1.5 VA code-walkthrough §2.1.3 (snippet body phai khop .repo/src, khong bia argument).\n' +
      GBLOCK +
      '1) Lab code (.tf/.yaml/.sh) trong repo thieu gi -> VIET (contract bai + repo gold, LUON agnostic - KHONG 4-lang). Comment English-only, giai thich WHY.\n' +
      '2) E2E DevOps = 2 KIEU tuy module:\n' +
      (REQUIRED_CLOUD
        ? ('   - Module nay can cloud ' + CLOUD_LABEL[REQUIRED_CLOUD] + ' (credential DA VERIFY READY o phase Check Credentials — dung TRUC TIEP, KHONG can hoi lai).\n' +
           '   - Repo off-by-one: .repo/devops-mastery-module-<N+1>-<slug>/<lesson>. Offline flow (`terraform fmt -check`, `terraform validate`, `terraform init`) LUON chay that -> status done.\n' +
           '   - Cloud flow (`terraform plan`, `terraform apply -auto-approve`, `terraform destroy -auto-approve`) -> CHAY THAT (credential da san sang trong env) -> status done. Ghi OUTPUT THAT (resource created/destroyed count).\n' +
           '   - BAT BUOC `terraform destroy` sau khi verify xong (KHONG de resource cloud song sau lesson - ton tien that). Neu apply that bai vi ly do khac credential (vd quota, region, service chua enable) -> ghi status fail + ly do that, KHONG fake done.\n' +
           '   - CAM tuyet doi fake "-done" cho cloud flow neu KHONG that su chay (xem quy tac contents.md §3): status phai dung THAT.\n')
        : ('   - Module offline-only: Linux lab -> `docker run --rm -it` container disposable (Ubuntu lab image theo bai). Terraform-fundamentals -> provider random/local/null, KHONG can cloud, chay that binh thuong.\n')) +
      '   - Chay tung LUONG 2.1.5 theo body, ghi OUTPUT THAT + PORT/lenh thuc te.\n' +
      '   - Ghi proof THEO RULE pipeline.md: MOI LUONG = 1 FILE ' + aud + '/.e2e/agnostic/flow-<N>-<slug>-<status>.md (status: done|fail|require-creds), chua lenh chay + OUTPUT THAT + ket luan.\n' +
      '3) §2.1.5 FORMAT: neu lesson con `##### 2.1.5.x` (chua accordion) -> CHUYEN NGAY sang `::::accordion` (intro bullet-list + panel moi luong, GIU NGUYEN noi dung, GIU NGUYEN §2.1.3 nest `#####`). Ap dong bo vi.md + en.md.\n' +
      '4) Tra danh sach LECH (luong sai HOAC snippet != repo HOAC argument HCL sai Terraform Registry). KHONG tu quyet sua ben nao.\n' +
      '5) GHI ' + aud + '/synced.yaml (marker body<->repo, idempotent). DOI CHIEU VOI .repo LOCAL (KHONG clone GitHub). Check: gitClone (URL off-by-one tro dung folder .repo ton tai) · cdPaths (moi `cd <path>` resolve that) · contentMatch (snippet §2.1.2/§2.1.3 khop code repo, argument dung Registry). Schema: status(ok|mismatch|pending), checkedBy, checkedAt, repo, lessonPath, checks:{gitClone,cdPaths,contentMatch}, log (tieng Viet co dau), issues:[]. status=ok CHI khi ca 3 khop.',
      { label: 'loop:' + name + ':' + iter, phase: 'Loop', model: 'sonnet' }
    )

    // Opus: decision + AP FIX
    await agent(
      'DECISION (Opus) lesson DevOps ' + name + ', vong ' + iter + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Input: research + review (decision.md muc Review) + loop findings + gate fails ' + JSON.stringify(fails) + '. Doc ' + RULES + '/{domain,contents,challenges,coding}.md.\n' +
      'Tham khao gold modules cung variant o .claude/docs/references.md TRUOC khi quyet neu co.\n' +
      GBLOCK +
      'DUYET + AP FIX: (a) challenge criteria/outputs/requirements (score=100, outcome30/approach70, >=1 critical, do tac vu infra that); (b) lech code<->docs -> sua CODE hay DOCS; (c) sai-format -> rewrite; (d) leak/bullet/theory/mirror/interview.\n' +
      '(e) DevOps-specific: agnostic-only (KHONG 4-lang, codeImplementations RONG); repo off-by-one devops-mastery-module-<N+1>; §2.1.2 table KHONG cot Port cho pure-IaC (co Port CHI khi module thuc su co service/port, vd docker/k8s); §2.1.3 argument HCL dung Terraform Registry (KHONG bia flag); §2.1.5 format = accordion (chuyen neu con cu); e2e status: offline=done LUON, cloud=done (da chay that voi credential san sang) HOAC fail (that su loi) - KHONG con require-creds gia neu credential da san sang.\n' +
      '(f) GIT/COMMENT: code .repo Sonnet vua viet/sua -> comment KI chua (English-only)? Neu co thay doi .repo source -> ghi vao decision.md de chu nhiem commit+push (conventional + Co-Authored-By), audit KHONG tu push. KHONG commit secret/state file co secret.\n' +
      '(g) CLEANUP: xac nhan .repo lesson nay KHONG con resource cloud song (da terraform destroy) - neu Loop bao con song, YEU CAU destroy ngay, KHONG de treo qua vong sau (ton tien).\n' +
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
      'Ghi ' + aud + '/claude_submitted.md (TIENG VIET CO DAU DAY DU, CAM khong dau; ghi THANG vao folder contents/' + name + '/): gate PASS sau ' + iter + ' vong, review duyet + .e2e du proof (' + (REQUIRED_CLOUD ? 'cloud flow da chay THAT, khong con require-creds' : 'offline/local, khong can cloud') + '). 1 dong tag [Sonnet 5].\n' +
      'VA: neu ' + aud + '/synced.yaml CHUA co -> tao no: doi chieu body bodies/0-agnostic/{vi,en}.md voi .repo LOCAL (gitClone URL off-by-one ton tai · moi `cd <path>` resolve · snippet khop code + argument dung Registry), ghi status(ok|mismatch|pending)+checks+log+issues.',
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
  'Cap nhat registry gold modules, VIET TIENG VIET CO DAU DAY DU (CAM khong dau). APPEND (KHONG sua block cu) 1 block vao cuoi ' + REFS + ' cho module DevOps "' + MOD + '".\n' +
  'Doc ket qua lesson: ' + JSON.stringify(results.map(function (r) { return { name: r.name, pass: r.pass, iters: r.iters } })) + '.\n' +
  'Lay them bai hoc tu cac decision.md vua ghi trong ' + MODDIR + '/contents/*/decision.md neu can.\n' +
  'Block dung format:\n' +
  '### [DevOps] ' + MOD + ' — cloud: ' + (REQUIRED_CLOUD ? CLOUD_LABEL[REQUIRED_CLOUD] : 'offline-only') + ' — ' + passed + '/' + lessons.length + ' lesson PASS — <ngay>\n' +
  '- Lesson gold (PASS sach, dung lam mau): ...\n' +
  '- Bai hoc rut ra cho audit sau: ...\n' +
  '- Repo lien quan (off-by-one): ...',
  { label: 'refs:' + MOD, phase: 'References', model: 'haiku' }
)

return { module: MOD, passed: passed, total: lessons.length, cloud: REQUIRED_CLOUD, lessons: results }
