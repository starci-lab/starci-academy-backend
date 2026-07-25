# DevOps — Content (lesson body) rules · delta-on-generic

> Bản **TỰ-ĐỦ** để audit/viết content lesson **DevOps Mastery** trong `.claude/docs`. DevOps dùng **CHUNG skeleton V2 với Fullstack** — đọc **`../fullstack/contents.md §1–§3`** trước (bố cục file, template heading `2.1.1–2.1.7`, theory=2, interview `3.1`, separator, code diff=0). File này CHỈ liệt kê **DevOps deltas**. Domain khóa → `domain.md` (cùng thư mục). Thuật ngữ+bold → `../terminology-bold.md`. Challenge → `challenges.md`. Code lab → `coding.md`. Quy trình → `../../pipeline.md`.
>
> **Grounded từ content THẬT** (0-linux-fundamentals, 2-aws-foundations) + rulings trong `decision.md` các lesson đã audit.

---

## 0. Variant & lang (LÀM ĐẦU TIÊN)
- **Lang = `agnostic` LUÔN** (`bodies/0-agnostic/`). DevOps KHÔNG có "backend stack" per-lang → **KHÔNG 4-lang** (ts/java/csharp/go), **KHÔNG FE-Vite**.
- **Root wrapper `vi.md`/`en.md`:** `# body`/`# codeExplaining`/`# codeImplementations` **RỖNG** (pure-infra agnostic — không có codeImpl 4-lang). `references ≥2`. Ghi `audited.md: codeImplementations skipped (pure-infra agnostic)`.
- **2 variant theo loại lab:**
  | Variant | Khi nào | Lab / e2e |
  |---|---|---|
  | **Pure-IaC (terraform)** | cloud provider (AWS/GCP/Azure/DO), terraform-first | `fmt → validate → init` offline · `plan/apply/destroy` cần cred |
  | **Tool-local (Linux/Docker/K8s)** | linux, docker, k8s, CI, observability chạy được local | container disposable (`docker run --rm`) · kind/minikube |

## 1. Heading — CHUNG với FS (đọc `../fullstack/contents.md §2`)
SD/DevOps dùng **nguyên văn** scheme: `## 1 → ## 2 (2.1 Thực hành: 2.1.1…2.1.7 · 2.2 Lý thuyết = 2 mục) → ## 3 (3.1 interview)`. Code-walkthrough `##### 2.1.3.x`. KHÔNG biến thể heading riêng.

- **Ngoại lệ 6-section cho Tool-local KHÔNG có code-walkthrough riêng:** khi bài Tool-local không có mục "2.1.3 code" (manifest/script được giải thích qua field `codeExplaining` riêng, không nhồi `##### 2.1.3.x` trong body), `2.1.3` trở thành "Chuẩn bị & khởi chạy" và cả cụm lùi 1 bậc: test = `2.1.4`, cleanup = `2.1.5`, further-reading = `2.1.6` (thay vì `2.1.5`/`2.1.6`/`2.1.7` chuẩn). Đây là biến thể chính đáng, KHÔNG phải lỗi thiếu §2.1.3 — audit theo đúng số heading thực tế của bài, không báo nhầm. Hiện đang áp cho `22-identity-secrets-and-supply-chain-security/5-supply-chain-slsa-and-sigstore` + `.../8-policy-as-code-opa-kyverno` (2 lesson đã ruling KHÔNG renumber, ghi nợ ở `check-lesson.ps1` thiếu nhánh nhận diện biến thể này). **KHÔNG còn grounded ở `6-node-runtime-kubelet-kube-proxy-cri`** — lesson đó đã bị "Apply vòng 2" override (Decision vòng 1, 2026-07-24): viết thêm §2.1.3 code-walkthrough thật từ `codeExplaining` sẵn có, dựng lại đúng 7-section chuẩn để qua gate `heading-seq`, không còn dùng biến thể này nữa. Khi audit lesson mới rơi vào tình huống thiếu 2.1.3: ưu tiên **viết code-walkthrough thật** (như node-runtime đã làm) nếu có nội dung `codeExplaining` sẵn để dùng; chỉ giữ biến thể 6-section cho trường hợp thực sự không có gì để walkthrough (daemon hệ thống thuần, như 2 lesson identity-secrets nói trên).

