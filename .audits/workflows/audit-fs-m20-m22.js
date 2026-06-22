export const meta = {
  name: 'audit-fs-m20-m22',
  description: 'Review (stage=review) M20-M22 FS (ai-llm, graphql, payment). Hardcode + absolute RUNNER. Opus DE XUAT -> review.md -> STOP cho thay duyet. Tuan tu tung module.',
  phases: [
    { title: 'M20 ai-llm-integration' },
    { title: 'M21 graphql-api-design' },
    { title: 'M22 payment-integration' },
  ],
}
const RUNNER = 'D:/Repositories/starci-academy-backend/.audits/workflows/audit-fs-module.js'
const MODULES = ['20-ai-llm-integration', '21-graphql-api-design', '22-payment-integration']
const GUIDANCE = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 tier easy+medium+hard+insane. M20-M22 hien moi 2 tier/lesson (8/16) -> DE XUAT them hard+insane cho TUNG lesson: topic cu the, criteria do co che that, depth production that (KHONG guong).',
  'Phan loai loai bai: M20 ai-llm (BE, co the dung mock LLM / cAi can API key -> ghi require-creds neu e2e), M21 graphql (BE), M22 payment (BE, gateway SePay/PayOS/PayPal/Stripe -> challenge co the require-creds cho e2e; nhung content+challenge authoring KHONG can cred).',
  'Van review noi dung body (purpose, flow 2.1.5, theory 2 muc, sai khai niem). Day la stage REVIEW: CHI de xuat review.md, KHONG sua file.',
].join(' ')
const results = []
for (const mod of MODULES) {
  log('=== Audit REVIEW ' + mod + ' ===')
  const r = await workflow({ scriptPath: RUNNER }, { module: mod, stage: 'review', guidance: GUIDANCE })
  results.push({ module: mod, result: r })
}
return { audited: MODULES, stage: 'review', note: 'review.md per-lesson da ghi. CHO THAY DUYET roi apply.', results }
