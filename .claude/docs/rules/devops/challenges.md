# DevOps — Challenge rules · delta-on-generic

> **TỰ-ĐỦ.** Challenge DevOps dùng **CHUNG cấu trúc V2 với Fullstack** — đọc **`../fullstack/challenges.md`** trước (H1 order, item-major requirements/steps/outputs/prerequisites, `:::muted` callout, score=100, criteria Σ30+Σ70 ≥1 critical, submissions skeleton, gate §9.7). File này = **DevOps deltas**. Domain → `domain.md`. Thuật ngữ → `../terminology-bold.md`.

## 1. Lang bucket = `agnostic` (STRICT)
- MỌI challenge DevOps: `### langs` / `##### lang` = **`agnostic`** (KHÔNG ts/java/csharp/go). Grounded: challenge thật (`2-aws-foundations`) dùng `agnostic` cho requirements/steps/outputs/prerequisites.
- Submission = **thứ học viên NỘP để chứng minh vận hành** (repo terraform / manifest k8s / pipeline CI / screenshot output `terraform plan` / kết quả `kubectl`) — KHÔNG phải code app githubUrl như FS.

## 2. Đề challenge = tác vụ INFRA thật (không phải viết feature)
- 4 tier easy+medium+hard+insane (như FS). Loại tác vụ theo domain:
  - **easy:** viết 1 block terraform / 1 manifest đúng argument (vd IAM user-in-group least-privilege).
  - **medium:** cấu hình nhiều resource + ràng buộc (sensitive output, state secret, dependency).
  - **hard:** hardening / least-privilege siết theo ARN / multi-resource + policy · CI pipeline có gate.
  - **insane:** production depth thật — drift detection + import, blue-green/canary, DR restore, multi-region, supply-chain (signed image + provenance). KHÔNG gượng, KHÔNG bỏ tier cho đủ số.
- Ground **Terraform Registry / API docs** — đề + criteria đo cơ chế THẬT (không bịa argument).

## 3. Criteria — đo cơ chế OPS thật (không chung chung)
- Vẫn Σ`outcomeCriterias`=30 + Σ`approachCriterias`=70 (≥1 `critical:true`=40). Mỗi criteria nêu **Kiểm gì / Bằng chứng quan sát / Fail nếu**, neo vào tín hiệu infra:
  - least-privilege: "policy CHỈ có action đọc, 0 `Create/Delete/Put`; Fail nếu có `*:*` hoặc `AdministratorAccess`".
  - state secret: "`terraform plan` đánh dấu `sensitive`; secret KHÔNG lộ plaintext trong log/output".
  - idempotent: "`apply` lần 2 = `0 to add, 0 to change, 0 to destroy`".
  - clean teardown: "`destroy` xoá hết, `plan` sau destroy = no resource".
  - k8s: "probe/resources/limits có; rollout `kubectl rollout status` = success".

## 4. Verify challenge = require-creds cho cloud
- Challenge đụng cloud (apply thật) → verdict/verify = **require-creds** (như §2.1.5 content — xem `contents.md §3`). Offline (fmt/validate/plan-no-apply) verify được. KHÔNG fake pass cloud apply.

## 5. Gate
`./.claude/docs/check-lesson.ps1 -Path <module-dir>` — như FS: score=100 · verified · no `# references`/`# submissions` inline · no `### N.` · Σ30+Σ70 · ≥1 critical · separator chẵn · vn-có-dấu. PASS structure mới duyệt ngữ nghĩa (reviewer mặc định Sonnet 5).
