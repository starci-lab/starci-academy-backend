export const meta = {
  name: 'migrate-m0-backend',
  description: 'M0 ONLY: migrate backend/<lang> + fix path doc + cd-first, .e2e per-lang (skip re-run nếu sửa trivial), comment code KĨ, re-gate từng lesson, commit+push',
  phases: [
    { title: 'Migrate', detail: 'git mv (idempotent) + fix-doc-paths', model: 'sonnet' },
    { title: 'Lessons', detail: 'per-lesson: code-context + .e2e + cd-first + comment + re-gate', model: 'sonnet' },
    { title: 'Push', detail: 'commit + push repo M1', model: 'sonnet' },
  ],
}

const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const MOD = '0-nestjs-core-and-request-lifecycle'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD
const REPO_NAME = 'fullstack-mastery-module-1-nestjs-core-and-request-lifecycle'
const REPO = '.repo/' + REPO_NAME
const LESSONS = [
  '0-frameworks-in-backend',
  '1-request-response-lifecycle',
  '2-multi-environment-configuration',
  '3-production-grade-logging',
  '4-error-handling-and-response-shaping',
]

const COMMENT_RULE = [
  'COMMENT CODE KĨ (rule coding.md §A0) — MỌI file source backend/<lang>/:',
  '- ENGLISH ONLY. Doc-block mọi class/method (JSDoc/Javadoc/XML-doc ////godoc) = mục đích+param+return+side-effect.',
  '- Inline GIẢI THÍCH LOGIC (vì sao) từng dòng có logic; trivial khỏi. KHÔNG đổi hành vi, giữ lint sạch.',
].join('\n')

// QUY TẮC SKIP TEST (Opus quyết): flow đã done + sửa trivial (comment/path/cd-first, KHÔNG đổi hành vi) -> GIỮ done, KHÔNG re-run e2e.
const SKIP_RULE = 'SKIP RE-RUN E2E: nếu .e2e flow đã `done` (proof pass) và thay đổi lesson này CHỈ là trivial (thêm comment / fix path doc / cd-first / format — KHÔNG đổi logic source) → GIỮ `done`, KHÔNG chạy lại test (đỡ quota + tránh firewall). Chỉ re-run/đổi status khi đổi logic thật hoặc chưa có proof. ĐỪNG tự build/run 4 lang nếu chỉ sửa trivial.'

// ---- Phase 1: MIGRATE (idempotent) + fix-doc-paths ----
phase('Migrate')
const mig = await agent(
  'Migrate layout repo M1 (idempotent, giữ git history). cwd=' + ROOT + '. Bash:\n' +
  'cd ' + ROOT + ' && DRYRUN=0 bash .audits/migrate-repo-backend.sh "' + REPO_NAME + '"\n' +
  '(Lesson đã có backend/0-typescript thì script tự bỏ qua — in "already migrated".) VERIFY: mỗi lesson có backend/<lang>, KHÔNG còn lang dir thẳng/__backend_new. git mv lỗi (untracked/locked DLL) → TẮT server e2e đang chạy trước, fallback mv/robocopy + git rm --cached cũ + git add mới. Leftover dir bị OS lock → ghi rõ tên để dọn sau.\n' +
  'FIX PATH DOC: `DRYRUN=0 bash .audits/fix-doc-paths.sh ' + REPO + ' ' + MODDIR + '` (idempotent).\n' +
  'TRẢ VỀ: backend/<lang> mỗi lesson, số file doc fix, leftover locked (nếu có), lỗi gì.',
  { label: 'migrate:M1', phase: 'Migrate', model: 'sonnet' }
)

// ---- Phase 2: PER-LESSON ----
phase('Lessons')
async function doLesson(lesson) {
  const dir = MODDIR + '/contents/' + lesson
  return agent(
    'XỬ LÝ 1 LESSON M0: ' + lesson + '. cwd=' + ROOT + '. Repo đã migrate backend/<lang>, path doc đã fix sơ bộ.\n' +
    'Đọc rule: .audits/pipeline.md (.e2e per-lang + SKIP RE-RUN) + coding.md (§A0 comment, §A2 cd-first).\n\n' +
    'BƯỚC 1 — code-context: ' + dir + '/code-context.md mọi path repo = `<lesson>/backend/<N>-<lang>`. Grep xác nhận không thiếu /backend/.\n\n' +
    'BƯỚC 2 — .e2e per-lang: ' + dir + '/.e2e/<lang>/flow-<N>-<slug>-<status>.md. ' + SKIP_RULE + '\n  Có proof cũ → tách per-lang per-flow (output thật) `done`, xóa proof.md. KHÔNG proof + chỉ sửa trivial → flow-0-<slug>-require-rerun.md (1 dòng; ĐỪNG build/run). Cloud/cred → require-creds (ghi rõ tên cred).\n\n' +
    'BƯỚC 3 — CD-FIRST (§A2): body bodies/<lang>/{vi,en}.md. XÉT TỪNG fenced ```bash block ĐỘC LẬP. MỌI block chứa lệnh chạy (npm install / nest start --watch / mvn spring-boot:run / dotnet run / go run / dotnet build) PHẢI có `cd ' + REPO_NAME + '/' + lesson + '/backend/<lang>` là dòng ĐẦU của block (copy-paste tự đủ). ĐẶC BIỆT block "Khởi động"/startup tách riêng (vd §2.1.4.2 chỉ có `npm install` + `nest start --watch`, KHÔNG có cd) → CHÈN cd vào đầu. Block clone+cd đã đúng thì giữ. Mỗi lang dùng đúng path lang của nó. vi & en mirror y nhau (giữ gate parity).\n\n' +
    'BƯỚC 4 — COMMENT CODE (cho thầy, là sửa TRIVIAL không đổi hành vi → KHÔNG kích hoạt re-run test):\n' + COMMENT_RULE + '\nLàm cả 4 lang nếu lesson có.\n\n' +
    'BƯỚC 5 — re-gate: `powershell -NoProfile -File .audits/check-lesson.ps1 -Path "' + dir + '"` → 0 failures. Fail → sửa.\n\n' +
    'TRẢ VỀ ngắn (data): lesson, code-context OK?, .e2e files (+done/require-rerun), cd-first chèn mấy block, lang comment + ~số file, gate PASS/FAIL (số checks).',
    { label: 'lesson:' + lesson, phase: 'Lessons', model: 'sonnet' }
  )
}
const lessonResults = await parallel(LESSONS.map(function (l) { return function () { return doLesson(l) } }))

// ---- Phase 3: COMMIT + PUSH ----
phase('Push')
const push = await agent(
  'COMMIT + PUSH repo M1. cwd=' + ROOT + '. Repo git: ' + REPO + '.\n' +
  'TRƯỚC commit: .gitignore phải có target/ bin/ obj/ *.class node_modules/ dist/; artifact đã tracked → git rm --cached (KHÔNG git add -A mù để tránh add leftover lang dir bị lock).\n' +
  'git -C ' + REPO + ' add -A (sau khi .gitignore đúng) ; commit (here-doc):\n' +
  '  chore: backend/<lang> layout + cd-first doc paths + thorough comments\n\n' +
  '  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n' +
  'git -C ' + REPO + ' push. Lỗi auth → ĐỪNG retry vô hạn, trả lỗi nguyên văn.\n' +
  'TRẢ VỀ: commit hash + đã push chưa (hay lỗi).',
  { label: 'push:M1', phase: 'Push', model: 'sonnet' }
)

return { module: MOD, repo: REPO_NAME, migrate: mig, lessons: lessonResults, push: push }
