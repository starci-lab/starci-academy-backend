# Audit dịch VI — 22-identity-secrets-and-supply-chain-security

Tầng 3: đọc lại `snippet` gốc trong file thật + đối chiếu §5 (bẫy false-positive) và §2 (polysemy) của
`terminology-bold.md` một cách đối nghịch (mặc định nghi false-positive trừ khi chắc chắn). 18 finding thô từ
tầng 1+2 → 17 CONFIRMED, 1 DROP.

## Bảng finding CONFIRMED

| Lesson | Type | Severity | Snippet | Sửa |
|---|---|---|---|---|
| 0-iam-federation-and-oidc | polysemy-error | high | "Mục đích: lấy **mã nguồn** lab federation bao gồm HCL Terraform..." | Đổi "mã nguồn" → "source code" (giữ English, KHÔNG dịch) — đúng bẫy §5 hàng "source" → "nguồn" (clone source): text hiện tại VẪN đang dùng bản dịch sai "mã nguồn", chưa sửa theo ruling 2026-06-21. |
| 2-kms-and-envelope-encryption | polysemy-error | high | "Mục đích: lấy **mã nguồn** Terraform lab để tạo KMS key thật..." | Cùng lỗi hệ thống — đổi "mã nguồn" → "source code". |
| 3-external-secrets-operator | polysemy-error | high | "Mục đích: lấy **mã nguồn** lab ESO (Helm values + K8s manifest CRD...)" | Đổi "mã nguồn" → "source code". |
| 4-secret-rotation-and-least-privilege | polysemy-error | high | "Mục đích: lấy **mã nguồn** Terraform của lab (providers.tf + vault.tf...)" | Đổi "mã nguồn" → "source code". |
| 5-supply-chain-slsa-and-sigstore | polysemy-error | high | "Mục đích: lấy **mã nguồn** Terraform và script lab để dựng Sigstore stack..." | Đổi "mã nguồn" → "source code" — sweep đồng loạt cả 5 lesson trên (câu mở đầu §2.1.1 lặp y hệt mẫu), đọc lại từng câu để chắc đều đúng ngữ cảnh clone trước khi replace hàng loạt. |
| 2-kms-and-envelope-encryption | bold-inline-code | high | `- **\`description\`** (string, optional) — ...`<br>`- **\`deletion_window_in_days\`** (số nguyên 7-30...)` (dòng 120-125, 152-157) | Bỏ `**` bọc quanh backtick theo §3B.3 — có ~11 dòng cùng pattern định nghĩa attribute Terraform (`description`, `deletion_window_in_days`, `enable_key_rotation`, `tags`, `aws_kms_alias.name`, `aws_kms_alias.target_key_id`, `google_kms_key_ring.location`, `google_kms_crypto_key.key_ring`, `google_kms_crypto_key.rotation_period`, `...prevent_destroy`, `...iam_binding.role`, `...iam_binding.members`). Giữ nguyên inline code trần, bỏ hết `**`. |
| 0-iam-federation-and-oidc | bold-inline-code | med | "- **`aws-cli v2`** đã `aws configure`...<br>- **`gcloud`** đã `gcloud auth login`...<br>- **`jq`** để decode JWT..." (dòng 192-195) | Bỏ `**` quanh 3 dòng inline-code tool name theo §3B.3/§4 DE-BOLD. |
| 3-external-secrets-operator | bold-inline-code | med | "- **`kubectl`** (1.28+) + **`helm`** (3.x) + **`kind`**...<br>- **`aws-cli v2`** đã `aws configure`..." (dòng 203-205) | Bỏ bold quanh cả 5 inline-code tool name (`kubectl`, `helm`, `kind`, `aws-cli v2`, `jq` dòng 205 kế tiếp cũng cùng dạng), theo §3B.3. |
| 4-secret-rotation-and-least-privilege | bold-inline-code | low | "- **`psql`** (tuỳ chọn) — connect PostgreSQL..." (dòng 212) | Bỏ `**` quanh `psql`, giữ inline code trần theo §3B.3/§4. |
| 1-vault-secrets-management | bold-adhoc | med | "- **Luồng 1 — `vault kv put/get`:** Ghi và đọc static secret...<br>- **Luồng 2 — `vault read database/creds/app`:** Sinh dynamic..." (dòng 262-263) | Nhãn "Luồng N —" KHÔNG có trong closed-list §3A.2 (chỉ Phần/Bước/Câu hỏi/Giải pháp/Trade-off/Cơ chế/Lưu ý/persona/README-section được bold). Cần thầy chốt: (a) bổ sung "Luồng N" vào §3A.2 vì đã là convention lặp cố ý toàn module, hoặc (b) de-bold. Chưa chốt nên vẫn báo là finding thật, không tự ý sửa. |
| 0-iam-federation-and-oidc | bold-adhoc | med | "- **Luồng 1 — GitHub Actions assume role AWS qua OIDC:** ...<br>- **Luồng 4 — Failure mode: trust condition `sub` mismatch bị từ chối:** ..." (dòng 256-259) | Cùng lỗi hệ thống với 1-vault — "Luồng N" không thuộc closed-list, xuất hiện ở hầu hết 10 lesson của module. Xử đồng loạt sau khi thầy chốt (a)/(b) ở trên. |
| 0-iam-federation-and-oidc | bold-loai12 | med | "...mà tách **pool** (namespace) khỏi **provider** (trust OIDC thật)..." (dòng 180) | "provider" là Loại 2 (bảng §1 dòng 39 liệt kê rõ), "pool" tương tự danh từ kỹ thuật thường — cả hai bị bold giữa văn xuôi (CẤM §3B.2). Bỏ bold, viết thường: "tách pool (namespace) khỏi provider (trust OIDC thật)". |
| 3-external-secrets-operator | bold-adhoc | med | "Câu trả lời thiếu chiều sâu: base64 **KHÔNG phải mã hoá** — ai đọc được git là `base64 -d` ra password ngay..." (dòng 13) | Bold cả cụm "KHÔNG phải mã hoá" là nhấn ad-hoc giữa câu (CẤM §3B.1) — không phải jargon Loại 3, không phải nhãn template. Bỏ bold, giữ văn xuôi thường (có thể giữ IN HOA để nhấn nếu cần). |
| 8-policy-as-code-opa-kyverno | bold-adhoc | low | "Lỗ hổng không phải image xấu mà là **cấu hình runtime nguy hiểm**." (dòng 13) | Cụm tiếng Việt "cấu hình runtime nguy hiểm" bị bold ad-hoc (CẤM §3B.1) — bỏ bold. Lưu ý: "Policy-as-code" và "admission controller" cùng câu KHÔNG tính là lỗi — đây là named-concept English hợp lệ theo Loại 3 (industry term đã chuẩn hoá, không phải nhấn ad-hoc), giữ nguyên bold. |
| 8-policy-as-code-opa-kyverno | polysemy-error | med | "Mọi request tạo/sửa resource đến **Kubernetes API server** đều đi qua **chuỗi admission controller** trước khi persist vào etcd..." (dòng 362) | Theo bảng polysemy §2 hàng "chuỗi" (context A: "chuỗi middleware/phụ thuộc" = **chain**, Loại 3), đây đang mô tả admission chain kỹ thuật thứ tự cố định mutate→validate — đúng pattern "chuỗi middleware". Nên viết "**admission chain**" (English+bold) thay vì "chuỗi admission controller" tiếng Việt để nhất quán quy tắc. |
| 8-policy-as-code-opa-kyverno | polysemy-error | low | "Trả lời mẫu (ngắn): **Admission control** là chuỗi webhook API server gọi trước khi persist resource vào etcd..." (dòng 379) | Cùng lỗi với finding trên — "chuỗi webhook" nên là "**webhook chain**" theo cùng quy tắc §2 hàng "chuỗi". Hiện đang lệch thuật ngữ giữa phần lý thuyết §2.2.1 (nếu sửa "admission chain") và phần trả lời mẫu §3.1 (đang "chuỗi webhook") cùng lesson — cần sửa đồng bộ cả hai chỗ. |
| module-wide (0,1,2,3,5,7,8 + phần lớn 10 lesson) | term-inconsistency | low | Pattern `**Luồng N — <mô tả>:**` lặp lại xuyên suốt gần hết lesson của module | Đây là điểm cần thầy chốt MỘT LẦN cho cả module: (a) bổ sung chính thức "Luồng N —" vào closed-list §3A.2 vì là convention lặp có chủ đích tương tự "Bước N"/"Câu hỏi N", hoặc (b) de-bold toàn bộ theo đúng luật hiện hành (CẤM §3B.1, ad-hoc). Không tự sửa khi chưa chốt — nhưng finding này là THẬT (rule hiện hành đang bị vi phạm ở diện rộng nếu giữ nguyên "được bold"). |

