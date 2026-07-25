# Domain — DevOps Mastery (`2-devops-mastery`)

> Đặc tả DOMAIN khóa DevOps. **Grounded** từ 35 module thật + meta khóa. Rules **ĐỦ** (`contents.md`/`challenges.md`/`coding.md` cùng thư mục — soạn 2026-07-09, grounded từ content thật + `decision.md` rulings). Xem thêm memory [[devops-audit-task]] (M1 rulings, no-admin CLI install trick). **Runner `audit-devops-module.js` ĐÃ CÓ** (`.claude/docs/workflows/`, soạn 2026-07-10) — mirror FS/SD nhưng có thêm **CREDENTIAL GATE** (phase riêng trước Apply, HALT bắt buộc nếu module cần cloud mà máy chưa set key — xem `creds/README.md`).

## 1. Định vị
- **Outcome:** DevOps/SRE thực chiến — vận hành hạ tầng production đa cloud.
- **Trục domain (meta khóa):** Linux & Networking cho SRE → **Terraform IaC** → đào sâu **4 cloud** (AWS/GCP/Azure/DO) **terraform-first** (mỗi component giải thích TỪNG argument, grounded **Terraform Registry** thật) → Docker/K8s → CI-CD/GitOps → Observability/SRE → production topics. **Học qua LAB THẬT:** `terraform apply` lên cloud account thật rồi `destroy` sạch; Linux lab trong container disposable.

## 2. Bản đồ giáo trình (25 module: 0–24 — grounded)
> **2026-07-24:** module 17–34 cũ (18 module mỏng, Docker → Backup-DR) đã **gộp thành 8 module** (17–24) — giữ trọn 73 lesson. Map dưới là bản SAU gộp. Không còn module 25–34.
| Cụm | Module |
|---|---|
| **Nền tảng** | 0 linux-fundamentals · 1 terraform-fundamentals |
| **AWS** | 2 aws-foundations · 3 aws-compute · 4 aws-managed-services · 5 aws-iam-security-deep |
| **DigitalOcean** | 6 do-foundations · 7 do-compute · 8 do-managed-services |
| **GCP** | 9 gcp-foundations · 10 gcp-compute · 11 gcp-managed-services · 12 gcp-iam-security-deep |
| **Azure** | 13 azure-foundations · 14 azure-compute · 15 azure-managed-services · 16 azure-iam-security-deep |
| **Container + K8s** | 17 containers-and-oci · 18 kubernetes-core-and-internals · 19 managed-kubernetes-and-helm |
| **CI/CD + GitOps** | 20 cicd-pipelines · 21 gitops-and-progressive-delivery |
| **Security** | 22 identity-secrets-and-supply-chain-security |
| **Observability + SRE** | 23 observability · 24 reliability-alerting-autoscale-and-backup-dr |

### 2a. Tên repo GitHub CHÍNH DANH mỗi module (SSOT — off-by-one: folder slot N → `devops-mastery-module-<N+1>-<slug mới>`)
> **BẮT BUỘC** khi gen/audit sinh clone URL. KHÔNG được bịa tên cũ (`github-actions`, `jenkins`, `argocd`, `kubernetes-internals`, `docker-and-oci-deep-dive`…). Mỗi module chỉ có ĐÚNG 1 repo:
| Module (folder) | Repo GitHub chính danh |
|---|---|
| 17-containers-and-oci | `devops-mastery-module-18-containers-and-oci` |
| 18-kubernetes-core-and-internals | `devops-mastery-module-19-kubernetes-core-and-internals` |
| 19-managed-kubernetes-and-helm | `devops-mastery-module-20-managed-kubernetes-and-helm` |
| 20-cicd-pipelines | `devops-mastery-module-21-cicd-pipelines` |
| 21-gitops-and-progressive-delivery | `devops-mastery-module-22-gitops-and-progressive-delivery` |
| 22-identity-secrets-and-supply-chain-security | `devops-mastery-module-23-identity-secrets-and-supply-chain-security` |
| 23-observability | `devops-mastery-module-24-observability` |
| 24-reliability-alerting-autoscale-and-backup-dr | `devops-mastery-module-25-reliability-alerting-autoscale-and-backup-dr` |

## 3. Quy ước RIÊNG domain (khác FS/SD — đề xuất, chốt khi soạn contents.md)
- **Lang = agnostic infra:** HCL (Terraform) · YAML (k8s/CI/compose) · bash/shell. KHÔNG 4-lang (ts/java/csharp/go) — DevOps không có "backend stack" per-lang.
- **E2E = LAB THẬT, 2 kiểu:**
  - **Cloud IaC** → `terraform apply` lên account thật → verify → **`terraform destroy` sạch**. Đụng cloud account = **require-creds** (thầy quăng cred → chạy nốt); grounded **Terraform Registry** (argument thật, không bịa).
  - **Local disposable** → Linux/Docker/K8s lab trong container/kind/minikube (không cần cloud) → cleanup.
