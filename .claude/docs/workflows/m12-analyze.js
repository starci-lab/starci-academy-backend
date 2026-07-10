export const meta = {
  name: 'm12-analyze',
  description: 'Phan tich SAU (Opus) m12 file-upload 4 lesson truoc audit: source code pattern moi lang, lang nao KHONG lam duoc contract (skip), .docker infra can them moi lesson, restructure lang@root -> backend/<lang> + .docker + .playwright, vi pham .audits. CHI BAO CAO.',
  phases: [{ title: 'Analyze', detail: 'per-lesson: pattern + lang-skip + docker + restructure plan', model: 'opus' }],
}

const W = '.repo/fullstack-mastery-module-12-file-upload-and-storage'
const MNT = '.mount/data/courses/0-fullstack-mastery/modules/11-file-upload-and-storage/contents'
const LESSONS = [
  { slug: '0-multer-single-file-upload', contract: 'upload 1 file multipart (multer/equiv), luu (disk/local), tra metadata; validate size/type' },
  { slug: '1-s3-minio-presigned-urls', contract: 'server cap presigned URL -> client PUT thang len S3/MinIO; .docker CAN MinIO' },
  { slug: '2-chunked-upload-with-progress', contract: 'chia file thanh chunk, upload tung chunk + progress, server reassemble' },
  { slug: '3-resumable-upload-tus-protocol', contract: 'tus protocol resumable (POST create + PATCH offset + HEAD resume); lang nao khong co tus server lib -> kho' },
]

const RESULT = {
  type: 'object',
  properties: {
    lesson: { type: 'string' },
    perLang: { type: 'array', items: { type: 'object', properties: { lang: { type: 'string' }, implementsContract: { type: 'boolean' }, missing: { type: 'string' }, skipRecommend: { type: 'boolean' } }, required: ['lang', 'implementsContract', 'missing', 'skipRecommend'] } },
    dockerNeeded: { type: 'string' },          // infra .docker can them (MinIO? postgres? none?)
    restructure: { type: 'string' },           // viec move lang@root -> backend/<lang> + them .docker/.playwright
    auditViolations: { type: 'array', items: { type: 'string' } },
    playwrightPlan: { type: 'string' },         // FE upload demo + testid; bao nhieu flow; TS-only?
    fixes: { type: 'array', items: { type: 'string' } },
  },
  required: ['lesson', 'perLang', 'dockerNeeded', 'restructure', 'auditViolations', 'fixes'],
}

phase('Analyze')
const results = await parallel(LESSONS.map(function (L) {
  return function () {
    return agent(
      'PHAN TICH SAU lesson m12 file-upload "' + L.slug + '" (CHI BAO CAO, KHONG sua/build). cwd = repo root. VIET TIENG VIET CO DAU.\n' +
      'Contract: ' + L.contract + '\n' +
      'CAU TRUC HIEN TAI SAI: lang dir o LESSON-ROOT (' + W + '/' + L.slug + '/{0-typescript,1-java,2-csharp,3-go,frontend}) — THIEU backend/ wrapper, THIEU .docker, THIEU .playwright. Pattern dung (theo m9/m4): <lesson>/{.docker, backend/<N>-<lang>, frontend, .playwright}.\n' +
      '1) Doc 4-lang source (' + W + '/' + L.slug + '/{0-typescript,1-java,2-csharp,3-go}) + frontend: moi lang co implement DU contract upload nay khong? Lang nao KHONG lam duoc / phai bia (vd tus protocol thieu lib o Java/C#/Go?) -> skipRecommend=true + missing ghi RO ly do. TS la canonical (thay code chay duoc).\n' +
      '2) .docker infra can: lesson nay can MinIO/S3 (L1), postgres, hay khong can (L0 disk)? Ghi compose service can.\n' +
      '3) RESTRUCTURE plan: move {0..3-lang} -> backend/<lang>; them .docker/compose.yaml (infra); them .playwright (config + spec); cap nhat body cd-path + frontend VITE_API_BASE.\n' +
      '4) .audits violations (rules/fullstack/coding.md): bind 127.0.0.1? English-only comment? port pin? hard-code secret (S3 key)? body .mount (' + MNT + '/' + L.slug + ') drift?\n' +
      '5) Playwright plan: FE upload demo testid gi (file-input, upload-btn, progress, result)? bao nhieu flow? (it thoi vi cac lesson y chang — TS playwright, lang khac contract-verify).\n' +
      'TRA VE StructuredOutput {lesson, perLang, dockerNeeded, restructure, auditViolations, playwrightPlan, fixes}.',
      { label: 'm12:' + L.slug, phase: 'Analyze', model: 'opus', schema: RESULT }
    )
  }
}))
return { lessons: results.filter(Boolean) }
