export const meta = {
  name: 'apply-fs-m13-m19',
  description: 'APPLY (stage=apply, noE2e) M13-M19: Opus thuc hien de xuat review.md (M13-M18 da du 4-tier -> chu yeu content-fix; M19 them 3 challenge cho du 4-tier) + gate + Opus fix-format. KHONG e2e. Absolute RUNNER. Tuan tu.',
  phases: [
    { title: 'M13 frontend-performance' },
    { title: 'M14 responsive-and-adaptive-rendering' },
    { title: 'M15 interaction-and-accessibility' },
    { title: 'M16 observability-logs-tracing-errors' },
    { title: 'M17 security-end-to-end' },
    { title: 'M18 testing-strategy' },
    { title: 'M19 deploy-and-devops-workflow' },
  ],
}
const RUNNER = 'D:/Repositories/starci-academy-backend/.audits/workflows/audit-fs-module.js'
const MODULES = [
  '13-frontend-performance',
  '14-responsive-and-adaptive-rendering',
  '15-interaction-and-accessibility',
  '16-observability-logs-tracing-errors',
  '17-security-end-to-end',
  '18-testing-strategy',
  '19-deploy-and-devops-workflow',
]
const GUIDANCE = [
  'APPLY de xuat DA DUYET trong review.md cua tung lesson.',
  'M13-M18: challenge DA DU 4 tier (16/16) -> KHONG them tier; chi APPLY content-fix da neu (vd M15/3 modal transform bug, M16/3 strengthen health-probe req, M16/1 otel HTTP-200, M17/0 csrf no-cookie). Da phan DUYET -> nhe.',
  'M19: hien 17/20 -> them 3 challenge con thieu cho du 4-tier moi lesson + content-fix theo review.md. Format V2: outcome Sigma=30 + approach Sigma=70, >=1 critical, # verified, vi/en mirror, callout :::muted, index 0-easy/1-medium/2-hard/3-insane.',
  'noE2e: KHONG chay server/test/e2e.',
].join(' ')
const results = []
for (const mod of MODULES) {
  log('=== APPLY (no-e2e) ' + mod + ' ===')
  const r = await workflow({ scriptPath: RUNNER }, { module: mod, stage: 'apply', noE2e: true, guidance: GUIDANCE })
  results.push({ module: mod, result: r })
}
return { applied: MODULES, stage: 'apply', noE2e: true, results }
