# DevOps — Lab code rules (HCL / YAML / bash) · delta-on-generic

> **TỰ-ĐỦ.** "Code" của DevOps = **lab artifact hạ tầng** (Terraform HCL · k8s/CI/compose YAML · bash/shell), KHÔNG phải backend app 4-lang. Nguyên tắc chung code↔docs (diff=0, Loop code↔docs) đọc `../fullstack/coding.md`; file này = **DevOps deltas**. Domain → `domain.md`.

## 1. Lang = agnostic infra (KHÔNG 4-lang)
- **HCL** (Terraform) · **YAML** (k8s manifest / Helm / CI pipeline / docker-compose) · **bash/shell** (lab script). KHÔNG ts/java/csharp/go.
- `# codeImplementations` root = **RỖNG** (pure-infra, không có equivalent 4-lang).

## 2. Grounding CỨNG — Terraform Registry / API docs thật
- Mọi `resource`/`data`/argument HCL PHẢI theo **Terraform Registry** (provider version ghim, vd `hashicorp/aws ~> 5.0`); k8s theo API version thật; CLI theo docs provider. **CẤM bịa argument/flag** — sai 1 argument quyền = lỗ hổng bảo mật thật.
- Snippet §2.1.3 trong body = **diff=0** với `.repo/<repo>/<lesson>/*.tf` (hoặc manifest). Loop code↔docs như FS (Sonnet đối chiếu, quyết khi lệch).
- **Comment trong code (HCL/YAML/bash) = English-only** (như mọi khóa). Content hiện có vài comment tiếng-Việt-không-dấu (`# Day la enabler…`) = **drift → sửa English** khi audit.

## 3. Layout repo lab (per lesson)
- **Terraform:** `main.tf` (resource/provider) · `variables.tf` · `outputs.tf` (+ `versions.tf` ghim provider). Provider **tự tìm credential** (env `AWS_ACCESS_KEY_ID/…` → `~/.aws/credentials` → IAM role) — **KHÔNG hardcode key vào `.tf`**.
- **K8s:** manifest (Deployment/Service/…) hoặc Helm chart / kustomize overlay; probe + resources/limits bắt buộc (grounded rule production).
- **CI:** pipeline file (`.github/workflows/*.yml` / `Jenkinsfile` / `.gitlab-ci.yml`).
- **Repo OFF-BY-ONE:** `devops-mastery-module-<N+1>-<slug>` (slot 2 → module-3).

## 4. E2E lab — offline done · cloud require-creds (xem `contents.md §3`)
- **Offline (chạy THẬT → done):** `terraform fmt -check` · `validate` · `init` (tải provider) · `docker build/run --rm` · `kind`/`minikube` local · `kubectl apply` lên cluster local.
- **Cloud (require-creds — KHÔNG chạy thật):** `terraform plan/apply/destroy` lên cloud account · `kubectl` lên EKS/GKE/AKS thật · deploy provider thật. Ghi env cần + output kỳ vọng → thầy nạp cred chạy nốt. **CẤM fake `-done`.**
- **State secret:** output `sensitive`; secret trong state = nhắc rõ (không commit `terraform.tfstate` có secret).

## 5. Gate liên quan
`./.claude/docs/check-lesson.ps1` — DevOps **BỎ `fe-vite-clean`** (không FE). Code diff=0 verify bằng Loop code↔docs. Verify `terraform validate` Success + (cloud) flow ghi require-creds đúng env trước khi PASS.
