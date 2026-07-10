export const meta = {
  name: 'audit-fs-m13-m22',
  description: 'Audit (stage=review) lan luot M13-M22 Fullstack: goi runner audit-fs-module.js cho tung module. Per-lesson Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Kem guidance rule 4-challenge.',
  phases: [
    { title: 'M13 frontend-performance' },
    { title: 'M14 responsive-and-adaptive-rendering' },
    { title: 'M15 interaction-and-accessibility' },
    { title: 'M16 observability-logs-tracing-errors' },
    { title: 'M17 security-end-to-end' },
    { title: 'M18 testing-strategy' },
    { title: 'M19 deploy-and-devops-workflow' },
    { title: 'M20 ai-llm-integration' },
    { title: 'M21 graphql-api-design' },
    { title: 'M22 payment-integration' },
  ],
}

// M13+M14 da review xong (8 review.md) o run truoc; chi con M15-M22.
const MODULES = [
  '15-interaction-and-accessibility',
  '16-observability-logs-tracing-errors',
  '17-security-end-to-end',
  '18-testing-strategy',
  '19-deploy-and-devops-workflow',
  '20-ai-llm-integration',
  '21-graphql-api-design',
  '22-payment-integration',
]

const GUIDANCE = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: thieu tier nao -> DE XUAT them (topic/goc cu the, criteria do co che that, depth production that; KHONG guong; topic mong thi nang depth/doi goc chu KHONG bo tier).',
  'Phan loai loai bai dung (pure-FE Vite cho perf/responsive/a11y; BE/BE+Playwright cho observability/security/testing/deploy/ai-llm/graphql/payment). Payment (M22) co the require-creds (SePay/PayOS/PayPal/Stripe) -> ghi RO neu challenge can cred. Review noi dung body nhu thuong. Day la stage REVIEW: CHI de xuat review.md, KHONG sua file.',
].join(' ')

// ABSOLUTE path: nested workflow() resolve theo cwd; cwd co the la .mount/data sau git ops -> dung absolute cho chac.
const RUNNER = 'D:/Repositories/starci-academy-backend/.audits/workflows/audit-fs-module.js'
const results = []
for (const mod of MODULES) {
  log('=== Audit REVIEW module ' + mod + ' ===')
  const r = await workflow({ scriptPath: RUNNER }, { module: mod, stage: 'review', guidance: GUIDANCE })
  results.push({ module: mod, result: r })
}
return { audited: MODULES, stage: 'review', note: 'review.md per-lesson da ghi. CHO THAY DUYET roi apply.', results }