## Finding bị DROP (1)

| Lesson | Type | Snippet gốc | Lý do drop |
|---|---|---|---|
| 6-sbom-and-vulnerability-management | bold-adhoc | "Câu trả lời đúng về mặt **point-in-time scan** nhưng vẫn thiếu chiều sâu về **vulnerability management lifecycle**..." | Đọc lại toàn lesson: hai cụm này KHÔNG phải nhấn ad-hoc rời rạc — chúng là named concept lặp lại xuyên suốt bài (dòng 13, 17, 187, 300) làm trục đối lập chính của lesson ("scan một lần" vs "quản lý vòng đời liên tục"), đúng định nghĩa Loại 3 "thuật ngữ chuyên sâu, named concept" ở §1. Định dạng hiện tại (English + bold) ĐÃ ĐÚNG theo §1 cho Loại 3, không vi phạm §3B.1. Finding gốc tự nhận "cân nhắc... nếu team đồng ý" — không đủ cơ sở kết luận SAI, nên loại khỏi danh sách lỗi thật. |

## Tổng kết số liệu

- Tổng finding thô tầng 1+2: 18
- CONFIRMED (giữ lại là lỗi thật): 17
- DROP (false-positive/borderline không đủ chứng cứ): 1
- Theo loại: polysemy-error 7 (5× "mã nguồn"→source code + 2× "chuỗi"→chain), bold-inline-code 4, bold-adhoc 4, bold-loai12 1, term-inconsistency (mở, cần thầy chốt) 1

## Verdict

**CẦN SỬA NHIỀU** — lỗi "mã nguồn" thay vì giữ "source code" lặp lại ở ĐỦ 5/5 lesson có bài lab clone-repo (bẫy §5 đã biết nhưng CHƯA được fix trong nội dung thật); bold quanh inline-code (CẤM §3B.3) xuất hiện có hệ thống ở ≥4 lesson với hàng chục dòng định nghĩa attribute Terraform/tool prerequisite; cộng thêm 1 câu hỏi mở về "Luồng N" ảnh hưởng gần hết 10 lesson của module cần thầy chốt closed-list trước khi sweep toàn bộ.
