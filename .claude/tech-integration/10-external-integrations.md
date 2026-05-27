# 10 — External integrations

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **Axios** | `src/modules/axios/` | Wraps axios + axios-retry, global HTTP client. |
| **GitHub** | `src/modules/github/` | octokit wrapper — PR/commit operations cho challenge submission. |
| **Google APIs** | `src/modules/googleapis/` | Sheets/Docs/Drive. Dùng cho `process-google-docs-submission` processor. |
| **Solana** | (deps: `@solana/web3.js`, `bn.js`) | Crypto wallet ops, có thể nằm trong `modules/crypto/` hoặc business. |

## Submission processors liên quan

- `src/features/api/processors/process-git-submission/` — Pull repo PR, chấm.
- `src/features/api/processors/resolve-github/` — Resolve repo metadata (owner, default branch, …).
- `src/features/api/processors/process-google-docs-submission/` — Pull Docs content, parse.

## Khi cần thêm 1 external API mới

1. Tạo module `src/modules/<vendor>/` theo pattern 3-file.
2. Provider trong `<vendor>.providers.ts` wrap SDK client + inject credentials qua `EnvModule`.
3. Service expose method gọn (không lộ raw SDK type ra ngoài).
4. Nếu có webhook → thêm controller vào `src/features/api/core/http/<vendor>/`.
