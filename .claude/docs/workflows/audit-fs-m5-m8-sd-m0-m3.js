export const meta = {
  name: 'audit-fs-m5-m8-sd-m0-m3',
  description: 'Audit (stage=review) tuan tu: Fullstack M5-M8 (runner audit-fs-module.js) roi System Design M0-M3 (runner audit-sd-module.js). Moi module tu parallel theo lesson -> Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Chay tuan tu de nhe rate-limit.',
  phases: [
    { title: 'FS M5 form-mastery-rhf-zod' },
    { title: 'FS M6 client-state-zustand-jotai' },
    { title: 'FS M7 react-reactivity-and-effects' },
    { title: 'FS M8 websocket-realtime-communication' },
    { title: 'SD M0 fundamentals-of-system-design' },
    { title: 'SD M1 database-fundamentals' },
    { title: 'SD M2 kubernetes-fundamentals' },
    { title: 'SD M3 communication-patterns' },
  ],
}

const FS_RUNNER = '.claude/docs/workflows/audit-fs-module.js'
const SD_RUNNER = '.claude/docs/workflows/audit-sd-module.js'

const FS_MODULES = [
  '5-form-mastery-rhf-zod',
  '6-client-state-zustand-jotai',
  '7-react-reactivity-and-effects',
  '8-websocket-realtime-communication',
]
const SD_MODULES = [
  '0-fundamentals-of-system-design',
  '1-database-fundamentals',
  '2-kubernetes-fundamentals',
  '3-communication-patterns',
]

const GUIDANCE_4CH = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: lesson thieu tier nao -> DE XUAT them (topic/goc cu the, criteria do co che that, depth production that, KHONG guong/overlap).',
  'Van review noi dung body nhu thuong. Day la stage REVIEW: CHI de xuat ra review.md, KHONG sua/tao/xoa file.',
].join(' ')

// SD da co ruling cu "giu tier" (2026-06-08) co the mau thuan rule 4-challenge moi ->
// neu lesson SD khong hop them tier, ghi RO ly do trong review.md de thay reconcile khi duyet.
const GUIDANCE_SD = GUIDANCE_4CH + ' Luu y SD: truoc co ruling "giu tier" — neu them hard/insane gay guong thi NEU RO trong review.md (de xuat + canh bao) cho thay quyet, dung tu ep.'

const results = []

for (const mod of FS_MODULES) {
  log('=== Audit REVIEW Fullstack ' + mod + ' ===')
  const r = await workflow({ scriptPath: FS_RUNNER }, { module: mod, stage: 'review', guidance: GUIDANCE_4CH })
  results.push({ course: 'fullstack', module: mod, result: r })
}

for (const mod of SD_MODULES) {
  log('=== Audit REVIEW System Design ' + mod + ' ===')
  const r = await workflow({ scriptPath: SD_RUNNER }, { module: mod, stage: 'review', guidance: GUIDANCE_SD })
  results.push({ course: 'system-design', module: mod, result: r })
}

return {
  stage: 'review',
  fullstack: FS_MODULES,
  systemDesign: SD_MODULES,
  note: 'Da ghi review.md per-lesson cho 8 module. CHO THAY DUYET roi chay stage=apply tung module.',
  results,
}
