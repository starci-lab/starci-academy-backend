# Principle — Call to Action (Dẫn tới hành động)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Rút từ [[button]] §2 (canon nút CTA) + [[region-model]] (CTA-anchor) + `CTA.md` (file thật trong source, `src/components/features/learn/CTA.md`) — StarCi đã có 1 file "sổ tay CTA" ngay trong code, nguyên tắc này là bản RULE hoá phần khung của nó (persuasion chi tiết → [[persuasion-psychology]]).

## Rule of thumb
**Mỗi màn có ĐÚNG 1 hành động chính, bắn ĐÚNG lúc người học vừa đủ động lực + đủ dễ làm — CTA nói KẾT QUẢ, không nói cơ chế.**

## Nguyên tắc
- **1 primary CTA / surface** (`variant="primary" size="lg"` + `ArrowRightIcon` trailing, [[button]] §2) — mọi hành động khác xuống `secondary`/`tertiary`. 2 nút to-cỡ-primary cạnh nhau = tê liệt quyết định (Hick's Law — CTA.md B4).
- **CTA sống ở vùng CTA-anchor** ([[region-model]]: hero/sticky) — KHÔNG lạc vào slot phụ (vd `actions` của PageHeader chỉ dành CTA chính, không phải nút refresh/toolbar phụ, [[header]] §1).
- **Trigger = Motivation × Ability, đúng Fogg B=MAP** — đừng bắn CTA khi M thấp (chưa thấy giá trị, mở app lần đầu) hay A thấp (đích không rõ, nhiều bước). 2 đòn bẩy: bắn ở **completion moment** (M cao nhất — Zeigarnik, xem [[persuasion-psychology]]) + làm hành động **1-click, đích rõ**.
- **North-star CTA của StarCi = "vào khóa / học tiếp"** — mọi CTA khác (mua gói AI, mua freeze streak…) là phụ; layout nào cũng phải có 1 đường dẫn về khóa/nội dung ([[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]]).
- **Copy = OUTCOME, không FEATURE** ("Mở khóa để dựng bằng chứng đi làm", không "phỏng vấn tốn AI credit") — outcome-framing thuyết phục hơn cơ-chế, đã chốt ở `CTA.md` đòn #8.
- **Sub-CTA quiet, không cạnh tranh:** hành động phụ (retry, xem chi tiết) = `tertiary`, không lg, không arrow — đọc ngay là "cấp dưới" primary ([[button]] §2).

> Đã áp: `UpNextCard` (`blocks/learn/UpNextCard`) — 1 primary accent lg+arrow ("Làm N thử thách của bài này") + 1 secondary tertiary quiet, bắn đúng completion moment cuối bài/phiên flashcard · `MockInterviewScorecard` — primary CTA đổi từ "làm lại" (generic) sang "ôn {phase yếu} →" (đích cụ thể trong khóa), retry hạ xuống tertiary · `CourseCtaButtons`/`PremiumPaywall`/`PremiumGateModal`/`CourseMobileEnrollBar` — icon CTA thống nhất `ArrowRightIcon` (bỏ cart/rocket).

## Liên quan
- [[button]] · [[region-model]] · [[persuasion-psychology]] (đòn tâm lý bắn CTA) · [[content-linking]] (CTA là 1 dạng đường-đi, luôn có onward path) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] · [[continue-resumes-content-not-capstone]].
