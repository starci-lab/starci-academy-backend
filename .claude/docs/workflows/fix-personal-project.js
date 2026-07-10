export const meta = {
  name: 'fix-personal-project',
  description: 'Chuan hoa TASK du an ca nhan (milestone): SPLIT agnostic-multi-lang -> 4 brief per-lang (ts/java/csharp/go), ACCORDION khoi "Cac buoc", TERMINOLOGY L1/L3 (de-bold da chay script). review = de xuat KHONG ghi; apply = Opus split+author + Sonnet accordion/L1-L3 + gate. Report-only, human-in-loop.',
  phases: [
    { title: 'Enumerate' },
    { title: 'Review' },
    { title: 'Apply' },
    { title: 'Gate' },
  ],
}

// ---- config (HARDCODE; dung absolute cho nested workflow path) ----
const REPO = 'D:/Repositories/starci-academy-backend'
// GOTCHA: harness co the truyen `args` duoi dang JSON-STRING (khong phai object) -> args.course=undefined ->
// roi ve default (chay nham ca khoa). LUON normalize: parse neu la string.
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const COURSE = A.course || '1-system-design-mastery' // 0-fullstack | 1-system-design | 2-devops
const STAGE = A.stage || 'enumerate'                 // enumerate | review | apply
const BASE = '.mount/data/courses/' + COURSE + '/milestones'
const RULE = '.audits/rules/terminology-bold.md'
const GATE = REPO + '/.audits/check-task.mjs'
// gold: task da 4-brief dung chuan (shape dich)
const GOLD = '.mount/data/courses/0-fullstack-mastery/milestones/0-project-foundation/tasks/0-clean-architecture-and-health/vi.md'
// milestone-set: mac dinh tat ca; truyen args.milestones=[...] de gioi han
const MILESTONES = (Array.isArray(A.milestones) && A.milestones.length) ? A.milestones : null

// DIAGNOSTIC + SAFETY: args phai toi noi. Neu apply ma KHONG gioi han milestones -> TU CHOI (tranh ghi ca khoa).
log('RECV args=' + JSON.stringify(A) + ' | COURSE=' + COURSE + ' | STAGE=' + STAGE + ' | MILESTONES=' + JSON.stringify(MILESTONES))
if (STAGE === 'apply' && !MILESTONES) {
  log('TU CHOI: stage=apply BAT BUOC truyen args.milestones (khong ghi ca khoa). Dung lai.')
  return { error: 'apply requires explicit args.milestones', received: A }
}
if (STAGE === 'probe') {
  return { received: A, COURSE, STAGE, MILESTONES }
}

const TASKS_SCHEMA = { type: 'object', additionalProperties: false, required: ['tasks'], properties: { tasks: { type: 'array', items: { type: 'string' } } } }
const CLASS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['task', 'klass', 'langsInBody', 'note'],
  properties: {
    task: { type: 'string' },
    klass: { type: 'string', enum: ['needs-split', 'already-4brief', 'agnostic-1lang-skip'] },
    langsInBody: { type: 'array', items: { type: 'string' } },
    note: { type: 'string' },
  },
}
const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['task', 'plan', 'langsToAuthor', 'accordionSteps'],
  properties: {
    task: { type: 'string' }, plan: { type: 'string' },
    langsToAuthor: { type: 'array', items: { type: 'string' } },
    accordionSteps: { type: 'integer' },
  },
}
const APPLY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['task', 'split', 'accordion', 'terminology', 'verify'],
  properties: {
    task: { type: 'string' }, split: { type: 'string' }, accordion: { type: 'string' }, terminology: { type: 'string' },
    verify: { type: 'string', enum: ['ok', 'issues'] },
  },
}

function classifyPrompt (dir) {
  return [
    'Doc ' + dir + '/vi.md. Day la TASK du an ca nhan (schema: "# criterias" -> "## N" -> "### lang/body/outcome/approach").',
    'Phan loai task nay:',
    '- "needs-split": chi 1 brief (## 0) lang=agnostic NHUNG body co code >=2 ngon ngu (vd package.json + go.work + pom.xml). -> CAN tach 4 brief.',
    '- "already-4brief": da co ## 0/1/2/3 lang typescript/java/csharp/go, moi brief 1 lang. -> OK, bo qua.',
    '- "agnostic-1lang-skip": 1 brief agnostic nhung body KHONG cram da-lang (FE/design thuan prose hoac 1 stack). -> de yen.',
    'Tra {task, klass, langsInBody:[ngon ngu thay trong body], note}.',
  ].join('\n')
}

