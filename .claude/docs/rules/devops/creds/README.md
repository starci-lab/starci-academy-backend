# DevOps Mastery — credential setup (TRACKED in git, chạy được trên MỌI máy)

> **Portability (đọc trước):** thư mục này TRACKED trong git (khác `scratch/` — bị gitignore hoàn toàn) → clone repo ở
> máy nào cũng có sẵn các script này. Nhưng **credential THẬT (env var value, session `gcloud auth login`/`az login`)
> LUÔN gắn với MÁY + USER PROFILE cụ thể** (Windows User-scope env var sống trong registry của user đó; CLI session
> sống trong `%APPDATA%\gcloud`/`~/.azure`) — đổi máy (hoặc user Windows khác) PHẢI chạy lại toàn bộ bước dưới đây từ
> đầu. Không có cách nào "mang" credential qua máy khác mà không tự tay làm lại (đây là tính năng, không phải thiếu
> sót — tránh secret rơi vãi qua nhiều máy).
>
> Theo protocol xử-lý-secret: **value đi qua env (thầy) — script/wiring/local-run đi qua trò — trò KHÔNG bao giờ
> gõ/nhìn/lưu value**. Trò ĐƯỢC PHÉP tự chạy các script "provision" bên dưới (kể cả AWS/Azure — output nhạy cảm
> capture thẳng vào biến PowerShell, KHÔNG BAO GIỜ echo ra) VÀ chạy identity-check an toàn (`aws sts get-caller-identity`,
> `az account show`, DO `GET /v2/account` — chỉ đọc metadata, không đọc secret) để xác nhận đúng account trước khi
> audit thật.

## Cách chạy trên 1 MÁY MỚI (thứ tự)
```powershell
# 0) đứng ở root repo
cd D:\path\to\starci-academy-backend

# 1) AWS — nếu CHƯA có AWS_ACCESS_KEY_ID/SECRET nào trong env (User), phải TỰ TẠO 1 IAM user thủ công lần đầu
#    (KHÔNG có script "provision-aws-lab.ps1 from scratch" vì cần ít nhất 1 bộ key ban đầu để bootstrap qua CLI/Console —
#    xem "Bootstrap AWS lần đầu" bên dưới). Nếu ĐÃ có key (kể cả root) trong env:
powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-aws-lab.ps1

# 2) GCP
gcloud auth login                                          # 1 lần/máy, mở trình duyệt
powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-gcp-lab.ps1

# 3) Azure — CẦN 2 lần đăng nhập tương tác riêng biệt (xem lưu ý MFA bên dưới)
az login                                                    # lần 1: session CLI cơ bản
powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-azure-lab.ps1
#   nếu script báo loi AADSTS50076 (can MFA de goi Graph API) -> chay:
#   az login --tenant "<tenant-id-tu-loi>" --scope "https://graph.microsoft.com//.default"
#   roi chay lai provision-azure-lab.ps1

# 4) DigitalOcean — KHÔNG có provision script (DO không có concept service-account/SP để tự tạo qua CLI từ credential
#    khác) — tự vào DO Console lấy Personal Access Token (xem bảng bên dưới), rồi:
powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\set-devops-creds.ps1
#   (Enter bỏ qua AWS/GCP/Azure nếu đã set ở bước trên, chỉ điền phần DigitalOcean)

# 5) verify tổng — an toàn, trò được phép tự chạy (chỉ đọc tên biến + độ dài, KHÔNG đọc value)
powershell -NoProfile -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1
```
**Sau bước 1-4: đóng và MỞ LẠI terminal / Claude Code session** (env User cần process mới mới thấy — registry-set
không tự refresh vào process đang chạy dở, dù thực tế trong phiên làm việc gốc, mỗi tool-call mới của Claude Code
lại spawn process mới nên thường thấy ngay không cần đợi — an toàn nhất vẫn là mở lại nếu nghi ngờ).

