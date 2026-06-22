export const meta = {
  name: 'audit-fs-m19-review',
  description: 'Review (stage=review) M19 deploy-and-devops-workflow (5 lesson) — redo vi run truoc fail quota. Opus DE XUAT -> review.md -> STOP. Absolute RUNNER path.',
  phases: [{ title: 'M19 deploy-and-devops-workflow' }],
}
const RUNNER = 'D:/Repositories/starci-academy-backend/.audits/workflows/audit-fs-module.js'
const GUIDANCE = 'RULE 4-challenge (thay chot 2026-06-21): MOI lesson du 4 tier easy+medium+hard+insane. M19 hien 17/20 challenge -> DE XUAT them tier con thieu (3 bai) cho dung lesson, topic cu the, criteria do co che that, depth production. Phan loai loai bai dung (deploy/devops thuong BE/infra; multi-stage-dockerfile, github-actions-cicd, digitalocean-vps+certbot, db-migrations, feature-flags-canary). Review noi dung body. Day la stage REVIEW: CHI de xuat review.md, KHONG sua file.'
const r = await workflow({ scriptPath: RUNNER }, { module: '19-deploy-and-devops-workflow', stage: 'review', guidance: GUIDANCE })
return { module: '19-deploy-and-devops-workflow', stage: 'review', result: r }
