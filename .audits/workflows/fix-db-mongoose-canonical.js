export const meta = {
  name: 'fix-db-mongoose-canonical',
  description: 'M2 database lesson-2 mongoose: redo comments + missing methods vào CANONICAL repo (.repo, remote module-2), KHÔNG đụng stray clone; gate + commit + push',
  phases: [{ title: 'Fix', detail: 'mongoose methods + comments in canonical repo', model: 'sonnet' }],
}
const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const REPO = '.repo/fullstack-mastery-module-1-database-integration-and-caching'
const MOUNT = '.mount/data/courses/0-fullstack-mastery/modules/1-database-integration-and-caching/contents/2-mongoose-and-mongodb'

phase('Fix')
const r = await agent(
  'FIX lesson-2 mongoose của module database vào ĐÚNG repo CANONICAL. cwd=' + ROOT + '.\n' +
  'CANONICAL repo (remote module-2, ĐÃ migrate backend/<lang>): ' + REPO + '/2-mongoose-and-mongodb/backend/0-typescript/src\n' +
  '⚠️ TUYỆT ĐỐI KHÔNG đụng clone STRAY `C:/Repositories/repo/fullstack-mastery-module-2-database-integration-orm-odm-caching` — đó là bản lạc, bỏ qua hoàn toàn.\n\n' +
  'Đọc body bài (mount): ' + MOUNT + '/bodies/0-typescript/{vi,en}.md để biết flow + method/endpoint bài YÊU CẦU (vd findByHobby dùng $in, like dùng $inc, GET /cats?hobby=, POST /cats/:id/like, PATCH thay PUT, field likes, HttpCode).\n' +
  'Đảm bảo code TS trong CANONICAL repo CÓ ĐỦ mọi method/endpoint body nhắc tới (thêm nếu thiếu) + COMMENT KĨ (rule .audits/rules/fullstack/coding.md §A0: English-only JSDoc mọi class/method/field + inline giải thích logic). KHỚP body §2.1.3 (diff≈0, logic khớp).\n\n' +
  'Re-gate: powershell -NoProfile -File .audits/check-lesson.ps1 -Path "' + MOUNT + '" → 0 failures.\n' +
  'Commit+push CANONICAL repo: .gitignore đúng (node_modules/dist), git -C ' + REPO + ' add -A; commit "fix(mongoose): add missing query methods + thorough comments" + Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>; push. Lỗi auth → trả nguyên văn.\n' +
  'TRẢ VỀ: method/endpoint đã thêm, file comment, gate PASS?, commit hash + push.',
  { label: 'fix:mongoose', phase: 'Fix', model: 'sonnet' }
)
return { result: r }
