# BƯỚC 9 — MÀN `Content` (đọc một bài): CÂY + BẢNG STATE

> **CHƯA VIẾT CODE.** Đây là barrier của `steps/1` — vẽ cây, vét state, thầy duyệt rồi mới dựng.
>
> Nguồn đọc: `src/components/features/learn/LessonReader/**` (432 dòng `index.tsx`) và
> `src/app/[locale]/courses/[courseId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx`.
> **Không bê từ `_legacy`** (thầy chốt 2026-07-28) — `_legacy` chỉ dùng để soi HÌNH.

---

## 1. Danh sách chức năng (B1 — chưa nghĩ hình)

> **PHẠM VI: đúng những gì `page.tsx` dựng lên, không hơn.** `page.tsx` render duy nhất
> `<LessonReader />`, nên màn này = cây con của `LessonReader`.

> *"bài này là gì · xem bài dưới dạng nào · đọc bài · nói cảm nhận · bàn luận · đọc gì tiếp ·
> lùi/tới bài"*

**BẢY** câu.

### ⚠️ Bản đầu trò kê CHÍN — thầy bắt đúng hai chỗ thừa

| Trò từng kê | Thật ra là gì |
|---|---|
| *"mở khoá để đọc tiếp"* | **STATE của "đọc bài"**, không phải chức năng. Paywall chỉ hiện khi `locked`, và nằm NGAY TRONG thẻ đọc — chính cây của trò ở §3 đã đặt `ContentPaywall` làm con của `ContentArticle`. Kê nó thành chức năng là **tự đá cây của mình**. |
| *"xem kết quả e2e"* | **TRIGGER của một overlay.** `E2eResultButton` chỉ gọi `open()` từ store để bật `@/components/drawers/E2eResultDrawer` — một drawer TOÀN CỤC mount ở chỗ khác. Trang này không sở hữu nó. |

Dấu hiệu lộ ra ngay trong chính tài liệu: danh sách ghi **9 chức năng** nhưng mục dựng ghi
**7 block**. Hai con số không khớp là bằng chứng danh sách bị độn, không cần đọc thêm gì.

> **Luật rút ra:** một dòng chỉ là CHỨC NĂNG khi nó là việc người học tới trang này để làm.
> Nếu nó chỉ xuất hiện ở một điều kiện của việc khác ⇒ **state**. Nếu nó chỉ MỞ một thứ nằm
> ngoài trang ⇒ **trigger của overlay**, thuộc tầng overlay.

### Trong cây con nhưng KHÔNG phải chức năng

Ghi ra để không bị âm thầm bỏ quên khi dựng:

| | Vì sao không phải chức năng |
|---|---|
| `SelectionHintCallout` | mách cách dùng tính năng, đi kèm `ContentArticle` |
| `AdBanner` | doanh thu chèn vào, không phải việc người học tới đây để làm |
| `E2eResultButton` | trigger overlay (xem trên) |

### Ngoài phạm vi — do LAYOUT sở hữu

`learn/layout.tsx` dựng `LearnShell` · `ResizableRail` · `ContentMap` · `OnThisPage` ·
`MilestoneOutline` · `ContentAiFab` · `ContentAiSelectionAsk` + các gate. Hai `layout.tsx` gần
hơn (`modules/`, `modules/[moduleId]/`) đều **pass-through**. Không đụng gì trong số này.

---

## 2. Điều quyết định TOÀN BỘ hình: màn này có BA thân, không phải một

`LessonReader` đổi **khung của thân** theo tab đang chọn — đây là thứ dễ bỏ sót nhất và nó
chi phối cả cây lẫn bảng state:

| Tab | Khung thân | Vì sao |
|---|---|---|
| Sandbox · AI Lab | **tràn hết bề ngang**, không thẻ | công cụ cần chỗ, không phải trang giấy |
| Challenges | khổ đọc, **phẳng** (không thẻ) | thân nó vốn đã là một danh sách thẻ ⇒ thẻ trong thẻ |
| Content | khổ đọc, **trong thẻ giấy** | đây mới là "trang để đọc" |

