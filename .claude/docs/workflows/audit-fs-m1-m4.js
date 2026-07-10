export const meta = {
  name: 'audit-fs-m1-m4',
  description: 'Audit (stage=review) lan luot M1-M4 khoa Fullstack: goi runner audit-fs-module.js cho tung module. Moi module tu parallel theo lesson -> Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Kem guidance rule 4-challenge.',
  phases: [
    { title: 'M1 database-integration-and-caching' },
    { title: 'M2 rest-api-design-and-documentation' },
    { title: 'M3 authentication-and-authorization' },
    { title: 'M4 server-state-with-tanstack-query' },
  ],
}

const MODULES = [
  '1-database-integration-and-caching',
  '2-rest-api-design-and-documentation',
  '3-authentication-and-authorization',
  '4-server-state-with-tanstack-query',
]

const GUIDANCE = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: neu lesson thieu tier nao -> DE XUAT them (vd them hard+insane): neu ten topic/goc cu the, criteria do co che that, depth production that (KHONG build-exercise/overlap/edge guong; topic mong thi nang depth/doi goc chu KHONG bo tier).',
  'Van review noi dung body nhu thuong (purpose, flow 2.1.5, theory 2 muc, sai khai niem). Day la stage REVIEW: CHI de xuat ra review.md, KHONG sua/tao/xoa file.',
].join(' ')

const RUNNER = '.audits/workflows/audit-fs-module.js'

const results = []
for (const mod of MODULES) {
  log('=== Audit REVIEW module ' + mod + ' ===')
  const r = await workflow(
    { scriptPath: RUNNER },
    { module: mod, stage: 'review', guidance: GUIDANCE },
  )
  results.push({ module: mod, result: r })
}

return {
  audited: MODULES,
  stage: 'review',
  note: 'Moi module da ghi review.md per-lesson. CHO THAY DUYET roi chay stage=apply tung module.',
  results,
}
