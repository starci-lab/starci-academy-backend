# BƯỚC 9 — MÀN `Content` (đọc một bài): CÂY + BẢNG STATE

> **CHƯA VIẾT CODE.** Đây là barrier của `steps/1` — vẽ cây, vét state, thầy duyệt rồi mới dựng.
>
> Nguồn đọc: `src/components/features/learn/LessonReader/**` (432 dòng `index.tsx`) và
> `src/app/[locale]/courses/[courseId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx`.
> **Không bê từ `_legacy`** (thầy chốt 2026-07-28) — `_legacy` chỉ dùng để soi HÌNH.

---

## 1. Danh sách chức năng (B1 — chưa nghĩ hình)

> *"bài này là gì · xem bài dưới dạng nào · đọc bài · mở khoá để đọc tiếp · nói cảm nhận ·
> bàn luận · đọc gì tiếp · lùi/tới bài · xem kết quả e2e"*

Chín câu. Đọc lên ra được trang làm gì ⇒ đạt.

`AdBanner` và `SelectionHintCallout` **không** vào danh sách: một cái là doanh thu chèn vào,
một cái là mách dùng tính năng — cả hai là **lớp phủ lên** việc đọc, không phải một việc người
học tới đây để làm. Chúng đi kèm block khác chứ không đứng thành chức năng riêng.

---

## 2. Điều quyết định TOÀN BỘ hình: màn này có BA thân, không phải một

`LessonReader` đổi **khung của thân** theo tab đang chọn — đây là thứ dễ bỏ sót nhất và nó
chi phối cả cây lẫn bảng state:

| Tab | Khung thân | Vì sao |
|---|---|---|
| Sandbox · AI Lab | **tràn hết bề ngang**, không thẻ | công cụ cần chỗ, không phải trang giấy |
| Challenges | khổ đọc, **phẳng** (không thẻ) | thân nó vốn đã là một danh sách thẻ ⇒ thẻ trong thẻ |
| Content | khổ đọc, **trong thẻ giấy** | đây mới là "trang để đọc" |

Và phần chân (cảm nhận · thảo luận · lùi/tới · e2e) **chỉ hiện khi `!isLocked && !isFullWidth`**.

> ⚠️ Vậy `Content` **không phải một screen có vài state**, nó là một screen mà **cấu trúc cây
> đổi theo tab**. Bảng state ở §5 phải vét theo TAB trước, rồi mới tới loading/locked.

---

## 3. Cây component đề xuất

```
ContentScreen                                        screen
  StackV gap="section"                               frame   ← ba tầng: đầu · thanh tab · thân
    Container size="md"                             frame
      ContentHeader                                  block   ← bài này là gì
    ContentTabBar                                    block   ← KHÔNG bọc Container: tràn ngang
    StackV gap="section"                             frame
      ┌─ tab = Sandbox | AiLab ─────────────────────────────┐
      │ ContentSandbox / ContentAiLab                block  │  (chưa bàn lượt này)
      └──────────────────────────────────────────────────────┘
      ┌─ tab = Challenges ───────────────────────────────────┐
      │ Container size="md"                         frame │
      │   ContentChallengeList                        block  │  (chưa bàn lượt này)
      └──────────────────────────────────────────────────────┘
      ┌─ tab = Content ──────────────────────────────────────┐
      │ Container size="md"                         frame │
      │   ContentArticle                              block  │  ← đọc bài + chặn khi khoá
      └──────────────────────────────────────────────────────┘

      ┌─ chỉ khi mở khoá và không phải tab tràn ngang ───────┐
      │ Container size="md"                         frame │
      │   StackV gap="section"                        frame  │
      │     ContentReaction                           block  │  ← nói cảm nhận
      │     ContentUpNext                             block  │  ← chỉ MOBILE (xem §6)
      │     ContentRelatedList                        block  │  ← tự ẩn khi không có gì
      │     ContentDiscussion                         block  │  ← bàn luận
      │     ContentPager                              block  │  ← lùi/tới bài
      │     ContentE2eLink                            block  │  ← chỉ khi bài có e2e
      └──────────────────────────────────────────────────────┘
```

