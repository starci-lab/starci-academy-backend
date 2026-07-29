# NAMING — đặt tên component, story, type, file, thư mục thế nào

> Trục này trả lời đúng một câu: **đặt tên component, story, type, file, thư mục thế nào.**
> Không trả lời tầng nào chứa gì (xem `4-organization.md` §1), chỉ trả lời KHUÔN chữ.
> Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
---

## 1. THANG — không phải số, là KHUÔN tên cho từng LOẠI artefact

Trục này không có một thang có thứ tự. Có **8 LOẠI ĐỊNH DANH** trong repo, xếp theo đúng thứ
tự một component đi qua từ lúc sinh ra tới lúc dùng, cộng **1 LOẠI VĂN XUÔI** (loại 9) không
phải định danh mà là chữ đọc thành câu. Mỗi loại một khuôn cố định.
**Tiêu chí vét cạn: đủ 8 loại định danh, cộng loại 9 cho chữ không định danh.**

Loại 9 đứng ngoài phép đếm cặp ở §3, cố ý: nó là VĂN XUÔI, không phải tên, nên không thể lẫn
với tám loại kia. Phép đếm `C(8,2)` ở §3 vẫn giữ nguyên mẫu số 28.

| # | Loại | Khuôn | Class/token thật | Ý nghĩa |
|---|---|---|---|---|
| 1 | **Thư mục (họ)** | LOẠI phần tử → số NHIỀU (`cards`, `chips`, `buttons`). Danh từ MIỀN → giữ số ít (`learn`, `commerce`, `ai`) | `components/composites/cards/`, `components/starci/blocks/commerce/` | phân biệt "nhóm theo hình" (nhân bản được, plural đúng) với "nhóm theo nghĩa nghiệp vụ" (không nhân bản, số ít đúng) |
| 2 | **File impl `.tsx`** | PascalCase trùng tên export chính, 1 file = 1 component đã FLATTEN (không còn `X.Member`) | `ContinueCard.tsx` export `ContinueCardHero`, `ContinueCardItem` | §3b: dấu chấm bị xoá 2026-07-28, file vẫn có thể gom nhiều export cùng gốc |
| 3 | **File story `.stories.tsx`** | PascalCase trùng Component, hoặc `ComponentMember.stories.tsx` khi phải tách file theo member | `SurfaceCardList.stories.tsx`, `ContinueCardHero.Progress.stories.tsx` | 1 file story = 1 MEMBER, nhưng ranh giới MEMBER-vs-STATE hay bị lẫn, xem §3a cặp 3 |
| 4 | **Story title (`title:`)** | `Tier/Family/Component[/device][/state]`, mỗi đoạn PascalCase, KHÔNG khoảng trắng | `"Atoms/Chips/Chip/ChipGroup"`, `"StarCi/Pages/CourseContents/Desktop/Paid"` | path này là địa chỉ sidebar thật, đổi = đổi storyId |
| 5 | **Story export (state)** | PascalCase đọc như ĐIỀU KIỆN DỮ LIỆU (`Default`, `Loading`, `NotStarted`) — KHÔNG đọc như tên component | `export const NotStarted`, `export const LoadError` | cấm dạng `Foo.Bar` — đó là MEMBER giả trang STATE, gate `check-member-as-state.mjs` |
| 6 | **Type/interface** | hậu tố theo VAI: `XProps` (props) · `XLike` (thực thể miền truyền vào) · `XItem` (phần tử của `items`) · `XStyle`/`XConfig` (giá trị bảng tra) | `ChipBaseProps`, `InputButtonLike`, `AvatarGroupItem`, `AvatarSizeStyle` | không phải chỗ dùng quyết định hậu tố, mà VAI của hình dữ liệu quyết định |
| 7 | **Prop trong interface** | camelCase, đối xứng với prop anh em cùng vai (`isLoading`/`isDisabled`, không đổi `label` cũ khi nghĩa khác) | `isSkeleton`, `onRetry` | rút từ ca `Button` 2026-07-26: đặt tên prop đối xứng, không tự chế tên riêng |
| 8 | **Biến cục bộ** | camelCase mô tả nghĩa, không viết tắt, không Hungarian | — | **THANG CHƯA CÓ GATE** — không tìm thấy rule `naming-convention` trong `eslint.config.mjs`; đây là kỷ luật, không phải máy kiểm |
| 9 | **Chuỗi văn xuôi hiện panel** (KHÔNG phải định danh) | **CÂU đầy đủ có chủ ngữ và động từ.** Cấm `—` làm dấu nối, cấm `↔` `->` `=>` | `why` · `reason` · `role` của node · `leaf` trong `BlockAnatomy` | thầy chốt 2026-07-27, xem §4.7. Ngoại lệ: bảng markdown trong JSDoc, neo `§`, và mũi tên trong sơ đồ cây (`→ Page.Header`) vẫn giữ, vì ở đó chúng là CẤU TRÚC chứ không phải câu |

