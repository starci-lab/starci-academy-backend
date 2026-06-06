export const meta = {
  name: 'audit-fs-module',
  description: 'Audit 1 module Fullstack: gate enumerate lessons -> PER-LESSON CONVERGENCE LOOP (brief -> Sonnet code/docs -> Opus fix -> re-gate, lap toi PASS hoac max iter). Iter tung lesson song song.',
  phases: [
    { title: 'Gate', detail: 'check-lesson.ps1 (deterministic, free)', model: 'haiku' },
    { title: 'Brief', detail: 'Haiku research.md per lesson', model: 'haiku' },
    { title: 'Loop', detail: 'Sonnet viet code + test + doi chieu snippet (.code/.e2e)', model: 'sonnet' },
    { title: 'Decision', detail: 'Opus duyet + fix + decision.md', model: 'opus' },
    { title: 'References', detail: 'Append module vao .audits/references.md (de lan sau tot hon)', model: 'haiku' },
  ],
}

// invoke: Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "13-frontend-performance", guidance: "..." } })
// args co the la object {module, guidance?}, JSON-string, hoac chuoi slug tran -> normalize het.
// guidance = chi-dan rieng cho module (vd "FE thuan -> Vite + Sandbox, KHONG Next") chen vao moi phase.
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
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD
const REFS = '.audits/references.md' // registry gold modules (append sau khi PASS, de lan sau tot hon)
const MAX_ITER = 3 // so vong hoi tu toi da moi lesson

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

// ---- Phase 0: GATE — enumerate lessons + initial fails ----
phase('Gate')
// ONLY: chi xu ly 1 (hoac vai) lesson cu the — dung khi them/sua 1 lesson, khong dong cac lesson da xong.
const ONLY = (ARGS.only || '').trim()
const onlyList = ONLY ? ONLY.split(',').map(function (s) { return s.trim() }) : []
// Khi audit DUNG 1 lesson -> gate quet THANG folder lesson do (JSON nho), tranh truong hop
// quet ca module ma 1 lesson fail nang -> JSON qua lon -> gate agent (Haiku) khong copy noi vao StructuredOutput.
const GATEDIR = (onlyList.length === 1) ? (MODDIR + '/contents/' + onlyList[0]) : MODDIR
const gate0 = await agent(
  'GATE deterministic (KHONG sua file, KHONG doc tung file). Chay DUNG 1 lenh nay (Windows -> dung powershell.exe, KHONG pwsh, KHONG bash):\n' +
  'powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "' + GATEDIR + '" -Json\n' +
  'Lenh IN RA JSON dang {lessons:[{name,fails:[...]}]} (fails rong = []). BAT BUOC goi StructuredOutput voi DUNG JSON do (copy nguyen van). Neu lenh loi, sua cach goi powershell roi chay lai — KHONG bo cuoc, KHONG tra loi text.',
  { label: 'gate:' + MOD, phase: 'Gate', model: 'haiku', schema: MODULE_GATE }
)
let lessons = (gate0 && gate0.lessons) || []
if (onlyList.length === 1) {
  // gate da quet thang lesson dir: gom moi fails, ep dung ten lesson (check-lesson co the bao ten folder dir).
  const allFails = lessons.reduce(function (acc, l) { return acc.concat(l.fails || []) }, [])
  lessons = [{ name: onlyList[0], fails: allFails }]
} else if (onlyList.length > 1) {
  lessons = lessons.filter(function (l) { return onlyList.indexOf(l.name) !== -1 })
}
log('Module ' + MOD + ': xu ly ' + lessons.length + ' lessons' + (ONLY ? ' (only=' + ONLY + ')' : '') + ', ' + lessons.filter(function (l) { return l.fails.length }).length + ' co fail ban dau')

// ---- Per-lesson CONVERGENCE LOOP (brief once, then Sonnet->Opus->re-gate lap toi PASS) ----
async function auditLesson(name, initialFails) {
  const dir = MODDIR + '/contents/' + name
  const aud = dir // artifact (research/decision/claude_submitted/.code/.e2e) ghi THANG vao mount, trong tung folder contents/<lesson>/

  // Brief 1 lan (Haiku) -> research.md (TIENG VIET CO DAU)
  await agent(
    'BRIEF lesson cho Opus duyet (Haiku), VIET TIENG VIET CO DAU DAY DU — CAM viet tieng Viet khong dau (vd phai viet "khong/duoc/phai/kiem thu" thanh "khong"... voi dau day du). DOC ' + dir + ' (bodies/*/{vi,en}.md + challenges).\n' +
    'Tra brief: 1.purpose 2.phan quan trong 3.flow 2.1.5 make-sense? 4.loai bai (pure-BE/BE+Playwright/pure-FE) 5.challenges so bo.\n' +
    GBLOCK +
    'GHI ' + aud + '/research.md (entry tag [Haiku 4.5], tieng Viet).',
    { label: 'brief:' + name, phase: 'Brief', model: 'haiku' }
  )

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
      '1) Code repo thieu lang nao -> VIET (contract bai + repo gold), ghi ' + aud + '/.code/.\n' +
      '2) Test luong theo docs + doi chieu tung snippet voi .repo/src. 4-lang PARALLEL.\n' +
      '   PORT: TIM PORT RANH TRUOC ROI MOI ASSIGN (KHONG khoi dong o port mac dinh roi xu ly va cham). Cach (PowerShell): $u=(Get-NetTCPConnection -State Listen -EA SilentlyContinue).LocalPort; chon 4 port dau tien trong day 3000..3100 (hoac random 1000-9999) KHONG nam trong $u -> assign ts/java/net/go. Dat qua env/config (PORT=...), GIU NGUYEN flow logic, chi doi base URL theo port da assign. KHONG fail/skip e2e vi port.\n' +
      '   Ghi proof ' + aud + '/.e2e/ (output that + log + PORT THUC TE da assign moi lang). Bang flow x lang gop 1 file, KHONG tach 4 thu muc.\n' +
      '3) Tra danh sach LECH (luong sai HOAC snippet != repo). KHONG tu quyet sua ben nao.',
      { label: 'loop:' + name + ':' + iter, phase: 'Loop', model: 'sonnet' }
    )

    // Opus: decision + AP FIX (decision.md TIENG VIET, ghi thang vao mount)
    await agent(
      'DECISION (Opus) lesson ' + name + ', vong ' + iter + ', VIET TIENG VIET CO DAU DAY DU (CAM khong dau). Input: research + loop findings + gate fails ' + JSON.stringify(fails) + '.\n' +
      'Tham khao gold modules cung variant o .audits/references.md TRUOC khi quyet.\n' +
      GBLOCK +
      'DUYET + AP FIX: (a) challenge criteria/outputs/requirements; (b) lech code<->docs -> sua CODE hay DOCS; (c) sai-format -> rewrite theo gold; (d) leak/bullet/theory/mirror.\n' +
      'GHI ' + aud + '/decision.md (tag [Opus 4.8], tieng Viet) — ghi THANG vao folder contents/' + name + '/ trong mount.',
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
      'Ghi ' + aud + '/claude_submitted.md (TIENG VIET CO DAU DAY DU, CAM khong dau; ghi THANG vao folder contents/' + name + '/ trong mount): gate PASS sau ' + iter + ' vong, .e2e du proof. 1 dong tag [Sonnet 4.x].',
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