**Bảy block dựng lượt này:** `ContentHeader` · `ContentTabBar` · `ContentArticle` ·
`ContentReaction` · `ContentRelatedList` · `ContentDiscussion` · `ContentPager`.
**Hai block hoãn:** `ContentUpNext` · `ContentE2eLink` (đều là ca điều kiện, xem §6).
**Ba block chưa bàn:** `ContentSandbox` · `ContentAiLab` · `ContentChallengeList` — chúng là
công cụ, không phải việc đọc; xứng một lượt riêng.

### 3a. Mỗi block gồm gì (đọc từ `src`, không bịa)

| Block | Ghép từ | Đã có trong hệ? |
|---|---|---|
| `ContentHeader` | `PageHeader` · `Breadcrumbs` · `Chip` · `Typography` | ✅ đủ |
| `ContentTabBar` | `TabsExtended` (atom) | ✅ có atom, **thiếu** biến thể tab-phải (chọn ngôn ngữ) |
| `ContentArticle` | `SurfaceCard` · `MarkdownContent` · `FeedbackCallout` · `ContentPaywall` | ⚠️ **`MarkdownContent` chỉ có ở `_legacy`** ⇒ phải dựng lại ở composite |
| `ContentPaywall` | `IconTile` · `Typography` · `PriceTag` · `PhaseScarcityNote` · `Button` | ✅ **`PriceTag` + `PhaseScarcityNote` đã là block** — tái dùng nguyên |
| `ContentReaction` | `Button` (nhóm) · `Typography` | ✅ đủ |
| `ContentRelatedList` | `SurfaceCardList` · `ListRow` | ✅ đủ |
| `ContentDiscussion` | `SurfaceCard` · `Avatar` · `Typography` · `Input.Textarea` · `Button` | ✅ đủ |
| `ContentPager` | `SurfaceCardPressableGroup` · `Typography` · icon | ✅ đủ |

> Chỗ đáng mừng: `ContentPaywall` dùng lại **hai block đã dựng cho `CourseContents`**
> (`PriceTag`, `PhaseScarcityNote`). Đó là bằng chứng tầng block đang đúng — cùng một WHY
> ("bán khoá") tái dùng được ở hai màn khác nhau.

> Chỗ đáng lo: `MarkdownContent` là thứ nặng nhất màn này (accordion directive, code block,
> bảng, ảnh) và **đang nằm ở `_legacy`**. Nó là **composite**, không phải block — nó vẽ nội
> dung nhưng không biết "bài học" là gì.

---

## 4. Nhịp (`SeamScale`) — chọn bằng QUAN HỆ

| Chỗ | Bậc | Lý do theo câu hỏi ở `rules/1` §B2 |
|---|---|---|
| đầu ↔ thanh tab ↔ thân | `section` | ba VÙNG khác nhau của một trang |
| các block ở chân | `section` | mỗi cái là một CHỨC NĂNG riêng |
| trong `ContentPager`: nhãn ↔ tiêu đề bài | `flush` | một ĐƠN VỊ NGHĨA ("Bài trước" + tên bài) |
| trong `ContentHeader`: chip ↔ chip | `related` | NGANG HÀNG trong một tập |
| trong `ContentRelatedList`: hàng ↔ hàng | `grouped` | HÀNG xếp trong một mặt |

Khổ đọc là **`Container size="md"`** — đã kiểm: `ContainerSize = sm|md|lg|xl|full` neo vào
token `--container-app-*`, và `max-w-app-md` = 48rem = đúng cái `max-w-3xl` mà `src` đang
viết. **Không thêm bậc nào.** Và không chép `max-w-3xl` sang: chính `Container.tsx` cảnh báo
hai bên bằng nhau HÔM NAY nhưng là NGUỒN KHÁC, token đổi thì lệch âm thầm — cùng cái bẫy đã
ghi ở `rules/1` §B2.

---

## 5. BẢNG STATE — vét đủ, theo thứ tự TAB → TẢI → KHOÁ

> Luật: mỗi state là một ĐIỀU KIỆN DỮ LIỆU, không phải tên member (`check-member-as-state`).
> Mỗi state một instance (`check-one-instance-per-state`).

### 5a. `ContentScreen` (leaf theo TAB — hình đổi thật)

