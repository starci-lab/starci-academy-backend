export const meta = {
  name: 'audit-fs-m5-m8',
  description: 'Audit (stage=review) lan luot M5-M8 khoa Fullstack: goi runner audit-fs-module.js cho tung module. Moi module tu parallel theo lesson -> Sonnet brief + Opus DE XUAT -> review.md -> STOP. KHONG sua file. Kem guidance rule 4-challenge.',
  phases: [
    { title: 'M5 form-mastery-rhf-zod' },
    { title: 'M6 client-state-zustand-jotai' },
    { title: 'M7 react-reactivity-and-effects' },
    { title: 'M8 websocket-realtime-communication' },
  ],
}

const MODULES = [
  '5-form-mastery-rhf-zod',
  '6-client-state-zustand-jotai',
  '7-react-reactivity-and-effects',
  '8-websocket-realtime-communication',
]

const GUIDANCE = [
  'RULE 4-challenge (thay chot 2026-06-21): MOI lesson PHAI du 4 challenges = DUNG 1 moi tier easy+medium+hard+insane (bo luat cu slot 1-3 chi 2 tier).',
  'Trong review.md: neu lesson thieu tier nao -> DE XUAT them (vd them hard+insane): neu ten topic/goc cu the, criteria do co che that, depth production that (KHONG build-exercise/overlap/edge guong; topic mong thi nang depth/doi goc chu KHONG bo tier).',
  'Nhieu lesson M5-M8 la FE (form/client-state/react effects) + M8 websocket -> phan loai loai bai dung (pure-FE Vite / BE+Playwright). Van review noi dung body nhu thuong (purpose, flow 2.1.5, theory 2 muc, sai khai niem). Day la stage REVIEW: CHI de xuat ra review.md, KHONG sua/tao/xoa file.',
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
