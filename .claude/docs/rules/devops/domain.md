# Domain — DevOps Mastery (`2-devops-mastery`)

> Đặc tả DOMAIN khóa DevOps. **Grounded** từ 35 module thật + meta khóa. Rules **ĐỦ** (`contents.md`/`challenges.md`/`coding.md` cùng thư mục — soạn 2026-07-09, grounded từ content thật + `decision.md` rulings). Xem thêm memory [[devops-audit-task]] (M1 rulings, no-admin CLI install trick). **Runner `audit-devops-module.js` ĐÃ CÓ** (`.claude/docs/workflows/`, soạn 2026-07-10) — mirror FS/SD nhưng có thêm **CREDENTIAL GATE** (phase riêng trước Apply, HALT bắt buộc nếu module cần cloud mà máy chưa set key — xem `creds/README.md`).

## 1. Định vị
- **Outcome:** DevOps/SRE thực chiến — vận hành hạ tầng production đa cloud.
- **Trục domain (meta khóa):** Linux & Networking cho SRE → **Terraform IaC** → đào sâu **4 cloud** (AWS/GCP/Azure/DO) **terraform-first** (mỗi component giải thích TỪNG argument, grounded **Terraform Registry** thật) → Docker/K8s → CI-CD/GitOps → Observability/SRE → production topics. **Học qua LAB THẬT:** `terraform apply` lên cloud account thật rồi `destroy` sạch; Linux lab trong container disposable.

## 2. Bản đồ giáo trình (35 module — grounded)
| Cụm | Module |
|---|---|
| **Nền tảng** | 0 linux-fundamentals · 1 terraform-fundamentals |
| **AWS** | 2 aws-foundations · 3 aws-compute · 4 aws-managed-services · 5 aws-iam-security-deep |
| **DigitalOcean** | 6 do-foundations · 7 do-compute · 8 do-managed-services |
| **GCP** | 9 gcp-foundations · 10 gcp-compute · 11 gcp-managed-services · 12 gcp-iam-security-deep |
| **Azure** | 13 azure-foundations · 14 azure-compute · 15 azure-managed-services · 16 azure-iam-security-deep |
| **Container + K8s** | 17 docker-and-oci-deep-dive · 18 kubernetes-core · 19 kubernetes-internals · 20 kubernetes-on-cloud-eks · 33 helm-and-kustomize |
| **CI/CD + GitOps** | 21 github-actions · 22 jenkins · 23 argocd · 24 gitlab-ci · 32 progressive-delivery |
| **Security** | 25 cloud-identity-and-secrets · 26 devsecops-and-supply-chain |
| **Observability + SRE** | 27 metrics-prometheus-grafana · 28 logging-aggregation · 29 distributed-tracing-otel · 30 alerting-slo-oncall · 31 autoscaling-capacity · 34 backup-dr-business-continuity |

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
- **⏸ Milestone quality audit (đào sâu sư phạm) HOÃN** — gate + chuẩn hoá cơ học đã xong 100/100 sạch, phần phán chất lượng (criteria/brief/level-fit) thầy cancel giữa chừng 2026-07-10, chưa chạy xong lần nào → xem **`milestone-quality-audit-PROPOSAL.md`** cùng thư mục (có sẵn script chạy lại).
