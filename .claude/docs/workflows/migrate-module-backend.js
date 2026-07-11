export const meta = {
  name: 'migrate-module-backend',
  description: 'Generic: migrate 1 FS module repo sang backend/<lang>, fix path doc + cd-first, .e2e per-lang, comment code KĨ, re-gate từng lesson, commit+push. args={module,repo}',
  phases: [
    { title: 'Migrate', detail: 'git mv + fix-doc-paths', model: 'sonnet' },
    { title: 'Enumerate', detail: 'list lessons', model: 'haiku' },
    { title: 'Lessons', detail: 'per-lesson: code-context + .e2e + comment + cd-first + re-gate', model: 'sonnet' },
    { title: 'Push', detail: 'commit + push repo', model: 'sonnet' },
  ],
}

function asObj(a) {
  if (!a) return {}
  if (typeof a === 'object') return a
  if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } }
  return {}
}
const ARGS = asObj(args)
const MOD = (ARGS.module || '').trim()
const REPO_NAME = (ARGS.repo || '').trim()
if (!MOD || !REPO_NAME) throw new Error('args.module + args.repo required, vd {module:"1-database-integration-and-caching", repo:"fullstack-mastery-module-1-database-integration-and-caching"}')
const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD
const REPO = '.repo/' + REPO_NAME

const COMMENT_RULE = [
  'COMMENT CODE KĨ (rule coding.md §A0) — áp MỌI file source backend/<lang>/:',
  '- ENGLISH ONLY. Doc-block mọi class/method (JSDoc/Javadoc/XML-doc ////godoc) = mục đích+param+return+side-effect.',
  '- Inline GIẢI THÍCH LOGIC (vì sao) từng dòng có logic; trivial thì khỏi. KHÔNG đổi hành vi, giữ lint sạch.',
].join('\n')

const ENUM_SCHEMA = { type: 'object', properties: { lessons: { type: 'array', items: { type: 'string' } } }, required: ['lessons'] }

// ---- Phase 1: MIGRATE + fix-doc-paths ----
phase('Migrate')
const mig = await agent(
  'Migrate layout repo (giữ git history). cwd=' + ROOT + '. Bash:\n' +
  'cd ' + ROOT + ' && DRYRUN=0 bash .claude/docs/migrate-repo-backend.sh "' + REPO_NAME + '"\n' +
  'VERIFY: mỗi lesson trong ' + REPO + ' có backend/<lang> (lesson nào có lang đó), KHÔNG còn lang dir thẳng/__backend_new. git mv lỗi (untracked/locked DLL) → fallback mv/robocopy + git rm --cached cũ + git add mới. TẮT server e2e đang chạy trước nếu lock.\n' +
  'FIX PATH DOC + CD CONVENTION (chạy 2 script tuần tự):\n' +
  '  (a) `DRYRUN=0 bash .claude/docs/fix-doc-paths.sh ' + REPO + ' ' + MODDIR + '` — sửa link/path <lesson>/<lang> → <lesson>/backend/<lang>.\n' +
  '  (b) `python3 .claude/docs/fix-cd-format.py ' + MODDIR + '` — chuẩn hóa cd: block clone → `cd <repo>/<lesson>` (lesson dir), block run → `cd backend/<lang>` (relative). Idempotent.\n' +
  'TRẢ VỀ: backend/<lang> mỗi lesson, số file doc fix, lỗi gì.',
  { label: 'migrate:' + REPO_NAME, phase: 'Migrate', model: 'sonnet' }
)

// ---- Phase 2: ENUMERATE lessons ----
phase('Enumerate')
const en = await agent(
  'Liệt kê lesson dir của module. Chạy: ls -1 "' + MODDIR + '/contents" (chỉ thư mục, bỏ file). TRẢ VỀ JSON {lessons:[...]} qua StructuredOutput.',
  { label: 'enum:' + MOD, phase: 'Enumerate', model: 'haiku', schema: ENUM_SCHEMA }
)
const LESSONS = (en && en.lessons) || []