SSOT tầng (Tier ở dòng 4): **ĐÃ CHỐT 2026-07-29** — `INDEX.md` mục "Tên tầng chính thức",
đĩa làm trọng tài. 9 tầng: `heroui · atom · behavior · frame · composite · block · layout ·
overlay · page`. `designs` và `screens` đã CHẾT (`screens` gọi là `page`/`pages` trên đĩa).
Xem §6 vạch cấm cuối, mục trước từng "CHỜ THẦY CHỐT" nay đã đóng.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi để biết đang đặt tên cho LOẠI nào, rồi áp đúng khuôn

| # | Hỏi | Ra |
|---|---|---|
| 1 | Đây là một **thư mục** gom nhiều file cùng cấp? | Có tên component-type lặp lại được ⇒ **plural** (loại 1a). Có tên miền nghiệp vụ cố định ⇒ **giữ số ít** (loại 1b) |
| 2 | Đây là **file `.tsx` không phải `.stories.tsx`**? | Loại 2 — PascalCase trùng export, không dấu chấm |
| 3 | Đây là **file `.stories.tsx`**? | Loại 3 — hỏi tiếp: file này có ĐÚNG MỘT export gốc hay đang gánh nhiều MEMBER khác API? Một ⇒ tên file = Component. Nhiều ⇒ `ComponentMember` |
| 4 | Đây là chuỗi trong `title:`? | Loại 4 — ghép theo `Tier/Family/Component`, thêm nhánh device/state nếu cây sâu hơn 3 nấc |
| 5 | Đây là `export const` bên trong file story? | Loại 5 — tự hỏi: xoá hết state khác, component còn GỌI ĐƯỢC bằng tên khác không? Không (chỉ prop đổi) ⇒ tên = điều kiện dữ liệu. Có (đây là cửa gọi khác) ⇒ đây thực ra là MEMBER, quay lại loại 3/4 |
| 6 | Đây là `interface`/`type`? | Loại 6 — hỏi: hình này là props của 1 component? `XProps`. Là thực thể miền truyền vào? `XLike`. Là phần tử của mảng `items`? `XItem`. Là giá trị của `Record<Enum, …>`? `XStyle`/`XConfig` |
| 7 | Đây là field trong `interface Props`? | Loại 7 — camelCase, so với prop anh em cùng interface để giữ đối xứng |
| 8 | Còn lại (khai báo trong thân hàm)? | Loại 8 — camelCase, không viết tắt |
| 9 | **Hỏi TRƯỚC cả câu 1:** chuỗi này có HIỆN LÊN PANEL cho người đọc không (`why`/`reason`/`role`/`leaf`)? | Có ⇒ **Loại 9, dừng ngay tại đây** — đây không phải việc đặt tên, đây là viết câu. Không ⇒ đi tiếp từ câu 1 |