Và phần chân (cảm nhận · thảo luận · lùi/tới) **chỉ hiện khi `!isLocked && !isFullWidth`**.

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
      └──────────────────────────────────────────────────────┘
        (E2eResultButton: TRIGGER overlay — không phải block của màn này)
```

**Bảy block dựng lượt này:** `ContentHeader` · `ContentTabBar` · `ContentArticle` ·
`ContentReaction` · `ContentRelatedList` · `ContentDiscussion` · `ContentPager`.
**Một block hoãn:** `ContentUpNext` (xem §6).
**Bỏ hẳn khỏi màn:** `ContentE2eLink` — nó là trigger của drawer toàn cục, thuộc tầng overlay.
**Ba block chưa bàn:** `ContentSandbox` · `ContentAiLab` · `ContentChallengeList` — chúng là
công cụ, không phải việc đọc; xứng một lượt riêng.

### 3a. Mỗi block gồm gì (đọc từ `src`, không bịa)

| Block | Ghép từ | Đã có trong hệ? |
|---|---|---|
| `ContentHeader` | `PageHeader` · `Breadcrumbs` · `Chip` · `Typography` | ✅ đủ |
| `ContentTabBar` | `TabsExtended` (atom) | ✅ có atom, **thiếu** biến thể tab-phải (chọn ngôn ngữ) |
| `ContentArticle` | `SurfaceCard` · `MarkdownContent` (viewer) · `FeedbackCallout` · `ContentPaywall` | ⚠️ **`MarkdownContent` chỉ có ở `_legacy`** ⇒ dựng lại ở `composites/viewers/` |
| `ContentPaywall` | `IconTile` · `Typography` · `PriceTag` · `PhaseScarcityNote` · `Button` | ✅ **`PriceTag` + `PhaseScarcityNote` đã là block** — tái dùng nguyên |
| `ContentReaction` | `Button` (nhóm) · `Typography` | ✅ đủ |
| `ContentRelatedList` | `SurfaceCardList` · `ListRow` | ✅ đủ |
| `ContentDiscussion` | `SurfaceCard` · `Avatar` · `Typography` · `Input.Textarea` · `Button` | ✅ đủ |
| `ContentPager` | `SurfaceCardPressableGroup` · `Typography` · icon | ✅ đủ |

> Chỗ đáng mừng: `ContentPaywall` dùng lại **hai block đã dựng cho `CourseContents`**
> (`PriceTag`, `PhaseScarcityNote`). Đó là bằng chứng tầng block đang đúng — cùng một WHY
> ("bán khoá") tái dùng được ở hai màn khác nhau.

> Chỗ đáng lo: `MarkdownContent` là thứ nặng nhất màn này (accordion directive, code block,
> bảng, ảnh) và **đang nằm ở `_legacy`**. Nó là **viewer** (`composites/viewers/`): vẽ nội
> dung mà không biết "bài học" là gì, và **không đoán được hình của chính nó**.

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

## 6. Một block hoãn, một block BỎ HẲN

- **`ContentUpNext`** chỉ hiện **trên mobile** (`@app-lg:hidden`), vì desktop đã có rail phải
  làm đúng việc đó — mà **rail đó do LAYOUT sở hữu, không phải màn này**. Nên nó là bản gương
  mobile của một thứ nằm ngoài trang; quyết được hình của nó chỉ sau khi biết layout vẽ rail
  ra sao. Hoãn, không bỏ.
- ~~`ContentE2eLink`~~ **KHÔNG hoãn — bỏ hẳn.** Nó không phải "một nút lặng chưa đáng block",
  nó là **trigger của một drawer toàn cục**. Xếp nó vào màn là đặt sai tầng, không phải đặt
  sai thứ tự.

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