| Leaf | State | Điều kiện |
|---|---|---|
| `Reading` | `loading` | chưa có bài |
| | `content` | tab Content, đã mở khoá |
| | `locked` | tab Content, chưa mua ⇒ thân mờ dần + paywall, **chân biến mất** |
| `Challenges` | `content` | tab Challenges ⇒ khổ đọc, không thẻ |
| | `empty` | bài không có thử thách nào |
| `FullWidth` | `content` | tab Sandbox/AiLab ⇒ tràn ngang, **chân biến mất** |

### 5b. Từng block

| Block | Bộ state đầy đủ |
|---|---|
| `ContentHeader` | `loading` · `content` · `content-no-badge` (bài chưa đọc xong) |
| `ContentTabBar` | `content` · `content-with-language` (có tab ngôn ngữ bên phải) · **không có `loading`** — thanh này là khung tĩnh, hiện ngay, cố ý không skeleton |
| `ContentArticle` | `loading` · `content` · `content-with-hint` (lần đầu, có mách bôi chữ) · `locked` · `error` |
| `ContentPaywall` | `loading` · `content` · `content-scarcity` (còn ít suất) |
| `ContentReaction` | `loading` · `content` · `pending` (đang gửi) · `content-reacted` (đã bày tỏ) |
| `ContentRelatedList` | `loading` · `content` · `empty` ⇒ **tự ẩn hoàn toàn** (không vẽ khung rỗng) |
| `ContentDiscussion` | `loading` · `content` · `empty` (chưa ai bình luận) · `pending` (đang gửi) · `error` |
| `ContentPager` | `loading` · `content` · `content-first` (không có bài trước) · `content-last` (không có bài sau) |

> **`empty` của `ContentRelatedList` khác `empty` của `ContentDiscussion`.** Cái trước **tự
> ẩn** (không có gì liên quan thì đừng nói gì); cái sau **phải vẽ** lời mời bình luận. Cùng
> tên state, hai hành vi ngược nhau — phải ghi ra, nếu không sẽ bị làm giống nhau.

---

## 6. Hai block hoãn — vì cả hai là ca ĐIỀU KIỆN, không phải hình

- **`ContentUpNext`** chỉ hiện **trên mobile** (`@app-lg:hidden`), vì desktop đã có rail phải
  làm đúng việc đó; hiện cả hai là **hai CTA nhấn cùng lúc**. Đây là quyết định bố cục cấp
  màn, không quyết được khi rail phải chưa dựng.
- **`ContentE2eLink`** chỉ hiện khi bài có e2e. Một nút lặng ⇒ chưa đáng một block riêng cho
  tới khi biết nó còn xuất hiện ở màn nào khác.

---

## 7. BA CÂU CHỜ THẦY CHỐT

(Câu thứ tư — `Container` có bậc khổ đọc chưa — trò tự kiểm được: **có, `size="md"`**.)

1. ~~`Container` có bậc khổ đọc chưa?~~ **Tự trả lời được: có, `size="md"`.** Không cần hỏi.
2. **`MarkdownContent` dựng lại ở `composites/rendering/`** — đúng tầng chứ? Nó vẽ nội dung mà
   không biết "bài học", nên trò đọc là composite. Nhưng nó là thứ to nhất màn này.
2. **`ContentTabBar` tràn ngang trong khi mọi thứ khác bị bó khổ đọc** — giữ đúng như `src`,
   hay bó luôn cho thẳng lề?
3. **Thứ tự dựng:** trò đề xuất `ContentHeader` → `ContentPager` → `ContentTabBar` →
   `ContentArticle` (+`ContentPaywall`) → `ContentReaction` → `ContentRelatedList` →
   `ContentDiscussion`. Hai cái đầu nhẹ và độc lập nên ra hình sớm để thầy fixback trước khi
   trò đụng `MarkdownContent`.

---

## 8. Trò CHƯA làm gì trong lượt này

Không file nào dưới `.storybook/` bị đụng. Cây trên suy từ `src`. Hai chỗ trò **chưa kiểm
được** còn lại: §3a (`MarkdownContent` thuộc tầng nào) và §5b (`ContentTabBar` cố ý không
skeleton) — đó là hai chỗ dễ sai nhất nếu dựng mà không hỏi.
