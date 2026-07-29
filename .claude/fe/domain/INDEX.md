# DOMAIN — nghiệp vụ StarCi cho người dựng UI

> Ô thứ năm của canon. Bốn ô kia trả lời *đúng/sai* (`principles/`), *làm việc thế nào*
> (`discipline/`), *chạy ở đâu* (`environment.md`), *thứ tự* (skill). Ô này trả lời
> **màn này phục vụ THỰC THỂ nào, thực thể đó có những TRẠNG THÁI nào.**
>
> Dựng 2026-07-29 vì nó **chưa từng có nhà**: nhánh sáng-tạo của `story-create` đang bắt thầy
> mô tả lại nghiệp vụ mỗi lần dựng một màn, còn nhánh đọc-source thì không có gì để đối chiếu
> xem màn có phục vụ đúng việc không.

**Nguồn:** rút từ **188 entity backend** (nghiệp vụ và enum trạng thái) cộng **`src/` của FE**
(màn thật, UI gốc). Không rút từ trí nhớ, không rút từ tài liệu cũ.

---

## Đang dựng màn gì → mở file nào

Nạp **đúng miền đang chạm**, đừng nạp cả chín. Cả bộ là 932 dòng.

| Miền | Mở | Thực thể lõi |
|---|---|---|
| khoá học, bài đọc, ghi danh, foundation | [`course-and-content.md`](course-and-content.md) | course · module · content · enrollment |
| thử thách, đồ án cá nhân, nộp bài, chấm | [`challenge-and-milestone.md`](challenge-and-milestone.md) | challenge · submission · milestone-task |
| luyện thuật toán, playground hạ tầng | [`coding-and-playground.md`](coding-and-playground.md) | coding-problem · playground-session |
| thẻ ghi nhớ, ôn lặp ngắt quãng | [`flashcard.md`](flashcard.md) | deck · card · review-session |
| phỏng vấn thử, chấm theo checklist | [`mock-interview.md`](mock-interview.md) | mock-interview · attempt · session |
| model AI, hạn mức, trợ giảng, chat | [`ai.md`](ai.md) | ai-model · ai-subscription · content-ai-session |
| giỏ hàng, thanh toán, trả góp, gói | [`commerce.md`](commerce.md) | cart-item · transaction · installment-plan |
| XP, coin, streak, nhiệm vụ ngày, league | [`gamification.md`](gamification.md) | xp-history · coin-history · league-cohort |
| cộng đồng, hồ sơ, CV, việc làm, thông báo | [`community-profile-jobs.md`](community-profile-jobs.md) | community-post · user · cv-blocks · job |

Mỗi file đúng bốn mục: **§1 thực thể · §2 màn hình phục vụ · §3 state phải vẽ · §4 luật nghiệp
vụ đáng nhớ**. Tổng **419 dòng state** đã vét cạn.

---

## §3 vét cạn theo BA nguồn, không chỉ chép enum

Đây là chỗ file này khác một bản mô tả API:

| Nguồn | Ví dụ |
|---|---|
| enum trạng thái thật trong entity | submission: `pending` · `grading` · `passed` · `failed` |
| ba state kỹ thuật của mọi vùng có fetch | rỗng · lỗi · đang tải |
| **state RANH GIỚI mà code lộ ra** | chưa đăng nhập · học thử vs đã mua · hết hạn mức · hết lượt · bị khoá · lần đầu chưa có dữ liệu · quá hạn |

Nguồn thứ ba là chỗ hay sót nhất, và đúng là chỗ màn hay vỡ khi chạy thật.

---

## ⚠️ MƯỜI LĂM CHỖ BACKEND VÀ FE NÓI NGƯỢC NHAU

Đây là sản phẩm phụ đáng giá nhất của lượt rút. Mỗi agent bị cấm tự chọn một bên, nên chỗ nào
lệch thì **ghi cả hai** rồi báo lên. Chưa cái nào được sửa, và **chưa cái nào được thầy chốt**.

