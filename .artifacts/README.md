# `.artifacts/` — artifact động + CONFIG nguồn (BE)

`.claude/` là rule read-only; cái skills sinh ra (state audit code-style…) + **con trỏ nguồn** sống ở đây.

## `config.json` — SKILL đọc để biết source ở đâu (KHÔNG hard-code ổ đĩa)
Skills FE/BE tham chiếu 2 biến, resolve từ file này (mỗi máy tự khai path thật):
- **`$FE_SOURCE`** = `feSource` — repo FE (`starci-academy`, có `.storybook/`, `.artifacts/`).
- **`$BE_SOURCE`** = `beSource` — repo BE (`starci-academy-backend`, chính repo này).

`config.json` **gitignore** (per-machine). Copy `config.example.json` → `config.json` và điền path máy bạn.

## `states/`
State + log incremental của `starci-be-patterns-audit` (`patterns-audit-be.{json,md}`).
