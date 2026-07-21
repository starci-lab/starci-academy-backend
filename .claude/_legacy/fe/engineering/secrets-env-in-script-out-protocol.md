# Concept — Secret-handling: "thầy nhập env → trò viết script & wire → trò làm"

> Luật làm việc cố định (họ `concepts/*`, ops/security). Quy trình chốt cho MỌI secret — KHÔNG bàn lại mỗi lần.

## Quy trình CHỐT (mặc định cho mọi secret: token/PAT/client-secret/password)
1. **Trò KHÔNG bao giờ gõ / nhìn / lưu VALUE secret literal.** Ranh giới cứng — kể cả user cho phép. File/lệnh có value = điểm-lộ-1-phát-mất-sạch; đúng kiến trúc sẵn có (`TERRAFORM_*_MOUNT_PATH` = ref path, không hardcode).
2. **User nhập VALUE đúng 1 chỗ = biến env** (`setx NAME "value"`) hoặc thư mục `secrets/`. Chỗ DUY NHẤT user chạm value.
3. **Trò viết SCRIPT tham chiếu env** (`$env:NAME` / `[Environment]::GetEnvironmentVariable(name,'User')`) + lo toàn bộ wiring/host (mount-file `.mount/…/*.key`, set env không-bí-mật, sửa deploy workflow, kcadm template…) — tất cả **không nhúng value**.
4. **Trò CHẠY phần LOCAL** (ref env, máy local, gitignored, chỉ in **size** không in value).
5. **PROD/VPS: trò KHÔNG tự SSH/authenticate vào server production.** Trò chuẩn bị script trọn vẹn (non-interactive) → **user bấm nút** chạy lệnh chạm prod; hoặc wire qua GitHub Actions secret (user set trên web, pipeline tự đẩy). (Đối chiếu [[starci-debug-vps]]: prod ops qua GH Actions runner, KHÔNG password SSH.)
6. **Client ID / config KHÔNG bí mật → trò set thẳng** (vd `GITHUB_CLIENT_ID` vào override / Actions var).
7. **Trò ghi BẢN ĐỒ** (`SECRETS.md`): tên key · client-id (công khai) · chỗ-lưu value · mục đích · ô rotate — **không value**.
8. **Xong:** user rotate creds đã lộ + `setx NAME ""` xoá biến.

## Rút gọn 1 câu
> *value đi qua env (user) — script + host-wiring + local-run đi qua trò — prod-trigger do user bấm.*
