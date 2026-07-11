export const meta = {
  name: 'finish-fs-m13-m19',
  description: 'HOAN THIEN M13-M19 mot mach (unattended): review M19 -> apply M19 (+3 challenge) -> de-bold script -> refactor M13-M19 (accordion+terminology Sonnet) -> gate -> tu commit+push module SACH len gitrefs. M13-M18 da du 4-tier nen chi refactor (content-fix nho de sau). Absolute path, hardcode (khong args).',
  phases: [
    { title: 'Review M19' },
    { title: 'Apply M19' },
    { title: 'De-bold' },
    { title: 'Refactor' },
    { title: 'Gate+Push' },
  ],
}

const ROOT = 'D:/Repositories/starci-academy-backend'
const RUNNER = ROOT + '/.claude/docs/workflows/audit-fs-module.js'
const GATE = ROOT + '/.claude/docs/check-lesson.ps1'
const BASE = '.mount/data/courses/0-fullstack-mastery/modules'
const RULE = '.claude/docs/rules/terminology-bold.md'
const GOLD = BASE + '/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript/vi.md'

const MODULES = [
  '13-frontend-performance', '14-responsive-and-adaptive-rendering', '15-interaction-and-accessibility',
  '16-observability-logs-tracing-errors', '17-security-end-to-end', '18-testing-strategy', '19-deploy-and-devops-workflow',
]
const M19 = '19-deploy-and-devops-workflow'

const LESSONS_SCHEMA = { type: 'object', additionalProperties: false, required: ['lessons'], properties: { lessons: { type: 'array', items: { type: 'string' } } } }
const RES_SCHEMA = { type: 'object', additionalProperties: false, required: ['lesson', 'accordion', 'terminology', 'verify'], properties: { lesson: { type: 'string' }, accordion: { type: 'string' }, terminology: { type: 'string' }, verify: { type: 'string', enum: ['ok', 'issues'] } } }
const GATE_SCHEMA = { type: 'object', additionalProperties: false, required: ['module', 'regression', 'clean'], properties: { module: { type: 'string' }, regression: { type: 'array', items: { type: 'string' } }, clean: { type: 'boolean' } } }

// ---- Phase 1: review M19 (5 lesson) ----
phase('Review M19')
await workflow({ scriptPath: RUNNER }, {
  module: M19, stage: 'review',
  guidance: 'RULE 4-challenge: moi lesson du 4 tier easy+medium+hard+insane. M19 hien 17/20 -> DE XUAT them 3 tier con thieu (topic cu the, criteria do co che that, depth production). Phan loai dung (deploy/devops). CHI de xuat review.md, KHONG sua file.',
})

// ---- Phase 2: apply M19 (+3 challenge + content-fix) ----
phase('Apply M19')
await workflow({ scriptPath: RUNNER }, {
  module: M19, stage: 'apply', noE2e: true,
  guidance: 'APPLY review.md M19: them 3 challenge cho du 4-tier moi lesson (format V2: outcome Sigma=30+approach Sigma=70, >=1 critical, # verified, vi/en mirror, callout :::muted, index 0-easy/1-medium/2-hard/3-insane) + content-fix. noE2e: KHONG chay server/e2e.',
})

// ---- Phase 3: de-bold script (covers M19 new challenges + any residue) ----
phase('De-bold')
await agent(
  'Chay de-bold script (go ** quanh inline-code/URL) cho M13-M19. Viet file ' + ROOT + '/.claude/docs/workflows/_db_tmp.mjs noi dung:\n' +
  'import fs from "node:fs";import path from "node:path";const files=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".md"))files.push(p)}};for(const r of process.argv.slice(2))walk(r);let tf=0,th=0;for(const f of files){const s=fs.readFileSync(f,"utf8");const parts=s.split(/(```[\\s\\S]*?```)/g);let h=0;const o=parts.map(g=>g.startsWith("```")?g:g.replace(/\\*\\*(`[^`]+`)\\*\\*/g,(_,x)=>{h++;return x}).replace(/\\*\\*(https?:\\/\\/[^\\s*]+)\\*\\*/g,(_,x)=>{h++;return x})).join("");if(h>0){fs.writeFileSync(f,o);tf++;th+=h}}console.log(`de-bold: ${th} chops in ${tf} files`)\n' +
  'Roi chay: node "' + ROOT + '/.claude/docs/workflows/_db_tmp.mjs" ' + MODULES.map((m) => '"' + ROOT + '/' + BASE + '/' + m + '"').join(' ') + '\n' +
  'Xoa file tmp sau khi xong. Tra ve so chops.',
  { label: 'debold:m13-m19', phase: 'De-bold', model: 'haiku' },
)