function reviewPrompt (dir) {
  return [
    'REVIEW (KHONG GHI FILE) task du an ca nhan: ' + dir + '. Muc tieu: ke hoach chuan hoa, thay duyet truoc khi apply.',
    'Doc ' + dir + '/vi.md + en.md. Gold shape (4-brief per-lang): ' + GOLD + '.',
    '',
    '1) SPLIT: body agnostic dang nhoi nhieu lang -> se tach thanh 4 brief: ## 0 typescript / ## 1 java / ## 2 csharp / ## 3 go.',
    '   Voi MOI lang, body chi giu code cua lang do (giu nguyen prose chung). Lang nao body agnostic phu MONG (khong du code chay) -> ghi vao langsToAuthor (se can Opus author them).',
    '   Outcome/approach: copy rubric tu brief 0 cho ca 4, chi sua ten manifest theo lang (package.json/go.mod/pom.xml/.csproj). GIU nguyen so tieu chi #### N.',
    '2) ACCORDION: dem so "Buoc N" trong khoi "Cac buoc (theo thu tu)" -> accordionSteps. (Moi buoc se thanh 1 :::panel.)',
    '',
    'Tra {task, plan:"<2-4 cau ke hoach>", langsToAuthor:[...], accordionSteps:N}. KHONG sua file.',
  ].join('\n')
}

function applyPrompt (dir, noSplit) {
  return [
    'APPLY chuan hoa task du an ca nhan: ' + dir + '. Sua CA vi.md VA en.md. VIET TIENG VIET DU DAU (vi.md).',
    'Gold shape: ' + GOLD + '. Doc ' + RULE + ' cho terminology.',
    'Rang buoc parser (BAT BUOC): brief index lien tuc tu ## 0; GIU so tieu chi #### N; moi brief co du ### lang/body/outcome/approach.',
    '',
    noSplit
      ? [
        '=== 0) *** TUYET DOI KHONG SPLIT, KHONG DOI LANG, KHONG DOI SO BRIEF *** (milestone nay = FE-track) ===',
        'GIU NGUYEN Y HET: so brief, gia tri ### lang (KE CA "agnostic" — agnostic HOP LE cho task FE, parser+FE chap nhan), outcome/approach, so tieu chi. CHI lam (2) accordion + (3) terminology. KHONG tao them brief, KHONG bia port/lang, KHONG doi agnostic->typescript.',
      ].join('\n')
      : [
        '=== 0) TU XAC DINH co SPLIT hay khong (DOC FILE TRUOC) ===',
        'Doc vi.md:',
        '- Neu DA co "## 0/1/2/3" voi lang typescript/java/csharp/go (4-brief per-lang) -> *** KHONG SPLIT ***: GIU NGUYEN so brief + lang + outcome/approach; chi lam (2) accordion + (3) terminology cho TUNG brief.',
        '- Neu chi 1 brief "## 0 / lang=agnostic" ma body cram >=2 backend manifest THAT (vd package.json + go.work + pom.xml + .csproj cung luc, kieu task monorepo/scaffold) -> SPLIT thanh 4 brief per-lang (## 0 ts/## 1 java/## 2 csharp/## 3 go), prose chung giu nguyen, chi fence code khac; outcome/approach copy rubric brief 0 + doi ten manifest; en.md mirror.',
        '- *** KHONG SPLIT chi vi co 1 fence backend (vd 1 file api.ts) hay vi frontend tsx/mdx ***. Frontend tsx la CHUNG, KHONG phai ly do split. Task FE-only (toan tsx/css/mdx, khong co backend manifest) -> GIU 1 brief, GIU lang nguyen (ke ca agnostic).',
      ].join('\n'),
    '',
    '=== 2) ACCORDION chuoi "Buoc N" (lam cho MOI brief) ===',
    'KHOI CAC BUOC = chuoi lien tiep cac doan "**Buoc N — <ten>.** ...", thuong ngay sau callout ":::muted" co chu',
    '  "Cac buoc..." (vd "Cac buoc (lam theo thu tu)" / "Cac buoc (theo thu tu)"; EN "Steps (in order)"). XAC DINH chuoi nay',
    '  bang chinh cac header "**Buoc N —**", BAT DAU tu Buoc 1, KET THUC truoc callout ":::muted" KE TIEP (vd "Giai phap"/"Kiem tra").',
    'GIU nguyen callout ":::muted Cac buoc... :::" o tren. Ngay SAU no: mo "::::accordion".',
    'Moi "**Buoc N — <ten>.** <noi dung + code fence>" -> ":::panel{title=\"Buoc N — <ten>\"}" ... noi dung buoc (CA code fence) GIU NGUYEN ... ":::".',
    '*** QUAN TRONG: BO han dong bold "**Buoc N — <ten>.**" o DAU panel (no DA thanh title). Body panel BAT DAU thang bang cau mo ta SAU dau cham. KHONG de title lap 2 lan (header + bold). ***',
    'Sau buoc cuoi: dong khoi bang "::::" (4 dau boc 3 dau). EN: title="Step N — <name>" (cung bo bold "**Step N — ...**" trong body).',
    'GIU PHANG (khong accordion): Muc tieu, Giai phap, Kiem tra va moi callout :::muted khac. Neu brief khong co chuoi "**Buoc N**" thi bo qua (2).',
    '',
    '=== 3) TERMINOLOGY L1/L3 (de-bold da chay script truoc) ===',
    '- L1 doi thuong con tieng Anh -> dich Viet, KHONG bold. L3 jargon chua bold -> them **bold** (lan dau).',
    '- GIU: L2 EN nen tang plain (lifecycle/request/container/queue/"source code" giu English), L4 code trong `backtick`, nhan template (Muc tieu/Cac buoc/Kiem tra/Buoc N/Giai phap/Trade-off/Co che). CAM bold ad-hoc / quanh code.',
    '',
    '=== VERIFY ===',
    'Sau khi ghi: brief index lien tuc; moi brief body 1 backend-lang (frontend tsx/mdx duoc phep o task fullstack); accordion can ::::/:::; 0 con "**`"; vi/en mirror brief-count+lang. Tra verify="ok" neu dat.',
    'Tra {task, split, accordion, terminology, verify}.',
  ].join('\n')
}

