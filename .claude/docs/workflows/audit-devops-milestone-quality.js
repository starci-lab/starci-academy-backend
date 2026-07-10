export const meta = {
  name: 'audit-devops-milestone-quality',
  description: 'Dao sau chat luong su pham cho task du an ca nhan (milestone) DevOps Mastery: criteria co neo bang chung quan sat duoc that khong, brief co du de hoc vien lam duoc khong, do kho co hop vi tri trong lo trinh khong, co loi ky thuat/lac hau nao khong. Report-only (KHONG sua file). Khac voi fix-personal-project.js (chi lam co hoc: split/accordion/terminology) - day la lop phan CHAT LUONG.',
  phases: [{ title: 'Quality judge' }],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/audit-devops-milestone-quality.js",
//   args: { taskDirs: [...] } })
// taskDirs = BAT BUOC, enumerate DETERMINISTIC bang Bash truoc (KHONG de LLM tu ls, de sot):
//   find .mount/data/courses/<course>/milestones -mindepth 3 -maxdepth 3 -type d -path "*/tasks/*" | sort
// args.course = optional, chi de ghi vao ten phase/log (khong dung de tu enumerate).
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const COURSE = A.course || '2-devops-mastery'
const taskDirs = Array.isArray(A.taskDirs) ? A.taskDirs.filter(Boolean) : []

log('RECV course=' + COURSE + ' | taskDirs=' + taskDirs.length)
if (!taskDirs.length) {
  log('TU CHOI: thieu args.taskDirs. Enumerate bang Bash (deterministic) roi truyen mang taskDirs vao args. KHONG dung LLM-ls.')
  return { error: 'missing args.taskDirs (enumerate deterministically via Bash, pass as args.taskDirs)', received: A }
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['task', 'verdict', 'criteriaQuality', 'briefClarity', 'levelFit', 'findings'],
  properties: {
    task: { type: 'string' },
    verdict: { type: 'string', enum: ['DUYET', 'CAN_SUA'] },
    criteriaQuality: { type: 'string' },
    briefClarity: { type: 'string' },
    levelFit: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
  },
}

function prompt (dir) {
  return [
    'DAO SAU chat luong su pham (KHONG sua file) task du an ca nhan DevOps: ' + dir + '.',
    'Doc vi.md + en.md. Neu can doi chieu noi dung module lien quan, tham khao .mount/data/courses/' + COURSE + '/modules/ (tim module cung chu de qua ten task/milestone).',
    'Danh gia 4 truc, VIET TIENG VIET CO DAU DAY DU:',
    '1) CRITERIA QUALITY: moi "### outcome"/"### approach" co neo bang chung QUAN SAT DUOC THAT khong (vd "systemctl status show active (running)", "curl tra ve 200", "ps hien PID moi") hay chi ghi chung chung kieu "code chay duoc"/"lam dung yeu cau" (khong do duoc gi). Diem cu the neu criteria mo ho.',
    '2) BRIEF CLARITY: hoc vien doc xong co du thong tin de LAM duoc task nay khong (co thieu buoc, thieu context, gia dinh kien thuc chua day o module truoc khong)? Co mau thuan/loi ky thuat lac hau nao khong (vd nhac toi service/API da bi deprecate).',
    '3) LEVEL FIT: do kho/pham vi co hop voi vi tri task nay trong milestone (task dau vs task cuoi) VA vi tri milestone trong ca lo trinh 20 milestone khong? Co qua don gian (khong xung tam "Mastery") hay qua suc (nhoi qua nhieu concept khong lien quan) khong?',
    '4) Neu phat hien LOI KY THUAT THAT (vd nhac API/resource da deprecate, lenh sai, mau thuan giua cac phan) -> ghi cu the vao findings, day la SUBSTANTIVE can hoi thay truoc khi sua.',
    'Tra ve DUNG schema: {task, verdict:"DUYET"|"CAN_SUA", criteriaQuality:"<nhan xet 1-2 cau>", briefClarity:"<nhan xet 1-2 cau>", levelFit:"<nhan xet 1-2 cau>", findings:["<cu the, rong neu khong co>"]}.',
  ].join('\n')
}

phase('Quality judge')
const results = await parallel(taskDirs.map((dir) => () =>
  agent(prompt(dir), { label: 'judge:' + dir.split('/').slice(-3).join('/'), phase: 'Quality judge', model: 'sonnet', schema: SCHEMA })
))

const clean = results.filter((r) => r && r.verdict === 'DUYET')
const needsFix = results.filter((r) => r && r.verdict === 'CAN_SUA')
log('Xong: ' + clean.length + ' DUYET, ' + needsFix.length + ' CAN_SUA / ' + results.length + ' task.')

return { course: COURSE, total: results.length, duyet: clean.length, canSua: needsFix.length, needsFixDetail: needsFix }