// ---- Phase 4: refactor M13-M19 (accordion + terminology, parallel Sonnet) ----
phase('Refactor')
const lists = await parallel(MODULES.map((m) => () =>
  agent('ls -1 "' + BASE + '/' + m + '/contents" — chi ten folder lesson. Tra {lessons:[...]}.',
    { label: 'enum:' + m.split('-')[0], phase: 'Refactor', model: 'haiku', schema: LESSONS_SCHEMA })))
const tasks = []
MODULES.forEach((m, i) => { ((lists[i] && lists[i].lessons) || []).forEach((l) => tasks.push({ mod: m, lesson: l })) })
log('Refactor M13-M19: ' + tasks.length + ' lesson')
await parallel(tasks.map((t) => () => {
  const dir = BASE + '/' + t.mod + '/contents/' + t.lesson
  return agent([
    'Refactor 1 lesson FS: ' + dir + '. VIET TIENG VIET DU DAU. 2 viec, KHONG dao xao section khac.',
    'DE-BOLD inline-code DA XONG (script). Chi xac nhan.',
    '1) ACCORDION §2.1.5: trong MOI bodies/<lang>/{vi,en}.md, CHI section "#### 2.1.5": da ::::accordion -> SKIP; con "##### 2.1.5.N" -> gop intro 1 list "- **Luong N — `route`:** muc tieu" (EN Flow) + thay heading bang "::::accordion" (4 dau) + moi luong ":::panel{title=\"<ten khong so>\"}" (3 dau) ... noi dung GIU NGUYEN ... ":::"; dong "::::". GIU section khac. So panel = so luong.',
    'GOLD: ' + GOLD + '.',
    '2) TERMINOLOGY: DOC ' + RULE + '. L1 doi thuong->dich Viet khong bold; L3 jargon chua bold-> **bold** lan-dau; GIU L2 plain (source code giu English), L4 `backtick`, nhan template; CAM bold ad-hoc/quanh code. Protect code fence. Prose body + challenges.',
    'VERIFY: grep 0 "**`"; §2.1.5 = 1 accordion + du panel; fence chan. verify="ok" neu dat.',
  ].join('\n'), { label: 'fast:' + t.mod.split('-')[0] + ':' + t.lesson, phase: 'Refactor', model: 'sonnet', schema: RES_SCHEMA })
}))

// ---- Phase 5: gate each module, then commit+push CLEAN modules ----
phase('Gate+Push')
const gates = await parallel(MODULES.map((m) => () =>
  agent('Gate module ' + m + ': chay powershell.exe -NoProfile -File "' + GATE + '" -Path "' + ROOT + '/' + BASE + '/' + m + '" -Json. Parse JSON. regression = moi fail KHONG phai "github ref ... KHONG khop folder .repo" (github-ref = pre-existing, BO QUA). clean=true neu regression rong. Tra {module, regression:[...], clean}.',
    { label: 'gate:' + m.split('-')[0], phase: 'Gate+Push', model: 'sonnet', schema: GATE_SCHEMA })))
const clean = gates.filter(Boolean).filter((g) => g.clean).map((g) => g.module)
const dirty = gates.filter(Boolean).filter((g) => !g.clean)
log('Gate: ' + clean.length + '/' + MODULES.length + ' module sach. Dirty: ' + JSON.stringify(dirty))

if (clean.length > 0) {
  const paths = clean.map((m) => 'courses/0-fullstack-mastery/modules/' + m).join(' ')
  await agent(
    'Commit + push cac module FS SACH len gitrefs. Chay TUNG lenh (git -C de KHONG doi cwd):\n' +
    'git -C "' + ROOT + '/.mount/data" add ' + paths + '\n' +
    'git -C "' + ROOT + '/.mount/data" commit -m "content(fs-m13-m19): accordion + terminology + 4-challenge (M19) [unattended]\\n\\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"\n' +
    'GIT_TERMINAL_PROMPT=0 git -C "' + ROOT + '/.mount/data" fetch origin main; neu behind thi rebase; roi GIT_TERMINAL_PROMPT=0 git -C "' + ROOT + '/.mount/data" push origin main\n' +
    'Tra ve commit hash + ket qua push. CHI push cac module: ' + clean.join(', ') + ' (cac module dirty thi BO QUA, de lai cho thay xem).',
    { label: 'push:clean', phase: 'Gate+Push', model: 'sonnet' },
  )
}

return { modules: MODULES, cleanPushed: clean, dirty: dirty.map((d) => ({ module: d.module, regression: d.regression })) }
