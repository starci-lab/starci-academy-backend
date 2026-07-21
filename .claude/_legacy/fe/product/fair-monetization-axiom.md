# Concept — Công bằng bất đối xứng: KHÔNG scalar nào phồng theo số khóa đã mua

> Heuristic công bằng/monetization (họ `concepts/*`, backend). Chốt sau vụ `breadthBonus` (Job-Readiness) —
> 1 scalar cộng dồn theo số enrollment đã lọt vào composite score, vi phạm đúng nguyên tắc gốc mà tính năng
> được sinh ra để phục vụ. Test + rule doc khoá lại TRƯỚC khi refactor để không PR/session nào tái phạm.

## Nguyên tắc gốc (STRICT)
- **Công bằng bất đối xứng:** người mua **1 khóa** cần *"không bị thiệt"* (điểm/hồ sơ của họ vẫn mạnh, không bị pha loãng
  vì họ "chỉ có 1"); người mua **3 khóa** cần *"công sức hiện ra"* (3 khóa phải nhìn RÕ hơn 1, nhưng KHÔNG qua việc thổi
  phồng 1 con số dùng chung).
- **Giải bằng KHÔNG có 1 điểm số gộp (composite) nào phồng theo số khóa.** Thay vì 1 scalar tổng hợp mọi track, StarCi
  tách thành **4 lớp riêng biệt**, mỗi lớp có luật hiển-thị/tính-điểm khác nhau.

## Mô hình 4 lớp
| Lớp | Là gì | Quy tắc | Ví dụ ở StarCi |
|---|---|---|---|
| **Per-track card** | 1 card / mỗi khóa đã mua (enrollment) | Mỗi card **tự đứng riêng**, KHÔNG gộp vào 1 số chung. Thêm khóa = thêm 1 card, KHÔNG đổi card cũ. | Capstone % + Mock interview + CV(best theo khóa) → `depthScore` + `band` per track |
| **Global foundation** | 1 con số duy nhất, KHÔNG gắn khóa nào | Kiếm bằng hoạt động **ai cũng làm được**, không phụ thuộc số khóa đã mua (percentile/rank là **count-independent**: so với TOÀN pool, không cộng dồn theo track của riêng bạn). | Coding percentile (giải problem, so trên toàn hệ thống) |
| **Engagement** | Vui/trạng thái, KHÔNG quyết định cơ hội/tiền | **SUM được phép** (XP cộng dồn là hợp lệ) NHƯNG **KHÔNG được gate bất kỳ cơ hội thật nào** (0 ảnh hưởng job-board, AI credit, xác suất được liên hệ...). | XP leaderboard, badge, streak |
| **Entitlement** | Quyền dùng AI / job-board / liên hệ | **Nhị phân theo TIER hoặc theo trạng thái enroll** (`hasActiveEnrollment > 0`, tier Plus/Pro/Max...) — KHÔNG theo COUNT (1 vs 3 enrollment/CV phải cho kết quả giống hệt nhau). | AI credit pool, model-tier unlock, job-board contact gate (theo `bestCvScore`, không theo số CV) |

## Luật vàng (STRICT) — câu hỏi bắt buộc hỏi trước khi ship 1 feature/field mới
> **"Tín hiệu này có lên CƠ HỌC khi user mua thêm 1 khóa/tạo thêm 1 CV/enroll thêm 1 lần không?"**
> — Nếu **CÓ** (chỉ vì count tăng, không vì user giỏi hơn/làm nhiều hơn thật) → **SAI, phải sửa**.

- Test nhanh: giữ NGUYÊN chất lượng thật (depth/score) của mọi track hiện có, chỉ **thêm 1 track/enrollment/CV mới**
  (có thể yếu hơn hoặc bằng track cũ) → mọi con số quyết-định-cơ-hội-hoặc-tiền của các track CŨ phải **giữ nguyên
  y hệt**. Nếu có bất kỳ số nào tăng lên chỉ vì "có thêm 1 cái" → vi phạm.
- **`breadthBonus` cũ vi phạm đúng chỗ này:** `JobReadinessService.compute()` (bản composite) cộng thêm
  `Math.min(cap, (qualifiedTrackCount - 1) * perTrack)` vào `compositeScore` — 1 scalar lên cơ học theo
  `qualifiedTrackCount`, tức là mua thêm khóa (dù khóa mới yếu/chưa học gì nhiều) vẫn kéo điểm tổng lên. Đã bỏ.
- **Đích:** `compute()` trả về `{ foundation, tracks }` — KHÔNG còn `compositeScore`/`breadthBonus`. Mỗi track có
  `depthScore`/`band`/`isQualified` **riêng, độc lập với các track khác**; `foundation` là 1 con số per-user
  (không nhân theo track).

## Cách phân loại 1 feature MỚI (1 câu hỏi)
Khi thêm 1 field/tín hiệu mới ảnh hưởng tới **cơ hội** (job-board, AI credit, được liên hệ, xếp hạng công khai) hoặc
**tiền** (giá, ưu đãi, gate mua hàng):

1. Nó thuộc lớp nào trong 4 lớp trên?
2. Nếu là **per-track** → nó PHẢI đứng độc lập (không cộng vào track khác, không có "tổng của N track").
3. Nếu là **global foundation** → nó PHẢI là 1 con số per-user, tính từ hoạt động mở cho mọi người, KHÔNG tính
   bằng cách cộng dồn nhiều track của riêng user đó.
4. Nếu là **engagement** → được SUM, nhưng verify nó **KHÔNG lọt vào** bất kỳ gate cơ hội/tiền nào.
5. Nếu là **entitlement** → verify nó chỉ đọc `tier`/`hasActiveEnrollment` (boolean/enum), KHÔNG đọc `count`/`length`
   của 1 danh sách (enrollments, CV, subscriptions...).

Nếu không xếp được vào lớp nào rõ ràng, hoặc nó đọc `.length`/`COUNT(...)` của chính user trên 1 tín hiệu quyết
định cơ hội/tiền → **dừng lại, hỏi trước khi ship.**

## Ví dụ ĐÃ ĐÚNG (tham chiếu khi viết code mới)
- `AiEntitlementService` (`src/modules/ai/ai-entitlement.service.ts`): mode + allowed categories chỉ phụ thuộc
  **tier hiện tại** của `AiSubscriptionEntity` (`TIER_ALLOWED_CATEGORIES[tier]`) — 1 vs 3 enrollment không đổi kết quả.
- `ConsultantContactGateService` (`src/modules/bussiness/headhuntings/consultant-contact-gate.service.ts`):
  `getBestCvScore` là `MAX(attempt.score)` qua **mọi CV submission của user** — 1 con số duy nhất, KHÔNG cộng theo
  số CV; `gateConsultant` chỉ so `bestCvScore >= CV_SCORE_UNLOCK_THRESHOLD` (nhị phân), không đọc count CV nào.

## Liên quan
- [[shared-modules-global-once-at-app-root]] (nguyên tắc "1 nguồn duy nhất, không nhân bản theo ngữ cảnh" — cùng tinh
  thần: 1 tín hiệu công bằng phải có đúng 1 công thức, không lệch theo nơi tính).
- [[single-source-render]] (1 đại lượng = 1 nơi tính/render — tránh N công thức lệch nhau cho cùng 1 khái niệm
  "điểm sẵn sàng đi làm").
