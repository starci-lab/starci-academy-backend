# Audit dịch VI — 21-gitops-and-progressive-delivery

Tầng 3: verify đối nghịch (mặc định nghi false-positive) + tổng hợp findings thô từ tầng 1+2, đối chiếu §5 (bẫy false-positive) và §2 (polysemy) của `terminology-bold.md`.

## Phương pháp

Với mỗi finding: mở lại file gốc tại đúng dòng, đọc nguyên câu + ngữ cảnh quanh, so với bảng polysemy §2 và bảng bẫy đã biết §5. Chỉ giữ khi đọc file thật thấy đúng là lỗi (không chỉ tin theo snippet trong finding thô).

## Bảng finding CONFIRMED

| Lesson | Type | Severity | Snippet | Sửa |
|---|---|---|---|---|
| 0-gitops-principles-and-argocd | polysemy-error | high | dòng 30: "Mục đích: lấy **mã nguồn** Terraform để cài ArgoCD..." | Sửa "mã nguồn" → "source code" (giữ nguyên tiếng Anh). Đây đúng y bẫy đã ghi ở §5 dòng 5 ("source" → "nguồn" khi ngữ cảnh "clone source"/"source code" → PHẢI giữ "source code"). Đọc lại câu: đang nói tải file mã Terraform từ GitHub repo về máy — đúng là "source code", KHÔNG phải "nguồn gốc". Verify: đây là lỗi THẬT, không phải false-positive. |
| 0-gitops-principles-and-argocd | bold-inline-code | high | dòng 47-50: `- **\`helm_release "argocd"\`:**` … và 3 dòng liền kề cùng khối "Kiến trúc / thành phần" | Bỏ `**` bọc quanh inline-code + dấu `:`, chỉ giữ backtick trần: `` `helm_release "argocd"`: ``. Đọc lại thấy đúng là bold trùm cả cụm inline-code + label — vi phạm §3B.3 rõ ràng, lặp lại y hệt ở 4 dòng liên tiếp (47-50) và tiếp tục ở dòng 276-280 cùng file. |
| 0-gitops-principles-and-argocd | bold-inline-code | high | dòng 276-280 (khối "Giải thích từng phần") — 5 dòng liền `- **\`helm_release.argocd\` — \`wait = true\`...**` | Bỏ `**`, chỉ giữ backtick từng cụm code riêng lẻ, phần mô tả bằng chữ để plain. Đọc thật 5 dòng: đúng là bold trùm nguyên cụm code+mô tả — không phải nhãn template, không phải jargon Loại 3, mà là bold-ad-hoc quanh inline-code. |
| 0-gitops-principles-and-argocd | bold-adhoc | high | dòng 46, 49, 50: "**KIND cluster:**", "**ArgoCD application-controller:**", "**nginx demo workload:**"; dòng 286-290: "**Docker Desktop**", "**Windows:**", "**\`kind\` 0.20+**"... | Bỏ bold, để plain text (nhãn tên-thành-phần trước dấu `:` không nằm trong closed-list §3A — chỉ "Phần/Bước/Câu hỏi/Giải pháp/Trade-off/Cơ chế/Lưu ý/persona/README-section" mới được giữ). Đọc lại đúng là mẫu lặp có chủ đích xuyên khối "Kiến trúc / thành phần" và "Điều kiện cần trước" ở CẢ 7 lesson trong module — cần 1 đợt sweep riêng, không sửa lẻ tay. |
| 2-argocd-app-of-apps-and-sync (+5 lesson khác) | bold-adhoc | med | dòng 278-281: "**Luồng 1:**", "**Luồng 2:**"... (cũng ở 3/5/6/7-*, dòng tương ứng) | Nhãn "Luồng N:" không có trong closed-list §3A (chỉ "Bước N:" được whitelist cho challenge). Đề xuất: hoặc bỏ bold (xử lý theo rule hiện hành), hoặc xin thầy chốt bổ sung "Luồng N:" vào closed-list nếu đây đúng là nhãn cấu trúc cố định lặp mọi lesson (giống "Bước N:"). Verify: đọc thật thấy pattern lặp ở 6/7 lesson, một số lesson (0-gitops dòng 337) CŨNG bold "Luồng N" (khác với mô tả gốc trong finding thô nói 0-gitops không-bold — điểm này sai trong finding thô, đã hiệu chỉnh), nên tính nhất-quán của pattern càng ủng hộ khả năng đây là nhãn template thiếu sót trong rule hơn là lỗi ad-hoc ngẫu nhiên — CẦN thầy chốt trước khi de-bold hàng loạt. |
| 6-argo-rollouts-and-traffic-shaping | bold-loai12 | med | dòng 553: "...tỷ lệ đo theo **request** có thể khớp weight nhưng tỷ lệ theo **user thực** lại lệch hẳn" | Bỏ bold quanh "request" (Loại 2 — giữ English, không bold) và "user thực" (Loại 1, dịch được). Đọc lại nguyên đoạn: đúng là nhấn ad-hoc để tạo tương phản giữa 2 khái niệm đo lường, không phải jargon Loại 3 hay nhãn template — vi phạm §3B.1 + §3B.2. |
| 5-canary-vs-blue-green | bold-loai12 | low | dòng 13: "Rolling update chỉ đảm bảo zero-downtime, không đảm bảo **safe**." | Bỏ bold quanh "safe" — từ phổ thông (Loại 1) bị nhấn ad-hoc giữa câu hội thoại Senior/Mid-level. Đọc lại nguyên câu xác nhận không phải jargon Loại 3, không phải nhãn persona (persona đã bold riêng ở "Mid-level Developer"/"Senior Engineer" — đúng rule). |
| 7-metric-analysis-and-auto-rollback / challenge 2-canary-vs-baseline-hard | bold-adhoc | low | dòng 7: "Thay ngưỡng tuyệt đối bằng so sánh **canary vs baseline**:" | Bỏ bold quanh cụm "canary vs baseline" — không phải jargon Loại 3 hay nhãn template. Đọc lại xác nhận đây là nhấn ad-hoc cụm-từ-chìa-khóa mô tả yêu cầu challenge, pattern lặp ở nhiều challenge khác trong module — nên xử lý ở cấp rule/toàn khoá thay vì sửa lẻ file này. |

