# Principle — Persuasion Psychology (Tâm lý thúc đẩy — HONEST ONLY)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Rút thẳng từ `CTA.md` (file thật, `src/components/features/learn/CTA.md`) — StarCi đã tự viết 1 "sổ tay đòn tâm lý" grounded vào field BE thật, kèm ranh giới đạo đức tường minh. File này là bản RULE hoá + mở rộng khung lý thuyết cho cả app (không chỉ CTA mua khóa).

## Rule of thumb
**Mọi đòn tâm lý CHỈ hợp lệ khi nội dung nó nói là SỰ THẬT kiểm chứng được từ BE — không có ngoại lệ "hiệu quả hơn nếu bịa".**

## Khung lý thuyết → StarCi embodiment (grounded)
| Khung | Cơ chế | StarCi đã dựng |
|---|---|---|
| **Cialdini — Scarcity** | Định giá cao hơn cho thứ sắp hết | `PhaseScarcityNote` — seat cap + giá tăng THẬT (`coursePricePreview`), ẨN khi không có cap (`seatsRemaining == null`) |
| **Cialdini — Social proof** | Đám đông giảm rủi ro cảm nhận | `StatStrip`/`CourseTrustStats` landing (số học viên/bài/khóa THẬT); `TopLearners`/`LeaderboardPodium` (bảng xếp hạng thật) |
| **Cialdini — Authority** | Chuyên môn/độc quyền tăng giá trị cảm nhận | `SelfHostGpuMark` (GPU tự host, không giấu trong prompt kỹ thuật) · `FounderCard` (build-in-public, founder thật) |
| **Cialdini — Consistency** | Hành vi nhất quán kéo cam kết tiếp | `StreakStrip`/`StreakFreezeCard` (giữ mạch ngày học) |
| **Cialdini — Reciprocity** | Nhận trước tạo nghĩa vụ đáp lại | Premium preview cắt tại "Kiểm thử" — cho học ĐƯỢC THẬT trước khi khoá |
| **Cialdini — Liking** | Ưa thích tăng độ mở lòng | Mascot/persona rank system, giọng "thầy-trò" trong content-voice |
| **Fogg B = M·A·P** | Hành động = Motivation × Ability × Prompt cùng đủ cao | `UpNextCard` bắn CTA ở completion moment (M cao) + 1-click đích rõ (A cao) — [[call-to-action]] |
| **Goal-gradient (Kivetz)** | Động lực tăng phi tuyến khi gần đích | `WeeklyGoals` + `ProgressMeter`/`SegmentBar`; framing "còn N bài" (gần đích) thay "đã đọc N" (xa đích) |
| **Zeigarnik / Peak-End** | Việc chưa xong tạo căng thẳng kéo quay lại; nhớ ĐỈNH + KẾT | `UpNextCard` đặt ở "end" mỗi surface (cuối bài/phiên) — cưỡi cái kết tích cực, không nhồi giữa luồng |
| **Hook (Eyal): Trigger→Action→Reward→Investment** | Vòng lặp thói quen | `DailyQuest` (trigger hằng ngày) → hoàn thành (action) → XP/reward → streak tích luỹ (investment) |

## Nguyên tắc thực thi
- **Mọi field dùng để thuyết phục PHẢI trỏ tới 1 nguồn BE thật** — seat count, enrollment count, XP, streak đều query thật; không hardcode/decorative số ở UI (`PhaseScarcityNote` chỉ render khi `seatsRemaining` có thật, không giả lập countdown).
- **1 điểm nổi / màn (Von Restorff)** — CTA primary = accent solid duy nhất; nổi mọi thứ = không nổi gì ([[accent-system]]).
- **Ambient pressure ĐÚNG LIỀU** — 1 strip mảnh, cùng vị trí, không nhấp nháy/lặp lại nhiều overlay (mere-exposure quá liều → banner blindness, phản tác dụng).

## RANH GIỚI — CẤM TUYỆT ĐỐI (tie cứng vào [[fair-monetization-axiom]])
- **Fake scarcity/social-proof** (đếm ngược giả, số học viên bịa), **progress-loss threat giả** (tiến độ free KHÔNG bị xoá khi hết hạn trial — chỉ phần mở rộng bị khoá, nói đúng "mở tiếp" chứ không "giữ lại"), **confirmshaming**, **nag loop** không dismissible — tất cả bị cấm dù "đo được là hiệu quả hơn".
- **North star:** persuasion ở StarCi luôn hướng người học tới HỌC THẬT (capstone, challenge, coding — bằng chứng kiểm chứng được), KHÔNG BAO GIỜ hướng tới "trả tiền để tăng 1 con số" — đúng nguyên tắc công bằng bất đối xứng của [[fair-monetization-axiom]] (không scalar nào phồng chỉ vì mua thêm).

> Đã áp: `PhaseScarcityNote` (`blocks/commerce/PhaseScarcityNote`) — scarcity thật, ẩn khi vô hạn · `TrialConversionStrip` (`features/learn/CourseContents`) — loss-aversion + goal-gradient + scarcity gộp 1 strip mảnh, chỉ hiện cho trial · `UpNextCard` — Fogg trigger + Zeigarnik/Peak-End tại completion moment · `AiQuotaCard` — quota thật (remaining5h/Week) render bằng `ProgressBar`, không giả số.

## Liên quan
- [[call-to-action]] · [[content-linking]] · [[fair-monetization-axiom]] · [[accent-system]] (1 điểm nổi/màn) · [[grounded-in-data]] (số liệu phải từ data thật).
