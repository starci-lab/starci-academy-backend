export const meta = {
  name: 'apply-fs-m9-m12',
  description: 'APPLY (stage=apply, noE2e) lan luot M9-M12 Fullstack: Opus thuc hien de xuat review.md (them challenge du 4 tier + sua lesson) + gate + Opus fix-format loop. KHONG e2e. Tuan tu tung module.',
  phases: [
    { title: 'M9 background-jobs-and-workers' },
    { title: 'M10 email-sms-otp' },
    { title: 'M11 file-upload-and-storage' },
    { title: 'M12 server-components-suspense-streaming' },
  ],
}

const MODULES = [
  '9-background-jobs-and-workers',
  '10-email-sms-otp',
  '11-file-upload-and-storage',
  '12-server-components-suspense-streaming',
]

const GUIDANCE = [
  'APPLY de xuat DA DUYET trong review.md cua tung lesson (thay duyet het 2026-06-21).',
  'RULE 4-challenge: moi lesson du 4 tier easy+medium+hard+insane theo dung de xuat review.md. Index 0-easy/1-medium/2-hard/3-insane. Format V2: outcome Sigma=30 + approach Sigma=70, >=1 critical, # verified, vi/en mirror, callout :::muted.',
  'Sua content-fix da neu trong review.md (slug lech, mismatch title, parity vi/en, dao tier...).',
  'noE2e: KHONG chay server/test/e2e lan nay — chi content+challenge+gate.',
].join(' ')

const RUNNER = '.claude/docs/workflows/audit-fs-module.js'
const results = []
for (const mod of MODULES) {
  log('=== APPLY (no-e2e) module ' + mod + ' ===')
  const r = await workflow({ scriptPath: RUNNER }, { module: mod, stage: 'apply', noE2e: true, guidance: GUIDANCE })
  results.push({ module: mod, result: r })
}
return { applied: MODULES, stage: 'apply', noE2e: true, results }