// ---------- run ----------
// TASK LIST = DETERMINISTIC. KHONG dung LLM-ls (haiku hay sot -> chi tra 1 task). BAT BUOC truyen A.taskDirs
// (relative path day du tu repo root), enumerate bang Bash NGOAI workflow (skill §pipeline). 1 agent enum/ls = bug.
const taskDirs = Array.isArray(A.taskDirs) ? A.taskDirs.filter(Boolean) : []
phase('Enumerate')
log('taskDirs nhan tu args: ' + taskDirs.length + ' task' + (MILESTONES ? ' | milestones=' + JSON.stringify(MILESTONES) : ''))
if (!taskDirs.length) {
  log('TU CHOI: thieu A.taskDirs. Enumerate bang Bash (ls tasks) roi truyen mang taskDirs vao args. KHONG dung LLM-ls.')
  return { error: 'missing A.taskDirs (enumerate deterministically via Bash, pass as args.taskDirs)', received: A }
}

if (STAGE === 'review') {
  phase('Review')
  const reviews = await parallel(taskDirs.map((d) => () =>
    agent(reviewPrompt(d), { label: 'review:' + d.split('/').pop().split('-')[0], phase: 'Review', model: 'opus', schema: REVIEW_SCHEMA })))
  return { course: COURSE, stage: 'review', tasks: taskDirs.length, reviews: reviews.filter(Boolean) }
}

if (STAGE === 'apply') {
  // de-bold script chay NGOAI workflow (skill §debold) truoc khi goi apply; day lo split(neu cram)+accordion+L1/L3.
  // Apply cho MOI task; agent TU DOC file de quyet dinh split-hay-khong (khong phu thuoc classify flaky).
  const noSplit = A.noSplit === true // milestone FE-track: cam split + doi lang
  phase('Apply')
  const applied = await parallel(taskDirs.map((d) => () =>
    agent(applyPrompt(d, noSplit), { label: 'apply:' + d.split('/').slice(-3, -2)[0].split('-')[0] + '/' + d.split('/').pop().split('-')[0], phase: 'Apply', model: 'opus', schema: APPLY_SCHEMA })))
  // KHONG gate trong workflow: operator verify DOC LAP bang node .audits/check-task.mjs + check-directive-render.mjs
  // (agent gate hay tu-tay implement lai gate -> phi token + bao PASS sai). Gate that = chay script ngoai.
  return { course: COURSE, stage: 'apply', tasks: taskDirs.length, applied: applied.filter(Boolean) }
}

return { course: COURSE, stage: STAGE, note: 'stage khong hop le (review|apply); enumerate lam bang Bash' }