## Bootstrap AWS lần đầu (máy hoàn toàn mới, chưa có key nào)
1. Đăng nhập AWS Console bằng root (email + password chủ tài khoản) → **IAM → Users → Create user** → tên
   `devops-lab-user` → Attach policy `AdministratorAccess` → Security credentials → Create access key (CLI) → copy
   Access Key ID + Secret.
2. Set 2 giá trị đó qua `set-devops-creds.ps1` (phần AWS) — KHÔNG cần chạy `provision-aws-lab.ps1` (script đó dùng
   để NÂNG CẤP từ root key có sẵn lên IAM user, không phải để tạo từ số 0 không có gì).
3. (Máy đã từng chạy `provision-aws-lab.ps1` swap root→IAM rồi, và thầy dùng LẠI đúng account AWS đó ở máy mới) →
   chỉ cần lấy lại Access Key của `devops-lab-user` đã tồn tại (IAM Console → Users → devops-lab-user → Security
   credentials → Create access key, vì secret cũ không xem lại được) rồi set qua `set-devops-creds.ps1`.

## ⚠️ Lưu ý riêng Azure — 2 lần đăng nhập KHÔNG phải 1
`az login` (session CLI bình thường) và đăng nhập **portal.azure.com trên trình duyệt** là **2 session hoàn toàn
tách biệt** — login 1 cái KHÔNG refresh cái kia. Ngoài ra, tạo Service Principal cần gọi **Microsoft Graph API**
(`az ad sp create-for-rbac`), và nếu tenant có bật MFA-conditional-access, `az login` thường (không kèm `--scope`)
CÓ THỂ không đủ quyền gọi Graph → lỗi `AADSTS50076` → phải `az login --tenant <id> --scope
"https://graph.microsoft.com//.default"` (đăng nhập lại LẦN 2, tương tác, mở trình duyệt riêng) mới tạo SP được.
**RBAC propagation delay:** ngay sau `az ad sp create-for-rbac` xong, role Contributor vừa gán có thể mất
**~30 giây** mới có hiệu lực toàn hệ thống — nếu verify identity ngay lập tức báo "No subscriptions found", đợi
30s rồi thử lại, KHÔNG phải lỗi thật.

## ⚠️ Lưu ý riêng GCP — service-account KEY bị chặn, dùng ADC thay thế
Nhiều project/account GCP (đặc biệt account cá nhân không có Cloud Identity Organization, project auto-tạo kiểu
"My First Project") có **Org Policy `constraints/iam.disableServiceAccountKeyCreation` bật mặc định ở tầng
platform** — KHÔNG override được ở project scope dù có role Owner. `provision-gcp-lab.ps1` sẽ TỰ PHÁT HIỆN lỗi này
(`FAILED_PRECONDITION: Key creation is not allowed`) và tự động chuyển hướng dẫn dùng **ADC**
(`gcloud auth application-default login` — dùng chính OAuth user login, không tạo file key tĩnh nào, an toàn hơn).
Đây CHÍNH LÀ "Cách 2" mà nội dung khóa học tự document sẵn trong field `# hints`/`# rubric` các lesson GCP-security.
`GOOGLE_APPLICATION_CREDENTIALS` có thể để TRỐNG khi dùng ADC (Terraform tự tìm ADC ở path mặc định
`%APPDATA%\gcloud\application_default_credentials.json`) — `verify-devops-creds.ps1` coi GCP READY khi có 1 trong 2
(key-file HOẶC ADC) + `GOOGLE_PROJECT`.

## Bảng biến env đầy đủ

### AWS
| Var | Mục đích | Lấy ở đâu |
|---|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Terraform provider auth (IAM user `devops-lab-user`, KHÔNG root) | `provision-aws-lab.ps1` (nâng cấp từ root) hoặc tạo tay lần đầu (xem Bootstrap) |
| `AWS_REGION` / `AWS_DEFAULT_REGION` | Mặc định `us-east-1` | `set-devops-creds.ps1` hỏi, Enter = mặc định |
| `AWS_SESSION_TOKEN` (optional) | Chỉ nếu dùng STS/SSO tạm thời | Bỏ qua nếu dùng long-lived access key |

