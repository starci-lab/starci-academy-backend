# Draft — Layout của MỌI surface phải (1) có đường CTA vào KHÓA (empty = lời mời học, không ngõ cụt) + (2) phủ ĐỦ ma trận STATE dữ liệu (rỗng / 1 / N / overflow / mixed-variant) (2026-07-05)

- File/§ đích khi `/merge`: `concepts/` (layout + monetization) + liên quan [[fair-monetization-axiom]] · [[labeled-section-render-empty-not-self-hide]] · [[course-home-no-duplicate-surfaces]] · [[single-select-among-options-use-tabs]] · [[attempt-history-selector-adaptive-and-grading-model-chip]] · skill `starci-fe-layout-brainstorm`.
- Bối cảnh: brainstorm layout tab CV (`/profile/[u]?tab=cv`). Thầy chốt 2 điều làm luật chung: *"mindset là phải CTA vào khóa"* + *"đủ layout nhé — lúc rỗng, có cv, có 5 cv, 1 upload + 1 generate. cover all test case."*

## Luật 1 (STRICT) — MỌI surface phải có đường CTA vào KHÓA; vùng RỖNG = lời mời học, KHÔNG ngõ cụt
- **Mỗi trang/surface của app PHẢI có ít nhất 1 anchor dẫn user về `/courses` (hoặc khóa đang học).** Vẽ/ship 1 layout mà thiếu đường "vào khóa" = SAI. StarCi bán KHÓA — không màn nào được là ngõ cụt không dẫn tới việc học tiếp.
- **Vùng RỖNG / thiếu dữ liệu = PHỄU về khóa, KHÔNG phải "Chưa có gì".** Empty-state của 1 surface mà giá trị của nó DỰNG TỪ việc học (CV, job-readiness, thành tích, portfolio, skill…) phải là **card LỜI MỜI**: headline dựng-từ-học + PRIMARY `[Vào khóa học →]` + (secondary các hành động tại chỗ nếu có). Chính sự rỗng LÀ pitch bán khóa. Đây là mở rộng [[labeled-section-render-empty-not-self-hide]] (rỗng → empty-state có nghĩa) + [[frameless-section-empty-state-needs-card]]: thêm chiều "empty = course-funnel".
- **Giọng FAIR (giữ [[fair-monetization-axiom]]):** *"học để KIẾM bằng chứng/kết quả thật"* — KHÔNG *"mua để tăng số"*. Phễu dẫn tới LÀM VIỆC THẬT trong khóa (capstone/thử thách/coding), không tới "trả tiền để điểm cao hơn". Vòng khép phải đọc ra được từ layout: giá trị (recruiter thấy / mở khóa / điểm / bằng chứng) ⇐ thành tích ⇐ **phải học**.
- **Anchor phễu bền:** ngoài empty-state, đặt 1 dòng/mảng phễu BỀN ở cấp trang (vd "còn N điểm → học nâng", "hoàn thành capstone → nâng điểm") để mọi state (kể cả đã-có-data) vẫn thấy đường học tiếp. Với trang không-phải-hồ-sơ (dashboard/marketing) → CTA-khóa là hero CTA / card khóa / nudge "học tiếp".

## Luật 2 (STRICT) — Spec layout phải phủ ĐỦ MA TRẬN STATE dữ liệu, không chỉ happy-path
- **Khi thiết kế/nghiệm thu layout 1 surface có LIST/COLLECTION, phải định nghĩa layout cho MỌI state đếm-được, tối thiểu:** **rỗng (0)** · **1** · **N (nhiều)** · **overflow (vượt cap hiển thị)** · **mixed-variant (item khác LOẠI/nguồn)**. Đừng chỉ vẽ "state có data đẹp". Mỗi state ghi rõ: khối nào ẩn/hiện, control nào bật, nội dung đổi gì.
  - **rỗng** → phễu khóa (Luật 1).
  - **1** → thường ẩn selector (chọn-1-trong-N chỉ dùng khi ≥2 — [[single-select-among-options-use-tabs]]).
  - **N** → selector hiện; giá trị "gộp" phải theo luật fair (vd best/max, KHÔNG sum theo count — [[fair-monetization-axiom]]).
  - **overflow** (vượt cap chip/row) → `+N` mở drawer/xem-tất-cả ([[attempt-history-selector-adaptive-and-grading-model-chip]]) — ĐỪNG `slice` câm làm mất item.
  - **mixed-variant** (item khác nguồn/loại: generate vs upload, free vs premium…) → phân biệt bằng ICON/nhãn 1 field (`source`…); phần XỬ LÝ CHUNG (chấm/hiển thị điểm) giữ GIỐNG NHAU, chỉ khác đúng chỗ thật sự khác (vd preview: doc dựng vs file gốc).
- **Control áp cho NHIỀU tab/view → đặt NGOÀI/TRÊN tab** (selector, filter, dòng outcome) để cả các tab dùng chung 1 nguồn state; đừng nhốt trong 1 tab. (Đã dùng ở CV: dải chọn CV + dòng recruiter nằm trên `TabsCard`.)
- **Test nhanh khi review layout:** hỏi *"state rỗng ra sao? 1 cái? nhiều? tràn cap? item khác loại?"* — thiếu 1 nhánh = spec chưa đủ, chưa cho apply.

## Áp đầu (2026-07-05)
- Tab CV (`CvWorkspace`): ma trận 4 state (rỗng/1/5/mix-nguồn) + bake phễu — empty-state đổi từ "Chưa có CV nào" (ngõ cụt, xác nhận bằng scan code) → card LỜI MỜI `[Vào khóa học]`; thêm dòng recruiter-unlock + "còn N → học"; overflow >6 CV → `+N` drawer; mix nguồn phân biệt icon `source`, tab Kết quả chung / Xem trước khác. Doc: `CV/UX-BRAINSTORM-V3-LAYOUT.md` §10 (Vòng 7). Chờ `/starci-fe-ux-apply`.
