export const meta = {
  name: 'run-e2e-m0',
  description: 'M0: CHẠY THẬT e2e 4-lang cho các lesson require-rerun (bind 127.0.0.1), ghi proof done/fail/require-creds per-lang per-flow, re-gate, commit+push',
  phases: [
    { title: 'E2E', detail: 'per-lesson: build+run 4 lang (loopback) -> proof', model: 'sonnet' },
    { title: 'Push', detail: 'commit + push proof', model: 'sonnet' },
  ],
}

const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const MOD = '0-nestjs-core-and-request-lifecycle'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD
const REPO = '.repo/fullstack-mastery-module-1-nestjs-core-and-request-lifecycle'
// Chỉ các lesson đang require-rerun (lesson 0-frameworks đã done). Map mount->repo slug.
const LESSONS = [
  { mount: '1-request-response-lifecycle', repo: '1-request-lifecycle' },
  { mount: '2-multi-environment-configuration', repo: '2-production-ready-config-and-logging' },
  { mount: '3-production-grade-logging', repo: '2-production-ready-config-and-logging' },
  { mount: '4-error-handling-and-response-shaping', repo: '4-error-handling-and-response-shaping' },
]

const RUN_RULE = [
  'CHẠY E2E THẬT 4-lang (KHÔNG bịa output). Rule pipeline.md mục port-mapping + bind loopback:',
  '- TÌM PORT RẢNH TRƯỚC (quét rồi assign), 4 lang port khác nhau.',
  '- BIND 127.0.0.1 (KHÔNG 0.0.0.0/::) tránh popup Windows Firewall: TS app.listen(port,"127.0.0.1"); Java -Dserver.address=127.0.0.1; Go ListenAndServe("127.0.0.1:<port>").',
  '- C# DỄ ESCAPE: set ENV `ASPNETCORE_URLS=http://127.0.0.1:<port>` (override launchSettings) + cờ `--urls http://127.0.0.1:<port>`; nếu Program.cs/launchSettings bind 0.0.0.0/localhost → sửa 127.0.0.1. Sau khi start, verify `Get-NetTCPConnection -LocalPort <port>` KHÔNG có 0.0.0.0/:: (nếu có → popup, kill + ép lại).',
  '- Build trước nếu cần (npm install/nest build; mvn -q package hoặc spring-boot:run; dotnet build/run; go build/run). Curl http://127.0.0.1:<port><endpoint>.',
  '- Mỗi flow (theo code-context contract): ghi .e2e/<lang>/flow-<N>-<slug>-<status>.md = lệnh + OUTPUT THẬT + HTTP status + port + kết luận.',
  '  status: done (pass) | fail (chạy ≥2 lần vẫn fail → ghi rõ lỗi+nguyên nhân) | require-creds (cần cloud/provider cred → ghi rõ tên).',
  '- M0 = local thuần (KHÔNG cloud) → kỳ vọng done; nếu fail thật → fail (mô tả để Opus fix sau, ĐỪNG tự đổi logic source ngoài sửa nhỏ để chạy được).',
  '- Kill server sau mỗi lang (giải phóng port). Xóa file *-require-rerun.md cũ sau khi có proof.',
].join('\n')

// ---- Phase 1: E2E per-lesson ----
phase('E2E')
async function runLesson(L) {
  const dir = MODDIR + '/contents/' + L.mount
  const backend = REPO + '/' + L.repo + '/backend'
  return agent(
    'CHẠY E2E THẬT lesson ' + L.mount + ' (M0). cwd=' + ROOT + '. Code 4 lang ở ' + backend + '/<lang> (0-typescript/1-java/2-csharp/3-go nếu có). Contract/flows đọc ở ' + dir + '/code-context.md (+ bodies nếu cần).\n\n' +
    RUN_RULE + '\n\n' +
    'Ghi proof vào ' + dir + '/.e2e/<lang>/. Sau khi xong: re-gate `powershell -NoProfile -File .audits/check-lesson.ps1 -Path "' + dir + '"` → 0 failures.\n' +
    'TRẢ VỀ (data): lesson, mỗi lang × mỗi flow = status (done/fail/require-creds) + port đã dùng, lỗi nếu có, gate PASS/FAIL.',
    { label: 'e2e:' + L.mount, phase: 'E2E', model: 'sonnet' }
  )
}
const results = await parallel(LESSONS.map(function (L) { return function () { return runLesson(L) } }))

// ---- Phase 2: COMMIT + PUSH proof ----
phase('Push')
const push = await agent(
  'COMMIT + PUSH proof e2e. cwd=' + ROOT + '. Repo git: ' + REPO + '.\n' +
  'Lưu ý: .e2e proof nằm trong .mount (gitignored) → KHÔNG lên git repo. Cái cần push lên repo CHỈ khi e2e phải SỬA CODE để chạy được (vd fix bind 127.0.0.1, port config). Nếu CHỈ tạo proof trong .mount → KHÔNG có gì để commit ở repo, báo "no repo change".\n' +
  'Nếu có sửa code trong ' + REPO + ': .gitignore đúng (target/bin/obj/node_modules), git -C ' + REPO + ' add -A; commit "test: e2e proof + bind 127.0.0.1 for local runs" + Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>; push. Lỗi auth → trả nguyên văn.\n' +
  'TRẢ VỀ: có sửa code repo không, commit hash + push (hay "no repo change").',
  { label: 'push:e2e-M0', phase: 'Push', model: 'sonnet' }
)

return { module: MOD, lessons: results, push: push }