**⚠️ Ngoại lệ cần root:** lesson `5-aws-iam-and-security-deep/2-organizations-scp` gọi `organizations:CreateOrganization`
— bước bootstrap đầu tiên bật AWS Organizations bị AWS giới hạn CHỈ root được làm (không phải do thiếu policy).

### DigitalOcean
| Var | Mục đích | Lấy ở đâu |
|---|---|---|
| `DIGITALOCEAN_TOKEN` | Terraform provider auth (PAT) | DO Console → API → Generate New Token (full access — DO không có scope least-privilege token) |
| `SPACES_ACCESS_KEY_ID` / `SPACES_SECRET_ACCESS_KEY` | Riêng cho Spaces (S3-compatible) | DO Console → API → Spaces Keys → Generate New Key |

### GCP
| Var | Mục đích |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path JSON key — chỉ set khi key-creation KHÔNG bị chặn (hiếm với account cá nhân); để trống nếu dùng ADC |
| `GOOGLE_PROJECT` | Project ID dùng cho lab (`provision-gcp-lab.ps1` hỏi, Enter = lấy default `gcloud config`) |
| *(không phải env var)* ADC tại `%APPDATA%\gcloud\application_default_credentials.json` | Phương án THẬT SỰ dùng khi key bị chặn — set qua `gcloud auth application-default login` |

**⚠️ Ngoại lệ cần tay:** lesson `12-gcp-iam-and-security-deep/2-org-policy-and-folders` cần quyền cấp **Organization**
(Org Policy Admin + Folder Admin ở node Organization) — script chỉ cấp project-scope. Nếu thầy là Org Admin, tự gán
thêm role cho identity đang dùng qua Console.

### Azure
| Var | Mục đích |
|---|---|
| `ARM_CLIENT_ID` / `ARM_CLIENT_SECRET` | Service Principal `devops-lab-sp` (Contributor, scope 1 subscription) |
| `ARM_SUBSCRIPTION_ID` | Subscription dùng cho lab |
| `ARM_TENANT_ID` | Entra ID tenant |

**⚠️ Ngoại lệ cần tay:** lesson `16-azure-iam-and-security-deep/2-management-group-and-azure-policy` cần quyền ở
**Tenant Root Management Group** — SP scope-subscription không đủ. Nếu thầy là tenant admin, tự gán qua Azure
Portal → Management Groups → Tenant Root Group → Access control (IAM).

---

## Rủi ro cần nhớ
- **Tốn tiền thật** — nhiều lesson tự ghi rõ chi phí (Aurora ~1-2h paid, Spanner ~1.36 USD/giờ...). Chạy theo batch
  nhỏ, `destroy` ngay sau verify.
- **KHÔNG dùng account/quyền chính** — dùng IAM user/SA/SP riêng cho lab (đã làm), dễ thu hồi khi xong.
- **File JSON GCP (nếu có) là secret thật** — chỉ để trong `scratch/creds/` (gitignored), KHÔNG commit, KHÔNG di
  chuyển ra khỏi `scratch/`.

## Dọn khi xong (rotate / thu hồi — làm trên TỪNG máy đã setup)
- AWS: xoá access key của `devops-lab-user` trong IAM Console (giữ hoặc xoá luôn user tuỳ ý).
- DO: revoke token + Spaces key trong DO Console.
- GCP: nếu có key file → `gcloud iam service-accounts delete devops-lab-sa@<PROJECT>.iam.gserviceaccount.com`; nếu
  dùng ADC → `gcloud auth application-default revoke`.
- Azure: `az ad sp delete --id $env:ARM_CLIENT_ID`.
- Cả 4: xoá env var bằng `[Environment]::SetEnvironmentVariable("<NAME>", $null, 'User')` cho từng biến trên MÁY ĐÓ.