**Trước khi tin cây: nếu loại 4 (story title) đã có 3+ file cùng Component nhưng khác state
(`ContinueCardHero.Progress` / `ContinueCardHero.NoProgress`), dừng lại — đây là dấu hiệu của
bẫy §4.2, không phải câu hỏi 5 trả lời được ngay.**

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Namespace `X.Member` trong file component (`Object.assign`, `export const X = { Base }`) | ✅ `check-no-namespace.mjs` |
| 2 | Type object literal ẩn danh ở prop/generic/tham số hàm | ✅ `check-inline-types.mjs` |
| 3 | Story export đặt tên như MEMBER (`Foo.Bar` PascalCase, không `=`/số/chữ thường) thay vì điều kiện dữ liệu | ✅ `check-member-as-state.mjs` |
| 4 | `storyId` trỏ sang story không tồn tại (đổi tên quên sửa neo) | ✅ `check-story-ids.mjs` |
| 5 | Tên hiển thị trong `title:`/`export const` có khoảng trắng hoặc prose (`"No progress"`) | ⬜ **CHƯA — cần viết**: quét đoạn cuối mọi `title:` và mọi `export const <Name>`, báo đỏ nếu chứa dấu cách hoặc ký tự thường ở đầu |
| 6 | Thư mục họ đặt số ít khi gom LOẠI phần tử nhân bản được | ⬜ **CHƯA — cần viết**: cần danh sách domain-noun cố định (`learn`, `commerce`, `ai`…) để loại trừ, phần còn lại kiểm plural bằng heuristic đuôi `s` |
| 7 | Suy tên loại 6/7 (type/prop) theo CHỖ DÙNG thay vì theo VAI của hình dữ liệu | ⛔ không gate được — kỷ luật, cần đọc hiểu ngữ nghĩa hình |
| 8 | Viết tắt/Hungarian cho biến cục bộ (loại 8) | ⛔ không gate được — không có rule `naming-convention` trong `eslint.config.mjs` |
| 9 | **Ký hiệu nối trong chuỗi panel** (loại 9): `—` làm dấu nối, `↔`, `->`, `=>` trong `why`/`reason`/`role`/`leaf` | ⬜ **CHƯA — viết được, nên viết sớm**: quét mọi `.stories.tsx` lấy giá trị bốn khoá đó, báo đỏ nếu chứa `—` `↔` `->` `=>`. KHÔNG quét JSDoc, comment, hay sơ đồ cây (ngoại lệ đã khai ở loại 9) |

**✅ ĐÃ CHỐT 2026-07-29 — TÊN TIER, xem `INDEX.md` mục "Tên tầng chính thức":**
- Trước ngày này năm nguồn khai năm danh sách khác nhau; chuẩn là **tên thư mục thật trên đĩa**.
- 9 tầng chính thức: `heroui` (không có thư mục, chỉ badge trong `ANNOTATE`) · `atom`
  (`atoms/`) · `behavior` (`behaviors/`, primitive KHÔNG HÌNH) · `frame` (`frames/`) ·
  `composite` (`composites/`) · `block` (`<app>/blocks/`) · `layout` (`<app>/layouts/`) ·
  `overlay` (`<app>/overlays/`) · `page` (`<app>/pages/`).
- `designs` (từ `4-organization.md` §1 cũ) và `screens` (từ đề bài giao việc cũ) đã CHẾT —
  `screens` gọi là `page`/`pages` trên đĩa, `designs` không tồn tại ở tầng nào.
- Tầng và app là HAI TRỤC VUÔNG GÓC: tầng dùng chung (`heroui, atom, behavior, frame,
  composite`) nằm ở gốc; tầng theo app (`block, layout, overlay, page`) nằm dưới `<app>/`.

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
---

## 3. VÉT CẠN CA DỄ LẪN — 8 loại, đếm theo trình tự pipeline, không phải theo thứ bậc số

8 loại không phải một thang có thứ tự tuyến tính theo giá trị, nên phép đếm `C(8,2) = 28`
dùng làm MẪU SỐ tổng, nhưng chỉ 3a (các loại LIỀN KỀ trong pipeline sinh-ra-dùng) là nơi
nhầm thật xảy ra. Trình tự pipeline: **thư mục → file impl → file story → story title →
story export → type → prop → biến cục bộ.**

### 3a. Bảy cặp KỀ NHAU trong pipeline — đây là toàn bộ trận đánh

