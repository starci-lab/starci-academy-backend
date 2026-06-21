export const meta = {
  name: 'apply-fs-m1-m8',
  description: 'APPLY (stage=apply, noE2e) lan luot M1-M8 Fullstack: Opus thuc hien de xuat trong review.md (them challenge du 4 tier + sua lesson) + gate + Opus fix-format loop. KHONG chay code/e2e (e2e de dot sau). Tuan tu tung module.',
  phases: [
    { title: 'M1 database-integration-and-caching' },
    { title: 'M2 rest-api-design-and-documentation' },
    { title: 'M3 authentication-and-authorization' },
    { title: 'M4 server-state-with-tanstack-query' },
    { title: 'M5 form-mastery-rhf-zod' },
    { title: 'M6 client-state-zustand-jotai' },
    { title: 'M7 react-reactivity-and-effects' },
    { title: 'M8 websocket-realtime-communication' },
  ],
}

const MODULES = [
  '1-database-integration-and-caching',
  '2-rest-api-design-and-documentation',
  '3-authentication-and-authorization',
  '4-server-state-with-tanstack-query',
  '5-form-mastery-rhf-zod',
  '6-client-state-zustand-jotai',
  '7-react-reactivity-and-effects',
  '8-websocket-realtime-communication',
]

const GUIDANCE = [
  'APPLY de xuat DA DUYET trong review.md cua tung lesson (thay duyet het 2026-06-21).',
  'RULE 4-challenge: moi lesson PHAI du 4 challenges = dung 1 moi tier easy+medium+hard+insane. Them tier con thieu theo dung de xuat trong review.md (slug + topic + criteria da neu). Index lien mach 0-easy/1-medium/2-hard/3-insane. Challenge format V2: outcome Sigma=30 + approach Sigma=70, >=1 critical, # verified, vi/en mirror, callout :::muted (KHONG ### N.).',
  'Cung sua cac content-fix da neu trong review.md (vd submission vi.md thieu criteria, mau thuan Docker, response mau lech DTO, lech so module M7->M6...).',
  'noE2e: KHONG chay server/test/e2e/.repo lan nay — chi content+challenge+gate. E2E o dot sau.',
].join(' ')

const RUNNER = '.audits/workflows/audit-fs-module.js'

const results = []
for (const mod of MODULES) {
  log('=== APPLY (no-e2e) module ' + mod + ' ===')
  const r = await workflow(
    { scriptPath: RUNNER },
    { module: mod, stage: 'apply', noE2e: true, guidance: GUIDANCE },
  )
  results.push({ module: mod, result: r })
}

return {
  applied: MODULES,
  stage: 'apply',
  noE2e: true,
  note: 'Da apply de xuat review.md (them challenge du 4 tier + content fix) + gate, KHONG e2e. E2E + push + seed o dot sau.',
  results,
}