## 2. Deltas per-section (khác FS generic)
| § | DevOps | FS generic |
|---|---|---|
| **2.1.1 source** | clone repo + `cd <repo>/<lesson>`. Ghi RÕ bước nào **offline không cần cloud** (fmt/validate/init) vs **cần cred** (apply). Bài terraform "không dùng Docker" → nói rõ. | clone + cd, docker compose |
| **2.1.2 table** | cột **`Thành phần \| File \| Vai trò`** (pure-IaC KHÔNG có service/port → **KHÔNG cột Port**; ngoại lệ chính đáng của variant terraform-only). File = `main.tf`/`variables.tf`/`outputs.tf` / manifest / pipeline. **Ngoại lệ Tool-local (grounded `6-node-runtime-kubelet-kube-proxy-cri`):** khi thành phần là daemon hệ thống (kubelet/kube-proxy/containerd) không có file cấu hình per-component, cột `File` → đổi thành **`Tool/CLI`** (lệnh dùng để quan sát/verify thành phần, vd `journalctl -u kubelet`, `crictl ps`) — KHÔNG coi là lỗi khi audit variant Tool-local. | `Thành phần \| File \| Vai trò` |
| **2.1.3 code** | **HCL/YAML thật** + **giải thích TỪNG argument theo Terraform Registry** (grounding CỨNG — sai 1 argument quyền = lỗ hổng thật, CẤM bịa flag). `##### 2.1.3.x` nest. | code repo diff=0 |
| **2.1.4.2 run** | terraform: `fmt → validate → init` (offline, chỉ tải provider plugin) → `plan → apply → destroy` (cần access key, KHÔNG root). Linux/local: `docker run --rm -it` disposable container. | `docker compose` + nest start |
| **2.1.5 test** | flow = chạy lệnh + verify (`aws cli`/`kubectl`/`curl`). Flow cuối = failure/rollback (drift / failed apply / DR restore). | 3–5 Luồng |
| **2.1.6 cleanup** | terraform `destroy` (cloud, require-creds) / `docker rm` container / `kind delete`. | docker compose down -v |

## 3. §2.1.5 .e2e status — RULING CỨNG (grounded decision.md)
- **Offline flow** (`fmt`/`validate`/`init`, lệnh local không đụng cloud) → chạy THẬT → **`done`**.
- **Cloud flow** (`plan`/`apply`/`destroy`, tạo/đọc tài nguyên cloud thật) → **`require-creds`** — **KHÔNG apply thật** (tránh tạo IAM/resource thật + rủi ro access key sống). Ghi RÕ env cần (`AWS_ACCESS_KEY_ID/SECRET/REGION`…) + output kỳ vọng → thầy nạp key chạy nốt.
- **CẤM fake `-done` cho cloud flow** (đã dính: 1 lesson ghi "apply + destroy THẬT trên account …, 6 added/6 destroyed" = vi phạm → XOÁ). Cloud apply/destroy = `require-creds`, KHÔNG `done`.
- `.e2e/agnostic/` = 1 file/flow khớp số Luồng body (vd fmt(done)·init(done)·plan(rc)·apply(rc)·destroy(rc)).

## 4. §2.1.5 FORMAT = accordion (chuẩn chung) — ⚠️ content HIỆN pre-accordion
- **Chuẩn (như FS/SD):** §2.1.5 = intro bullet-list + `::::accordion` panels (KHÔNG `##### 2.1.5.x`). Xem `../fullstack/contents.md §3`.
- **HIỆN TRẠNG:** content devops đã author dùng `##### 2.1.5.1. Luồng N` (pre-accordion) — CHƯA có `refactor-devops-accordion-terminology.js`. → **nợ refactor** sang accordion khi audit (mirror `refactor-fs/sd-accordion-terminology.js`). Gate `inline-bullet` vẫn áp.

## 5. Repo + grounding
- **Repo OFF-BY-ONE:** `devops-mastery-module-<N+1>-<slug>` (slot 2 → `module-3`). Verify path trước khi đọc `.tf`.
- **Grounding CỨNG:** mọi resource/argument terraform theo **Terraform Registry** thật; k8s theo API docs; CLI theo docs provider. Code comment (HCL/YAML/bash) = **English-only** (content hiện có vài comment tiếng-Việt-không-dấu = drift → sửa English khi audit).
- **Interview §3.1:** SD/DevOps thường 5–7 câu (FS 3–4).

## 6. Gate
`./.claude/docs/check-lesson.ps1 -Path <module-dir>` — **DevOps BỎ `fe-vite-clean`** (không FE, như SD). Bắt chung: leak · inline-bullet · fence chẵn · theory=2 · có 2.1.7 · `has-bodies` · `vn-có-dấu`. Bài PASS structure mới lên LLM review + đối chiếu §2/§3 deltas (agnostic-only, table no-Port, Registry grounding, cloud-flow=require-creds, repo off-by-one).