Bốn cặp chưa cắn thật (rủi ro lý thuyết, bỏ cột phép phân định): **thư mục ↔ file impl** ·
**file impl ↔ file story** (⛔ không lẫn) · **story export ↔ type suffix** · **prop ↔ biến cục
bộ**. Ba cặp đã cắn thật giữ nguyên:

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **file story ↔ story title** | Tên FILE có nhất thiết = đoạn CUỐI của `title:` không? Không nhất thiết — file gộp nhiều state vẫn 1 title; nhưng file TÁCH theo state cho MỘT title có 2 đường dẫn (`Hero/Progress`, `Hero/No progress`) ⇒ đang lẫn STATE với MEMBER, xem cặp kế | ✅ 1 lần (`ContinueCardHero` — 2 file, chưa gộp) |
| **story title ↔ story export** | Đoạn cuối `title:` có đọc như MỘT ĐIỀU KIỆN DỮ LIỆU hay như MỘT CỬA GỌI KHÁC? Đường dẫn khác nhau (`Hero/Progress` vs `Hero/No progress`) = 2 CỬA GỌI KHÁC ⇒ đúng là 2 MEMBER, không gộp làm state của 1 export. Nhưng nếu 1 title có nhiều `export const` bên trong đọc được như tên component (`export const SurfaceCardList`) thì đó là STATE giả trang MEMBER ⇒ sai, tách file | ✅ gate `check-member-as-state.mjs` viết ra đúng vì ca này |
| **type suffix ↔ prop** | Đang đặt tên cho HÌNH DỮ LIỆU (đi kèm `interface`) hay cho MỘT FIELD bên trong hình đó? Field ⇒ prop, camelCase. Cả hình ⇒ type, hậu tố theo vai | ✅ 73/44 chỗ trước gate — lẫn ở CHỖ để hình chứ không lẫn TÊN, xem `example.html` |

### 3b. Sáu cặp CÁCH MỘT LOẠI — câu hỏi cấp trên chưa trả lời

| Cặp | Đọc thế nào |
|---|---|
| thư mục ↔ file story | Phân vân ở đây nghĩa là chưa trả lời câu 3a "thư mục ↔ file impl" trước — trả lời nó rồi tự suy ra |
| file impl ↔ story title | Chưa trả lời "file impl có = 1 component không", quay lại 3a |
| file story ↔ story export | Chưa trả lời "file story ↔ story title" — cùng gốc bẫy `ContinueCardHero` |
| story title ↔ type suffix | Đang so một PATH với một TÊN KIỂU — không cùng loại, quay lại cây §2 xác định loại trước |
| story export ↔ prop | Chưa trả lời "story export ↔ type suffix" |
| type suffix ↔ biến cục bộ | Chưa trả lời "type suffix ↔ prop" |

### 3c. Mười lăm cặp CÁCH XA — cố ý không có phép thử

`C(8,2) = 28 − 7 − 6 = 15`. Các cặp cách từ 2 bậc trở lên: phân vân ở đó là dấu hiệu cây vẽ
sai, không phải chọn sai giá trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

---

## 4. BẪY CẤU TRÚC — sai không nằm ở chọn khuôn, mà ở đọc sai cấu trúc

1. **Namespace đọc như biến thể, thực ra là thư mục.** `X.Member` hứa một họ hàng chung chữ
   ký prop, nhưng đo trước khi xoá chỉ **1/10** namespace thật sự chung chữ ký — chín cái còn
   lại gom API khác hẳn dưới một tên. Đã flatten hết (`check-no-namespace` báo 0), nhưng viết
   component mới mà gõ `X.Member` là tái tạo đúng lỗi này.
2. **STATE tách FILE bị đọc nhầm thành đã "xong" việc gộp.** `ContinueCardHero.Progress` và
   `ContinueCardHero.NoProgress` là hai FILE cho cùng một MEMBER `Hero` — đúng ra phải gộp 1
   file 2 leaf, nhưng đang tồn tại như 2 title riêng (`Hero/Progress`, `Hero/No progress`).
   Đổi cả hai thành `ContinueCard.Hero` ngay bây giờ sẽ **trùng title, vỡ index** — phải gộp
   file trước, đổi tên sau, không được làm ngược.
