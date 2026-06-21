export const meta = {
  name: 'audit-fs-m9-m12',
  description: 'Audit (stage=review) lan luot M9-M12 khoa Fullstack: goi runner audit-fs-module.js cho tung module. Moi module tu parallel theo lesson -> Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Kem guidance rule 4-challenge.',
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
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: neu lesson thieu tier nao -> DE XUAT them (vd them hard+insane): neu ten topic/goc cu the, criteria do co che that, depth production that (KHONG build-exercise/overlap/edge guong; topic mong thi nang depth/doi goc chu KHONG bo tier).',
  'Phan loai loai bai dung (pure-BE curl / BE+Playwright cho email-sms/file-upload/server-components / pure-FE Vite). Van review noi dung body nhu thuong (purpose, flow 2.1.5, theory 2 muc, sai khai niem). Day la stage REVIEW: CHI de xuat ra review.md, KHONG sua/tao/xoa file.',
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
  note: 'Moi module da ghi review.md per-lesson. CHO THAY DUYET roi chay stage=apply (noE2e) tung module.',
  results,
}