- **Credential setup (2026-07-10, cả 4 cloud) → `.claude/docs/rules/devops/creds/`** (TRACKED trong git, portable qua mọi máy — README + 5 script provision/verify/set). Đổi máy PHẢI chạy lại (env var + CLI login gắn máy cụ thể), nhưng *cách làm* đi theo repo. Xem README trong thư mục đó cho quy trình đầy đủ + các gotcha đã gặp (GCP SA-key bị Org Policy chặn → dùng ADC; Azure cần 2 lần login MFA riêng + đợi ~30s RBAC propagate).
- **Grounding CỨNG:** mỗi component cloud/terraform giải thích **từng argument** theo Registry/docs thật — KHÔNG paraphrase/bịa flag.
- **Repo/scaffold:** lab dir per lesson (terraform module / k8s manifest / CI pipeline). Kiểm visibility repo theo `migrate-github.md`.
- **§2.1.5:** flow = "apply → verify (kubectl/aws cli/curl) → destroy"; flow cuối = failure/rollback (drift, failed apply, DR restore).

## 4. Capstone (milestones)
20 milestone (đã có content) — dựng + vận hành hạ tầng production (IaC → cluster → CI/CD → observability → DR). Soạn quy ước task khi audit (bám `check-task.mjs`).

## 5. Cho gen/audit
- **Rules ĐỦ:** `contents.md` (delta: agnostic-only · table no-Port · §2.1.3 HCL+Registry · offline-done/cloud-require-creds · repo off-by-one) · `challenges.md` (agnostic bucket · tác vụ infra · criteria đo cơ chế ops) · `coding.md` (HCL/YAML/bash · Registry grounding). Đọc TRƯỚC khi audit/gen.
- Phân biệt module **cloud-provider** (4 cloud, lặp foundations/compute/managed/iam) vs **tool** (docker/k8s/CI) vs **SRE-practice** (observability/SLO/DR) → depth + lab khác nhau.
- **Invoke runner:** `Workflow({ scriptPath: ".claude/docs/workflows/audit-devops-module.js", args: { module: "<slug>", stage: "review"|"apply", opus?, only?, cloud? } })`. `args.cloud` override thủ công module→cloud mapping (mặc định tự suy từ tên module: `2-5-aws-*`→aws, `6-8-do-*`→digitalocean, `9-12-gcp-*`→gcp, `13-16-azure-*`→azure, `0-1`→offline/no-cloud).
- **CREDENTIAL GATE (STRICT, thầy chốt 2026-07-10):** stage=apply mà module cần cloud X → runner tự chạy `verify-devops-creds.ps1`, nếu X **chưa READY** → **HALT ngay, KHÔNG chạy tiếp**, log rõ lệnh `provision-X-lab.ps1` cần chạy. KHÔNG âm thầm hạ xuống `require-creds` hay bỏ qua — "check keys rồi vô flow, máy nào chưa có thì bắt set bằng ps1".
- Cloud lab (khi key READY) = chạy e2e **THẬT** (`apply`→verify→`destroy`), KHÔNG còn giả `require-creds`; local lab (Linux/Terraform-fundamentals) = luôn tự chạy được, không cần key.
- **1 nợ còn lại:** content §2.1.5 hiện `##### 2.1.5.x` (pre-accordion) — runner đã bake sẵn hướng dẫn tự chuyển sang `::::accordion` trong Loop/Decision khi dụng tới lesson đó (không cần script refactor riêng như fs/sd).
- **✅ 17 module Foundation+4Cloud đã apply+e2e thật xong (2026-07-10).** Playbook đầy đủ (fix-pass e2e-gap, credential-gate HALT thật-vs-giả, milestone 2-pass, push nhiều repo, cleanup 4 cloud cuối phiên) → xem **`apply-playbook.md`** cùng thư mục.
- **✅ Milestone quality audit (đào sâu sư phạm) ĐÃ XONG (2026-07-10)** — 100 task chấm: 19 DUYỆT, 81 CẦN SỬA. Fix-pass đã chạy (20 agent, mỗi cái đọc trọn 5-task/milestone để sửa nhất quán xuyên-task, không sửa lẻ). Kết quả: đa số finding "mâu thuẫn tên resource xuyên task" + bug kỹ thuật rõ ràng đã SỬA THẲNG; finding cần quyết định kiến trúc/phạm vi rộng thì CHỈ ghi note ẩn (HTML comment, không hiện khi render) — tìm bằng `grep -rE "cần chủ nhiệm|cần thầy|AUDIT" .mount/data/courses/2-devops-mastery/milestones --include=vi.md -l` (55 file có note). Gate re-verify 100/100 PASS sau fix. Đầy đủ finding gốc → `milestone-quality-findings-2026-07-10.md` cùng thư mục. Runner tái dùng được cho khóa khác → `milestone-quality-audit-PROPOSAL.md`.