### Gần chắc là lỗi FE

| # | Chỗ | Lệch gì |
|---|---|---|
| 1 | trả góp | Backend trả chữ thường (`fixed`, `defaulted`), FE so chữ hoa (`"Fixed"`, `"Defaulted"`) ⇒ **nhánh Fixed và nhánh khoá gần như không bao giờ chạy** |
| 2 | CV công khai | FE có mutation `setCvBlocksPublic` và trường `isPublic`; backend **không có cột lẫn mutation nào** |
| 3 | quyền riêng tư hồ sơ | FE dùng `user.sectionVisibility`; `user.entity.ts` chỉ có `profileLocked`, không có trường visibility |
| 4 | playground | FE gọi query `myOpenPlaygroundSession`; grep backend **không có resolver nào tên đó** |
| 5 | playground | FE đếm ngược theo `pairingCodeExpiresAt`; response type **không trả trường đó** ⇒ đồng hồ không có nguồn dữ liệu |
| 6 | độ khó thử thách | Enum có 5 giá trị, FE chỉ map 3 ⇒ `insane` và `expert` **rơi về nhãn "easy"** |
| 7 | điểm nhiệm vụ đồ án | Backend `max_score` theo từng task, FE **hardcode `max={20}`** |
| 8 | flashcard premium | FE khoá theo cờ `enrolled` mà **không chờ `enrolledSettled`** ⇒ người đã mua thấy nháy giao diện học thử |
| 9 | nhiệm vụ ngày | Backend cần **3/5** việc, câu chữ FE ghi "hoàn thành cả 3" nhưng **render đủ 5 dòng** |
| 10 | phỏng vấn thử | FE chặn cả miền khi `isEnrolled !== true`, backend thì **đã sẵn sàng phục vụ enrollment học thử** |

### Backend tự mâu thuẫn với chính nó

| # | Chỗ | Lệch gì |
|---|---|---|
| 11 | `CourseContentTier` | docstring nói nó điều khiển paywall, **không code nào áp dụng**, seeder lại ghi "display badge only" |
| 12 | hạng model AI | `TIER_ALLOWED_CATEGORIES.free` cho tới `balanced`, docstring cùng file nói free khoá ở `economy`, FE khoá `balanced` — **ba nguồn ba đáp án** |
| 13 | TTL phiên quiz | comment ghi 24 giờ, hằng số backend ghi **60 phút** |

### Code chết, dựng rồi không ai gắn vào đâu

| # | Chỗ |
|---|---|
| 14 | `StreakFreezeCard` tồn tại, **không route nào mount** |
| 15 | `AiQuotaCard` tồn tại, **không route nào mount** |

⚠️ **Đừng tự sửa những chỗ này khi đang dựng màn.** Chúng là phát hiện chờ thầy quyết, không
phải việc tiện tay. Sửa số 1 hay số 6 là đổi hành vi sản phẩm, không phải sửa lỗi chính tả.

---

## Luật dùng bộ này

1. **Đây là bản đồ, KHÔNG phải cổng.** Nó ghi màn nào có thật và phục vụ gì. Nó **không** đòi
   Storybook phải soi gương `src` — luật ranh giới vẫn nguyên: bản vẽ lệch công trình là
   **bình thường**, và cổng từng đòi soi gương đã bị khai tử vì luôn đỏ.
2. **Enum chép từ code, không chép từ đây.** File này rút ngày 2026-07-29; code đổi thì nó lạc
   hậu. Chạm trạng thái nào thì mở entity đọc lại, dùng file này để biết **đi tìm ở đâu**.
3. **Đo được thì đo, đừng suy từ đây.** Cùng luật xuyên trục 1 của `principles/`: neo thật ghi
   đè suy luận.
4. **Phủ sóng hiện tại: 20 page Storybook trên 102 màn thật.** Con số đó để **chọn làm gì tiếp**,
   không phải để chấm điểm — nhiều màn (pháp lý, cookie, status) không đáng có story.
