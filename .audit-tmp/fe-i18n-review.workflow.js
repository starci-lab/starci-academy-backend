export const meta = {
  name: 'fe-i18n-vi-review',
  description: 'Review tiếng Việt FE i18n (src/messages/vi.json) theo audit-vietnamese §A/§B — READ-ONLY, trả findings để apply tay',
  phases: [{ title: 'Review', detail: '6 Haiku review namespace groups, read-only' }],
}

const TABLE = 'C:/Repositories/ac/starci-academy-backend/.audit-tmp/fe-i18n-table.json'

const GROUPS = [
  ['auth', 'nav', 'common', 'search', 'home', 'settings', 'landing', 'profile'],
  ['finalProject', 'task', 'course', 'module', 'courses', 'modules', 'lesson'],
  ['challenge', 'codingPractice'],
  ['cv', 'content', 'foundations', 'markdown', 'reference'],
  ['aiQuota', 'aiSettings', 'aiProcessing', 'starciAi', 'aiSubscription', 'admin'],
  ['flashcard', 'leaderboard', 'payment', 'headhuntings', 'livestream', 'discussion',
   'feedback', 'mindMap', 'submissionAttempts', 'lessonVideoKind', 'timeAgo',
   'programmingLanguage', 'videoHostPlatform', 'qna', 'languages', 'score', 'linkGithub', 'qna'],
]

const RULE = [
  'Chuẩn audit-vietnamese (FE i18n UI copy). Mỗi dòng có {k=keyPath, en, vi}. ĐÁNH GIÁ vi.',
  'FLAG dòng vi BỊ một trong các lỗi:',
  '- §A force-translation: dịch ép technical term vốn nên GIỮ tiếng Anh (Dashboard, Toggle, Endpoint, Token, Cache, Provider[React/DI], Stream, Hook, Payload, Wrapper, Middleware, Deploy, Commit, Sandbox, Preview...). Nhưng GIỮ tiếng Việt nếu đã tự nhiên.',
  '- §B calque / Google-Translate-ese: câu thô, lủng củng, sai trật tự, thừa "một cách"/"việc mà", dịch word-by-word.',
  '- thiếu dấu / sai chính tả / lẫn ký tự lạ.',
  '- lệch nghĩa so với en (dịch sai).',
  '- KHÔNG nhất quán thuật ngữ giữa các key.',
  'GIỮ NGUYÊN (KHÔNG flag) nếu vi đã đúng + tự nhiên: "Bảng xếp hạng", "Khóa học", "Đăng nhập", "Giỏ hàng", "Nhà cung cấp"=vendor/AI provider, business term, hoặc câu đọc xuôi.',
  'CHỈ sửa VALUE; tuyệt đối KHÔNG đổi keyPath/cấu trúc. newVi giữ nguyên placeholder {var}, {count}, dấu câu, emoji nếu có.',
  'Trả findings: mỗi item {k, oldVi, newVi, issue}. KHÔNG sửa file (read-only). Nếu cả group OK thì trả mảng rỗng.',
].join('\n')

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          k: { type: 'string' },
          oldVi: { type: 'string' },
          newVi: { type: 'string' },
          issue: { type: 'string', enum: ['force-translate', 'calque', 'dau', 'mistranslate', 'inconsistent'] },
        },
        required: ['k', 'oldVi', 'newVi', 'issue'],
      },
    },
    reviewed: { type: 'number' },
  },
  required: ['findings', 'reviewed'],
}

const results = await parallel(
  GROUPS.map((ns, i) => () =>
    agent(
      RULE + '\n\nĐọc file bảng JSON: ' + TABLE +
        '\nCHỈ review các dòng có keyPath bắt đầu bằng 1 trong các namespace: ' + ns.join(', ') +
        '\n(bỏ qua dòng namespace khác). Đọc kỹ từng dòng, so en↔vi, trả findings đúng schema.',
      { label: 'review:g' + i + ':' + ns[0], phase: 'Review', model: 'haiku', schema: SCHEMA }
    )
  )
)

const all = results.filter(Boolean).flatMap((r) => r.findings || [])
const reviewed = results.filter(Boolean).reduce((s, r) => s + (r.reviewed || 0), 0)
log('Review xong: ' + reviewed + ' dòng, ' + all.length + ' findings.')
return { reviewed, count: all.length, findings: all }