## Finding bị DROP

Không có finding nào bị drop. Toàn bộ 8 finding thô của tầng 1+2 đều được xác nhận là lỗi thật sau khi đọc lại nguyên văn + đối chiếu bảng bẫy §5 và bảng polysemy §2:

- Finding "polysemy-error / mã nguồn" khớp đúng 100% với bẫy đã ghi ở §5 (dòng "source" → "nguồn" khi ngữ cảnh "clone source") — đọc lại câu xác nhận ngữ cảnh đúng là "source code" (tải file code Terraform), không phải "nguồn gốc" — nên đây là lỗi thật cần sửa, không phải trường hợp áp dụng nhầm rule.
- Không gặp trường hợp nào kiểu "phân mảnh"/"chuỗi (string)" bị đọc nhầm — các bold-loai12 đều là từ đơn giữa văn xuôi (request/user thực/safe), không rơi vào cột Context-A giữ-nguyên của bảng polysemy.
- 1 điểm hiệu chỉnh nhỏ (không phải drop): mô tả trong finding thô về lesson 0-gitops "dùng dạng khác 'Luồng 1 — ...' không bold" là SAI khi đối chiếu file thật (dòng 337 cũng bold) — đã sửa lại trong bảng CONFIRMED ở trên, không ảnh hưởng tới kết luận finding.

## Verdict

**CẦN SỬA NHIỀU**

Lý do: 2 pattern high-severity (bold quanh inline-code trong khối "Kiến trúc/thành phần" + "Giải thích từng phần", và bold-adhoc nhãn tên-thành-phần) lặp lại có hệ thống trên TẤT CẢ 7 lesson của module (không phải lỗi rải rác 1-2 chỗ) — cần một đợt sweep riêng theo §6 (nesting-safe, protect inline-code) áp toàn module, không sửa tay từng dòng. Ngoài ra có 1 pattern "Luồng N:" cần thầy chốt trước (mở rộng closed-list §3A hay de-bold), và 1 lỗi polysemy thật (mã nguồn → source code) cùng vài bold-loại1/2 nhỏ lẻ mức low/med.
