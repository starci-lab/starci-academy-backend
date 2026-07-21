# Concept — Init V2 & seeders (git-sourced content)

> `src/modules/init/` — chạy lúc startup qua `InitModule.register({ isGlobal: true })`: seeders + startup synchronizers. V2 = git-sourced (Octokit tarball + diff) thay vì chỉ đọc `.mount/` local.

- **Data-git** (`init/data-git/`) — kéo content từ git repo (tarball) làm nguồn seed, thay vì giả định `.mount/data` đã có sẵn trên máy.
- **Diff** (`init/diff/seed-config-overlay.service.ts`) — so sánh phiên bản mới vs đã seed, chỉ áp phần thay đổi (overlay), tránh reseed toàn bộ.
- **Scope** (`init/scope/`) — `seed-scope.service.ts` + `sync-scope.service.ts` giới hạn phạm vi seed/sync (vd 1 course, 1 module) thay vì luôn full.
- **Seeders** (`init/seeders/`) — theo domain: `achievements/ advertisements/ blog/ catalog/ changelog/ coding-problems/ courses/ cv/ foundations/ headhuntings/`, cộng `shared/` chứa parser dùng chung (`extracts/extract-json-from-md.service.ts`, `merge/merge.service.ts` — xem [[mount-content-parsing]]).
- ⚠️ **Seeder manual**: `PrimaryPostgreSQLModule.register({ withSeeders: { manualSeed: true } })` → KHÔNG tự chạy lúc boot, trigger qua CLI/init flow — đừng giả định DB đã seed.
- Thứ tự bootstrap: EnvModule load env → Winston logger sẵn sàng → DB connect → InitModule chạy seeders (nếu cần) + startup synchronizers (xem [[elasticsearch-sync]]) → app bind HTTP/GraphQL/Socket.

> Nguồn: `src/modules/init/`
