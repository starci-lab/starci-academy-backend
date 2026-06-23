# Rule — Secret-handling: "thầy nhập env → trò viết script & wire → trò làm" (2026-06-23)

- File/§ đích khi `/merge`: `main.md` (engineering/ops protocol) — luật làm việc cố định, KHÔNG bàn lại mỗi lần.
- Bối cảnh: set GitHub OAuth + PAT cho local/prod. Bàn tới lui mệt vì ranh giới "AI không cầm secret". Thầy chốt
  1 quy trình: *"tạo rule: trò viết scripts/wire-host để thầy nhập env, rồi sau trò làm"*.

## Quy trình CHỐT (mặc định cho mọi secret: token/PAT/client-secret/password)
1. **Trò KHÔNG bao giờ gõ / nhìn / lưu VALUE secret literal.** Ranh giới cứng — kể cả thầy cho phép. Lý do: file/lệnh
   có value là điểm-lộ-1-phát-mất-sạch; và đúng kiến trúc sẵn có (`TERRAFORM_*_MOUNT_PATH` = ref path, không hardcode).
2. **Thầy nhập VALUE đúng 1 chỗ = biến env** (`setx NAME "value"`) — hoặc 1 thư mục `secrets/`. Đây là chỗ DUY NHẤT
   thầy chạm value.
3. **Trò viết SCRIPT tham chiếu env** (`$env:NAME` / `[Environment]::GetEnvironmentVariable(name,'User')`) + lo **toàn
   bộ wiring/host**: ghi mount-file (`.mount/terraform/*.key`), set key env không-bí-mật, sửa deploy workflow, kcadm
   template… — tất cả **không nhúng value**.
4. **Trò CHẠY phần LOCAL** (ref env, máy local, gitignored, chỉ in **size** không in value) — đây là việc trò làm hộ.
5. **PROD/VPS: trò KHÔNG tự SSH/authenticate vào server production.** Trò chuẩn bị script trọn vẹn (env-password qua
   `plink -pw $env:VPS_PASS`, 1 lệnh non-interactive) → **thầy bấm nút** chạy lệnh chạm prod. Hoặc trò wire qua
   **GitHub Actions secret** (thầy set trên web, pipeline tự đẩy lên VPS) — khỏi sờ VPS.
6. **Client ID / config KHÔNG bí mật → trò set thẳng** (vd `GITHUB_CLIENT_ID` vào `.env.override` / Actions var).
7. **Trò ghi BẢN ĐỒ** (`SECRETS.md`): tên key · client-id (công khai) · chỗ-lưu value · mục đích · ô rotate —
   **không value**. Mở 1 file thấy hết.
8. **Xong**: thầy rotate creds đã lộ (ưu tiên password dùng-chung) + `setx NAME ""` xoá biến.

## Hiện trạng (đã làm theo rule này)
- Artifacts: [[trial-preview-enrollment-optional]] (riêng) + `.mount/terraform/SECRETS.md` (bản đồ) +
  `scratch/set-secrets.ps1` (env-in → ghi local + đẩy prod `-Prod` qua plink/ssh; chỉ in size).
- Local GitHub key files: trò ghi hộ từ `GH_PAT`/`GH_OAUTH_LOCAL` (đã xong). Prod: thầy chạy `set-secrets.ps1 -Prod`.
- **Nguyên tắc rút gọn 1 câu:** *value đi qua env (thầy) — script + host-wiring + local-run đi qua trò — prod-trigger
  do thầy bấm.*
