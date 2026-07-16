# Concept — Layout MỌI surface phải (1) có đường CTA vào KHÓA (empty = lời mời học, không ngõ cụt) + (2) phủ ĐỦ ma trận STATE dữ liệu

> Heuristic layout + monetization (họ `concepts/*`). Thầy chốt 2026-07-05: *"mindset là phải CTA vào khóa"* + *"đủ layout — lúc rỗng, có cv, có 5 cv, 1 upload + 1 generate. cover all test case."* Bổ trợ [[fair-monetization-axiom]] · [[labeled-section-render-empty-not-self-hide]] · [[single-select-among-options-use-tabs]].

## Luật 1 (STRICT) — MỌI surface phải có đường CTA vào KHÓA; vùng RỖNG = lời mời học, KHÔNG ngõ cụt
- **Mỗi trang/surface PHẢI có ≥1 anchor dẫn user về `/courses` (hoặc khóa đang học).** Ship 1 layout thiếu đường "vào khóa" = SAI. StarCi bán KHÓA — không màn nào được là ngõ cụt.
- **Vùng RỖNG / thiếu dữ liệu = PHỄU về khóa, KHÔNG "Chưa có gì".** Empty-state của surface mà giá trị DỰNG TỪ việc học (CV, job-readiness, thành tích, portfolio, skill…) = **card LỜI MỜI**: headline dựng-từ-học + PRIMARY `[Vào khóa học →]` + (secondary hành động tại chỗ nếu có). Sự rỗng LÀ pitch bán khóa. Mở rộng [[labeled-section-render-empty-not-self-hide]] + [[frameless-section-empty-state-needs-card]]: thêm chiều "empty = course-funnel".
- **Giọng FAIR ([[fair-monetization-axiom]]):** *"học để KIẾM bằng chứng/kết quả thật"* — KHÔNG *"mua để tăng số"*. Phễu dẫn tới LÀM VIỆC THẬT trong khóa (capstone/thử thách/coding), không tới "trả tiền để điểm cao hơn". Vòng khép đọc được từ layout: giá trị (recruiter thấy / mở khóa / điểm) ⇐ thành tích ⇐ **phải học**.
- **Anchor phễu BỀN:** ngoài empty-state, đặt 1 dòng/mảng phễu bền ở cấp trang (vd "còn N điểm → học nâng") để mọi state (kể cả đã-có-data) vẫn thấy đường học tiếp. Trang không-phải-hồ-sơ (dashboard/marketing) → CTA-khóa = hero CTA / card khóa / nudge "học tiếp".

## Luật 2 (STRICT) — Spec layout phải phủ ĐỦ MA TRẬN STATE, không chỉ happy-path
- **Surface có LIST/COLLECTION → định nghĩa layout cho MỌI state đếm-được, tối thiểu:** **rỗng (0)** · **1** · **N** · **overflow (vượt cap hiển thị)** · **mixed-variant (item khác LOẠI/nguồn)**. Đừng chỉ vẽ "state có data đẹp". Mỗi state ghi rõ: khối nào ẩn/hiện, control nào bật, nội dung đổi gì.
  - **rỗng** → phễu khóa (Luật 1).
  - **1** → thường ẩn selector (chọn-1-trong-N chỉ dùng khi ≥2 — [[single-select-among-options-use-tabs]]).
  - **N** → selector hiện; giá trị "gộp" theo luật fair (best/max, KHÔNG sum theo count — [[fair-monetization-axiom]]).
  - **overflow** (vượt cap chip/row) → `+N` mở drawer/xem-tất-cả ([[attempt-history-selector-adaptive-and-grading-model-chip]]) — ĐỪNG `slice` câm làm mất item.
  - **mixed-variant** (item khác nguồn/loại: generate vs upload, free vs premium…) → phân biệt bằng ICON/nhãn 1 field (`source`…); phần XỬ LÝ CHUNG (chấm/hiển thị điểm) giữ GIỐNG NHAU, chỉ khác đúng chỗ thật sự khác.
- **Control áp cho NHIỀU tab/view → đặt NGOÀI/TRÊN tab** (selector, filter, dòng outcome) để mọi tab dùng chung 1 nguồn state; đừng nhốt trong 1 tab.
- **Test nhanh khi review layout:** hỏi *"state rỗng ra sao? 1 cái? nhiều? tràn cap? item khác loại?"* — thiếu 1 nhánh = spec chưa đủ, chưa cho apply.

## Liên quan
- [[fair-monetization-axiom]] (fair funnel, best/max không sum) · [[labeled-section-render-empty-not-self-hide]] / [[frameless-section-empty-state-needs-card]] (empty có nghĩa) · [[single-select-among-options-use-tabs]] (selector ≥2) · [[premium-gate-is-enrollment-not-vip]] (CTA = enroll khóa).