3. **Tên hiển thị có khoảng trắng lọt qua.** `"No progress"` (chưa PascalCase, còn dấu cách)
   nằm ngay trong title thật đang chạy. Không có gate nào bắt khoảng trắng trong `title:`, nên
   nó sống sót qua tsc/eslint — phải đọc mắt hoặc viết gate mới (§6 dòng 5).
4. **Family bị ép plural nhầm cho danh từ miền.** `learn`, `commerce`, `ai` là tên NGHIỆP VỤ
   cố định, không phải "loại phần tử" nhân bản được — ép plural (`Learns`, `Commerces`) là
   hiểu sai câu hỏi 1 của cây §2, không phải chọn sai chữ.
5. **Type ẩn danh không có tên để import.** Gate `check-inline-types.mjs` từng đếm nhầm
   154 vì lẫn VỊ TRÍ TYPE với VỊ TRÍ GIÁ TRỊ (const map). Bẫy thật: hai call-site cùng mô tả
   tay một hình không tên sẽ lệch nhau — đặt tên (loại 6) chặn đứng lỗi này từ gốc.
6. **Tier trong bài viết không khớp tier trên đĩa.** ĐÃ CHỐT 2026-07-29 (`INDEX.md` mục "Tên
   tầng chính thức", đĩa làm trọng tài) — đừng lấy VÍ DỤ path từ tài liệu cũ (`designs`,
   `screens`) rồi coi là neo, hai tên đó đã CHẾT.
7. **Viết chuỗi panel như ĐẶT TÊN thay vì như VIẾT CÂU** (loại 9, thầy chốt 2026-07-27).
   Đây là bẫy về LOẠI, không phải về khuôn chữ: người viết đang ở tâm thế đặt định danh nên
   nén ý bằng ký hiệu, trong khi ô đó là chỗ đọc thành câu.

   | | |
   |---|---|
   | ❌ trước | `lead row — icon ↔ text cluster, center-aligned` |
   | ✅ sau | `lead row where the icon sits beside the text cluster, both centred on the same line` |

   Ba lý do, không phải khẩu vị. **Panel là cột hẹp** nên chữ xuống dòng ở bất kỳ đâu; ký hiệu
   bị tách khỏi hai đầu của nó thì mất nghĩa, còn câu thì vẫn đọc được. **Người đọc cuối là LLM
   dựng lại UI**, gặp `A ↔ B` thì phải đoán quan hệ, mà đoán chính là chỗ nó bịa. Và ký hiệu
   **không dịch được**: `↔` mỗi người hiểu một nghĩa (đối xứng, chuyển đổi, hay chỉ là cạnh nhau).

   ⚠️ Luật này từng **mất tích**: nó sinh ra ở `rules/4-organization.md` §4a, và khi canon rã
   thành 15 trục thì không trục nào nhận, vì nó không phải một lựa chọn giá trị mà là một ràng
   buộc cách viết. Nhặt về đây 2026-07-29. Bài học chung: **luật không vừa khuôn trục là luật
   sắp rơi** — gặp ca như vậy thì phải nói ra, đừng để nó tự tìm chỗ.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Cấu trúc thư mục + `title:` thật trong `.storybook/` hiện có trên đĩa** — luôn đọc lại
   bằng `grep`/`ls`, không chép từ tài liệu.
2. `4-organization.md` — canon còn sống, nhưng **đã lạc hậu một phần** (xem §6 cuối).
3. `.artifacts/decompose/storybook-naming.html` — **CHẾT MỘT NỬA**: đúng ở khuôn plural-family
   và PascalCase-identifier, **sai** ở tên tier (`Primitives/Design/Block/Layouts/Overlays`
   không còn tồn tại từ 2026-07-28). Chỉ lấy phần khuôn chữ, bỏ mọi ví dụ path của nó.

Neo cụ thể từng loại: [`example.html`](example.html).
