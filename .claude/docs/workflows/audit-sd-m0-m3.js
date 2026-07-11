export const meta = {
  name: 'audit-sd-m0-m3',
  description: 'Audit (stage=review) tuan tu System Design M0-M3: goi runner audit-sd-module.js cho tung module. Moi module tu parallel theo lesson -> Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Kem guidance rule 4-challenge.',
  phases: [
    { title: 'M0 fundamentals-of-system-design' },
    { title: 'M1 database-fundamentals' },
    { title: 'M2 kubernetes-fundamentals' },
    { title: 'M3 communication-patterns' },
  ],
}

const SD_RUNNER = '.claude/docs/workflows/audit-sd-module.js'

const MODULES = [
  '0-fundamentals-of-system-design',
  '1-database-fundamentals',
  '2-kubernetes-fundamentals',
  '3-communication-patterns',
]

const GUIDANCE = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: lesson thieu tier nao -> DE XUAT them (topic/goc cu the, criteria do co che that, depth production that, KHONG guong/overlap).',
  'Luu y SD: truoc co ruling "giu tier" (2026-06-08) — neu them hard/insane gay guong thi NEU RO trong review.md (de xuat + canh bao) cho thay quyet, dung tu ep.',
  'Van review noi dung body nhu thuong. Day la stage REVIEW: CHI de xuat ra review.md, KHONG sua/tao/xoa file.',
].join(' ')

const results = []
for (const mod of MODULES) {
  log('=== Audit REVIEW System Design ' + mod + ' ===')
  const r = await workflow({ scriptPath: SD_RUNNER }, { module: mod, stage: 'review', guidance: GUIDANCE })
  results.push({ module: mod, result: r })
}

return {
  course: 'system-design',
  stage: 'review',
  modules: MODULES,
  note: 'Da ghi review.md per-lesson cho 4 module SD. CHO THAY DUYET roi chay stage=apply tung module.',
  results,
}
