export const meta = {
  name: 'finish-m4',
  description: 'M4 auth Phase-2 dứt điểm: challenges hard/insane chọn lọc + e2e thật (JWT/refresh/RBAC local + OAuth dùng .oauth.env) + clean-residue + gate + push. KHÔNG commit secret.',
  phases: [
    { title: 'Challenges', detail: 'add hard/insane selective (Opus pick)', model: 'opus' },
    { title: 'E2E', detail: 'JWT/refresh/RBAC real + OAuth redirect assert', model: 'sonnet' },
    { title: 'Push', detail: 'clean-residue + gate + commit + push', model: 'sonnet' },
  ],
}
const ROOT = 'C:/Repositories/ac/starci-academy-backend'
const MOD = '3-authentication-and-authorization'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + MOD + '/contents'
const REPO = '.repo/fullstack-mastery-module-4-authentication-and-authorization'
const CREDS = REPO + '/.oauth.env'  // gitignored — NEVER commit

const BIND = 'BIND 127.0.0.1 (KHÔNG 0.0.0.0/::): TS app.listen(p,"127.0.0.1"); Java -Dserver.address=127.0.0.1; C# ENV ASPNETCORE_URLS=http://127.0.0.1:<p>+--urls; Go ListenAndServe("127.0.0.1:<p>"). Tìm port rảnh trước. Verify Get-NetTCPConnection không 0.0.0.0/::.'

// ---- Phase 1: CHALLENGES hard/insane (chọn lọc) ----
phase('Challenges')
const ch = await agent(
  'AUTHOR challenge hard/insane CHỌN LỌC cho M4 auth (quyết định Phase-1: chỉ thêm nơi HỢP, bỏ nơi gượng). cwd=' + ROOT + '. ĐỌC rule .audits/rules/fullstack/challenges.md (format V2: outcomeCriterias Σ30 + approachCriterias Σ70, ≥1 critical, # verified, vi/en mirror, KHÔNG ### N. heading, KHÔNG inline ref/sub).\n' +
  'Mỗi lesson hiện có easy+medium. Đề xuất thêm (Opus tự quyết hợp/không, ghi lý do):\n' +
  '- 0-jwt-authentication-flow (medium=blacklist): hard = RS256 asymmetric + key rotation; insane = JWKS endpoint + multi-key verify.\n' +
  '- 1-refresh-token-strategy (medium=rotation): hard = reuse-detection + token-family revoke; insane (nếu hợp) = device-binding/sliding session.\n' +
  '- 2-rbac-and-guards (medium=dynamic-permission): hard = policy/ABAC attribute-based; insane = resource-ownership + hierarchical roles.\n' +
  '- 3-oauth2-google-login (medium=state): hard = PKCE; insane = BỎ (gượng, OAuth đủ ở hard).\n' +
  'Tạo file challenges/<N>-<slug>-<diff>/{vi,en}.md (+ prompt nếu rule yêu cầu). lang giữ 4-lang (criteria approach per-lang nếu portable). Re-gate từng lesson đụng tới.\n' +
  'TRẢ VỀ: lesson nào thêm hard/insane (slug) + lesson nào bỏ + lý do, gate.',
  { label: 'challenges:M4', phase: 'Challenges', model: 'opus' }
)

// ---- Phase 2: E2E thật ----
phase('E2E')
const LESSONS = ['0-jwt-authentication-flow','1-refresh-token-strategy','2-rbac-and-guards','3-oauth2-google-login']
const e2e = await parallel(LESSONS.map(function (L) {
  return function () {
    const dir = MODDIR + '/' + L
    const isOAuth = L === '3-oauth2-google-login'
    return agent(
      'E2E THẬT lesson ' + L + ' (M4 auth). cwd=' + ROOT + '. Code 4 lang ở ' + REPO + '/' + L + '/backend/<lang>. Flows theo body/code-context. ' + BIND + '\n' +
      (isOAuth
        ? 'OAUTH lesson — DÙNG creds gitignored ' + CREDS + ' (export GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET vào env khi chạy server, KHÔNG in secret ra log/proof, KHÔNG ghi secret vào file commit). E2e tự-động được: server lên → curl /auth/google (hoặc route khởi tạo OAuth) → assert HTTP 302 + Location chứa accounts.google.com và client_id đúng → status done. Full callback (consent Google) = cần browser thật → ghi 1 dòng note "callback cần consent thủ công" trong proof, KHÔNG fail. Mark done nếu redirect-init đúng; require-creds chỉ nếu thiếu creds.'
        : 'LOCAL lesson (JWT/refresh/RBAC) — build+run 4 lang, chạy flow thật (login→token, verify, refresh, RBAC allow/deny 401/403), assert HTTP + envelope. status done; fail nếu ≥2 lần fail (ghi rõ).') + '\n' +
      'Ghi proof ' + dir + '/.e2e/<lang>/flow-<N>-<slug>-<status>.md (output thật, KHÔNG secret). Xóa *-require-rerun.md cũ. Kill server sau mỗi lang. Re-gate lesson → 0 fail.\n' +
      'TRẢ VỀ: mỗi lang×flow status + port, gate.',
      { label: 'e2e:' + L, phase: 'E2E', model: 'sonnet' }
    )
  }
}))

// ---- Phase 3: clean-residue + gate + push ----
phase('Push')
const push = await agent(
  'FINALIZE M4. cwd=' + ROOT + '.\n' +
  'A) clean-residue: `DRYRUN=0 bash .audits/clean-residue.sh .mount/data/courses/0-fullstack-mastery/modules/' + MOD + ' ' + REPO + '`.\n' +
  'B) Gate cả 4 lesson: powershell -NoProfile -File .audits/check-lesson.ps1 -Path ".mount/data/courses/0-fullstack-mastery/modules/' + MOD + '" → 0 fail. Fix nếu còn (vd research.md không dấu).\n' +
  'C) Commit+push repo ' + REPO + ': .gitignore đúng (đã có .env*.local/.oauth.env/build). XÁC NHẬN `git -C ' + REPO + ' status` KHÔNG có .oauth.env/.env.local (secret) trước khi add. git -C ' + REPO + ' add -A; commit "feat(auth): hard/insane challenges + e2e proof (OAuth redirect) + comments" + Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>; push. Nếu thấy secret sắp bị stage → STOP, báo ngay.\n' +
  'TRẢ VỀ: clean OK, gate, commit hash + push, XÁC NHẬN secret KHÔNG bị commit.',
  { label: 'push:M4', phase: 'Push', model: 'sonnet' }
)
return { module: MOD, challenges: ch, e2e: e2e, push: push }
