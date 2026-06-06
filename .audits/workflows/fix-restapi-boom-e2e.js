export const meta = {
  name: 'fix-restapi-boom-e2e',
  description: 'M3 rest-api: thêm endpoint boom (Opus quyết, 500 envelope) 4 lang + e2e rerun thật (C# lesson0 EF-fix + flow-4 boom 4 lang), bind 127.0.0.1, gate + commit + push',
  phases: [
    { title: 'Boom', detail: 'add GET /users/boom (throw->500) 4 lang + body consistency', model: 'sonnet' },
    { title: 'E2E', detail: 'rerun C# lesson0 + flow-4 boom 4 lang (loopback)', model: 'sonnet' },
    { title: 'Push', detail: 'gate + commit + push', model: 'sonnet' },
  ],
}
const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const REPO = '.repo/fullstack-mastery-module-3-rest-api-design-and-documentation'
const MOD = '.mount/data/courses/0-fullstack-mastery/modules/2-rest-api-design-and-documentation/contents'
const L2 = MOD + '/2-unified-response-and-errors'
const L0 = MOD + '/0-restful-api-crud-best-practices'

const BIND = 'BIND 127.0.0.1 (KHÔNG 0.0.0.0/::): TS app.listen(p,"127.0.0.1"); Java -Dserver.address=127.0.0.1; C# ENV ASPNETCORE_URLS=http://127.0.0.1:<p> + --urls; Go ListenAndServe("127.0.0.1:<p>"). Verify Get-NetTCPConnection không có 0.0.0.0/::. Tìm port rảnh trước.'

// ---- Phase 1: BOOM endpoint (Opus decision: ADD, vì flow-4 boom->500 generic envelope là CỐT LÕI bài unified-errors) ----
phase('Boom')
const boom = await agent(
  'THÊM endpoint boom cho lesson unified-response-and-errors (QUYẾT ĐỊNH Opus: thêm, KHÔNG bỏ flow — boom->500 generic envelope là phần cốt lõi dạy error shaping). cwd=' + ROOT + '.\n' +
  'Repo: ' + REPO + '/2-unified-response-and-errors/backend/<lang> (0-typescript/1-java/2-csharp/3-go).\n' +
  'Thêm `GET /users/boom`: cố tình throw lỗi KHÔNG xử lý (vd throw new Error("boom")) → để exception filter/handler bắt → trả **500 generic error envelope** đúng format bài. Làm CHO CẢ 4 lang (TS cũng phải có nếu thiếu). Comment KĨ (§A0).\n' +
  'Đồng bộ BODY: bodies/<lang>/{vi,en}.md phải mô tả flow-4 boom (500 envelope) NHẤT QUÁN cả 4 lang (vi/en mirror). Nếu TS body thiếu flow-4 → thêm. code-context (nếu còn) cập nhật.\n' +
  'Re-gate ' + L2 + ' → 0 failures.\n' +
  'TRẢ VỀ: mỗi lang đã thêm boom chưa, body flow-4 đồng bộ chưa, gate.',
  { label: 'boom:add', phase: 'Boom', model: 'sonnet' }
)

// ---- Phase 2: E2E rerun thật ----
phase('E2E')
const e2e = await agent(
  'CHẠY E2E THẬT (KHÔNG bịa). cwd=' + ROOT + '. ' + BIND + '\n\n' +
  '(A) lesson0 ' + L0 + ' — lang **C#** (EF Core column-mapping bug vừa fix): build+run, chạy lại các flow CRUD, ghi ' + L0 + '/.e2e/csharp/flow-<N>-<slug>-done.md (output thật). Xóa file csharp *-require-rerun.md cũ. (Các lang khác lesson0 đã done — giữ.)\n' +
  '(B) lesson2 ' + L2 + ' — flow-4 boom (GET /users/boom -> 500 generic envelope) cho **cả 4 lang** (sau khi Phase Boom thêm endpoint): build+run, curl /users/boom, assert HTTP 500 + envelope đúng. Ghi ' + L2 + '/.e2e/<lang>/flow-4-boom-500-done.md (output thật). Xóa *-require-rerun.md cũ. (flow-1..3 đã done — giữ.)\n' +
  'Nếu flow nào chạy ≥2 lần vẫn fail → status fail + ghi rõ lỗi (đừng đổi logic ngoài sửa nhỏ để chạy). Kill server sau mỗi lang.\n' +
  'Re-gate cả 2 lesson → 0 failures.\n' +
  'TRẢ VỀ: lesson0 C# flows status; lesson2 flow-4 mỗi lang status + port; gate.',
  { label: 'e2e:rerun', phase: 'E2E', model: 'sonnet' }
)

// ---- Phase 3: COMMIT + PUSH ----
phase('Push')
const push = await agent(
  'COMMIT + PUSH repo rest-api. cwd=' + ROOT + '. Repo: ' + REPO + '.\n' +
  '.gitignore đúng (target/bin/obj/*.class/*.exe/node_modules/dist). git -C ' + REPO + ' add -A (KHÔNG add leftover locked dir); commit "feat(errors): add boom 500 endpoint 4-lang + e2e proof; fix C# EF mapping" + Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>; push. Lỗi auth → trả nguyên văn.\n' +
  'TRẢ VỀ: commit hash + push (hay lỗi).',
  { label: 'push:boom', phase: 'Push', model: 'sonnet' }
)
return { boom: boom, e2e: e2e, push: push }