// ---- Phase 3: PER-LESSON ----
phase('Lessons')
async function doLesson(lesson) {
  const dir = MODDIR + '/contents/' + lesson
  return agent(
    'XỬ LÝ 1 LESSON: ' + lesson + ' (module ' + MOD + '). cwd=' + ROOT + '. Repo đã migrate sang backend/<lang>, path doc đã fix sơ bộ.\n' +
    'Đọc rule: .claude/docs/pipeline.md (.e2e per-lang status) + .claude/docs/rules/fullstack/coding.md (§A0 comment, §A2 cd-first).\n\n' +
    'BƯỚC 1 — code-context: ' + dir + '/code-context.md mọi path repo phải là `<lesson>/backend/<N>-<lang>`. Grep xác nhận không còn thiếu /backend/.\n\n' +
    'BƯỚC 2 — .e2e per-lang: tạo ' + dir + '/.e2e/<lang>/flow-<N>-<slug>-<status>.md (typescript/java/csharp/go). Có proof cũ (.e2e/proof.md) → tách per-lang per-flow (output thật) status done rồi xóa proof.md. KHÔNG proof → flow-0-<slug>-require-rerun.md (1 dòng; ĐỪNG tự build/run 4 lang — tốn quota). Cloud/cred → require-creds (ghi rõ tên cred).\n\n' +
    'BƯỚC 3 — CD CONVENTION (rule §A2; fix-cd-format.py đã chạy ở phase Migrate): VERIFY `bash .claude/docs/check-cd-first.sh ' + dir + '` = 0. Convention: block clone → `cd <repo>/' + lesson + '` (lesson dir); block run (npm install/nest start/mvn/dotnet/go run) → dòng đầu `cd backend/<lang>` (relative từ lesson). Còn sai → sửa tay, vi & en mirror.\n\n' +
    'BƯỚC 4 — COMMENT CODE (cho thầy):\n' + COMMENT_RULE + '\nLàm cả 4 lang nếu lesson có (trong .repo, sẽ commit+push phase sau).\n\n' +
    'BƯỚC 5 — re-gate: `powershell -NoProfile -File .claude/docs/check-lesson.ps1 -Path "' + dir + '"` → 0 failures. Fail → sửa.\n\n' +
    'TRẢ VỀ ngắn (data): lesson, code-context OK?, .e2e files (+require-rerun?), cd-first chèn mấy block, lang comment + ~số file, gate PASS/FAIL (số checks).',
    { label: 'lesson:' + lesson, phase: 'Lessons', model: 'sonnet' }
  )
}
const lessonResults = await parallel(LESSONS.map(function (l) { return function () { return doLesson(l) } }))

// ---- Phase 4: COMMIT + PUSH ----
phase('Push')
const push = await agent(
  'COMMIT + PUSH repo. cwd=' + ROOT + '. Repo git: ' + REPO + '.\n' +
  'TRƯỚC commit: đảm bảo build artifact gitignored (target/ bin/ obj/ *.class node_modules/ dist/). Nếu .gitignore thiếu → thêm; nếu artifact đã tracked → git rm --cached chúng (KHÔNG git add -A mù để tránh add leftover lang dir bị lock).\n' +
  'git -C ' + REPO + ' add -A (sau khi đã chắc .gitignore đúng) ; git -C ' + REPO + ' commit (here-doc):\n' +
  '  chore: unify backend servers under backend/<lang> layout + thorough comments\n\n' +
  '  Move per-language servers under <lesson>/backend/<lang>/, fix doc paths (cd-first),\n' +
  '  and add exhaustive English line-by-line comments explaining logic.\n\n' +
  '  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n' +
  'git -C ' + REPO + ' push. Lỗi auth/permission → ĐỪNG retry vô hạn, trả lỗi nguyên văn.\n' +
  'TRẢ VỀ: commit hash + đã push chưa (hay lỗi).',
  { label: 'push:' + REPO_NAME, phase: 'Push', model: 'sonnet' }
)

return { module: MOD, repo: REPO_NAME, migrate: mig, lessons: lessonResults, push: push }
