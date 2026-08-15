# SECRETS MAP — StarCi Academy GitHub auth

> ⚠️ File này là **BẢN ĐỒ**, KHÔNG chứa value secret. (Nằm trong `.mount/` đã gitignore.)
> Quy tắc: client ID = công khai → ghi thẳng. Client secret / PAT = chỉ ghi **chỗ-lưu**, không ghi value
> (file mà lộ là mất sạch). Set value bằng `scratch/set-secrets.ps1` (đọc từ biến env thầy `setx`).

## GitHub OAuth (login) + Org PAT

| Key | Bí mật? | Value sống ở đâu | Biến env (set-secrets) | Mục đích |
|---|---|---|---|---|
| **OAuth Test — client id** | không | `.env.override` → `GITHUB_CLIENT_ID=Ov23li5w0Z4OaI4lyjgf` | — | login **LOCAL** |
| **OAuth Test — client secret** | CÓ | LOCAL file `.mount/terraform/github-secret-key.key` | `GH_OAUTH_LOCAL` | login **LOCAL** |
| **OAuth StarCi Academy — client id** | không | Actions **var `_GITHUB_CLIENT_ID`** = `Ov23litbAC9Wd06iTeQH` (đã set; deploy map ra env `GITHUB_CLIENT_ID`). Tên var có `_` vì GitHub cấm prefix `GITHUB_`. | — | login **PROD** |
| **OAuth StarCi Academy — client secret** | CÓ | VPS `/root/academy/.mount/terraform/github-secret-key.key` | `GH_OAUTH_PROD` | login **PROD** |
| **Org PAT** (add-team / repo) | CÓ | local + VPS `…/.mount/terraform/github-access-token.key` | `GH_PAT` | đổi visibility repo · add người mua vào team |

- PAT scope cần: `repo` + `admin:org`. Dùng SAME PAT cho local + prod (hoặc tách nếu muốn).
- Mount → container: VPS `/root/academy/.mount` ↔ `/usr/src/app/.mount` (xem `apps/core/vps-compose.yaml`).

## Rotate log (đánh dấu khi đổi)

| Ngày | Key đổi | Lý do |
|---|---|---|
| 2026-06-23 | (TODO) PAT + 2 OAuth secret + root VPS pw | đã lộ plaintext trong chat — phải rotate |

## AI key pools (balancer — `.mount/terraform/keys/*.key`, 1 key/dòng)

> Pool key của AI balancer (KHÁC `TERRAFORM_*_API_KEY` đơn lẻ). `keysFilePath` trong catalog
> `.mount/data/ai-models/*` = bare filename, resolve vào `AI_KEYS_DIR_MOUNT_PATH`
> (default `.mount/terraform/keys/`). Container resolve `/usr/src/app/.mount/terraform/keys/`.

| File | Provider | Biến env override | Dùng cho |
|---|---|---|---|
| `open-api-keys.key` | openai | `AI_KEYS_OPENAI_MOUNT_PATH` | chấm bài (economy/balanced) |
| `gemini-api-keys.key` | gemini | `AI_KEYS_GEMINI_MOUNT_PATH` | chấm bài (premium) |
| `local.key` | local (Ollama) | `AI_KEYS_LOCAL_MOUNT_PATH` | chatbot free (self-hosted Qwen) |
| `openrouter-api-keys.key` | openrouter | `AI_KEYS_OPENROUTER_MOUNT_PATH` | **chatbot free** (Qwen-14B fallback). Base URL `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`). |

- **OpenRouter + Anthropic (2026-06-29):** set qua script `scratch/set-ai-keys.ps1` (env-in → ghi file,
  chỉ in size). `setx OPENROUTER_KEYS "<...>"` + `setx ANTHROPIC_KEYS "<...>"` (nhiều key tách bằng `;`),
  rồi `.\scratch\set-ai-keys.ps1` (local) / `-Prod` (đẩy VPS + restart core). KHÔNG cần đổi compose
  (default base URL + keys dir đã đúng). Catalog: `.mount/data/ai-models/` (6 = qwen-14b · 7-9 = free ·
  10 = Opus 4.8 anthropic · 11 = gpt-5 · 12 = gemini-3-pro).

## Local model-quality harness (process-only, không thuộc key pool)

| Biến env | Phạm vi | Mục đích |
|---|---|---|
| `HARNESS_OPENROUTER_API_KEY` | Chỉ process chạy `npm run harness` | Gọi trực tiếp model SUT đã khóa trong từng harness suite. |
| `HARNESS_OPENROUTER_JUDGE_API_KEY` | Chỉ process chạy `npm run harness` | Gọi trực tiếp Luna judge cho các câu trả lời free-form. |

- Không ghi value vào repository, `.env`, `.mount`, GitHub Actions hoặc production AI key pool.
- SUT và judge là hai authority bắt buộc, độc lập; code không được suy ra hoặc fallback từ biến này sang biến kia.
- Người vận hành có thể chủ động map cùng một OpenRouter server key đã được cấp quyền vào cả hai biến của
  process local, nhưng phải khai báo cả hai biến một cách tường minh.
- Harness gọi provider có tính phí và không chạy trong CI mặc định.

## Các secret khác (tham chiếu — không ghi value)

Toàn bộ key khác (AI keys, payment SePay/PayOS/PayPal/Stripe, Keycloak, Judge0, Brevo SMTP, GCP, Qdrant,
DB/Redis/ES/Scylla password…) định nghĩa ở `src/modules/env/config.ts` (pattern `TERRAFORM_*_MOUNT_PATH`
→ file trong `.mount/terraform/`). Deploy đọc path qua `vars` trong `.github/workflows/deploy-core-vps.yml`.
