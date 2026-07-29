# SKELETON — `isSkeleton` có cần không, và hình shimmer vẽ ra sao

> Trục này trả lời đúng một câu: **component này có cần `isSkeleton` không, và hình shimmer
> vẽ ra sao.**
> Không trả lời rỗng/lỗi (xem `async/` — chưa dựng), không trả lời khoảng cách (xem `seam/`).
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG — 7 HÌNH shimmer, không có hình thứ tám

Đây **không phải thang có thứ tự** (không có "giữa hình 1 và hình 3"). Thang là một tập
CATEGORICAL 7 giá trị, mỗi giá trị là một CÁCH VẼ khác nhau, đọc từ chính component thật
(không có type định nghĩa `SkeletonShape` trong code — thang này RÚT RA từ việc đọc 24 component
đã sửa ở §2r/§2s, không phải bịa).

| # | Hình | Neo thật | Khi nào |
|---|---|---|---|
| 0 | **KHÔNG CÓ SKELETON RIÊNG** | `SurfaceCard`/`Container` (frame tier §4) | khung chỉ bọc slot/children, bản thân không sinh pixel nào — con bên trong tự lo `isSkeleton` của nó |
| 1 | **NODE ĐƠN** | `CoverImage.tsx`, `Typography.tsx` (nhánh `isSkeleton`) | root của nhánh skeleton CHÍNH LÀ một `HeroSkeleton`, không có wrapper riêng |
| 2 | **MIRROR NHIỀU NODE CỐ ĐỊNH** | `MarkdownContent.tsx` (2 `HeroSkeleton` bar) | vài node shimmer, số lượng ĐẾM ĐƯỢC và KHÔNG phụ thuộc dữ liệu/prop |
| 3 | **MIRROR THEO TRỤC BIẾT TRƯỚC** | `ProgressRing.tsx` (theo `size`), `Breadcrumbs.tsx` (theo `collapseFrom`/`collapseOnMobile`) | có trục hình mà caller đã CẤU HÌNH SẴN trước khi tải, PHẢI rẽ nhánh theo nó |
| 4 | **ĐẾM HÀNG THEO PROP RIÊNG** | `Legend.tsx` (`skeletonCount = 3`), `KeyValue.tsx` `KeyValueList` (`skeletonRows = 3`) | danh sách LẶP mà số hàng thật CHƯA BIẾT lúc tải, có prop riêng + mặc định |
| 5 | **CHUYỀN CỜ XUỐNG CON** | `SegmentBar.tsx` → `Legend` (`<Legend isSkeleton skeletonCount= />`), `StatRibbon` → `StatPair` | component con ĐÃ CÓ sẵn `isSkeleton` của chính nó — không tự dựng cây shimmer song song |
| 6 | **MỘT HÌNH DUY NHẤT (không rẽ nhánh)** | `Pagination.tsx` | trục hình DO DỮ LIỆU quyết (chưa biết lúc tải) — cố ý không bịa biến thể |

SSOT của khuôn: `§12g.0`/`§12g.0a`/`§12c` của canon
[`principles/skeleton/context.md`](../skeleton/context.md) (chính trục này). **Không có type
định nghĩa thang này trong code** — mỗi component tự viết union `isSkeleton` riêng (xem §5 NEO THẬT).

---

## 2. CÂY QUYẾT ĐỊNH — 5 câu hỏi, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| Q1 | Component này có tự vẽ HÌNH nào không (hay chỉ là khung agnostic bọc slot/children — §4)? | KHÔNG ⇒ **hình 0**, dừng — con bên trong tự lo |
| Q2 | Phần hiện trong nhánh skeleton có phải một COMPONENT KHÁC (đã import) mà chính nó **ĐÃ CÓ** `isSkeleton` riêng không? | CÓ ⇒ **hình 5** — chỉ chuyền cờ xuống, KHÔNG tự dựng `HeroSkeleton` bọc ngoài |
| Q3 | Đây có phải DANH SÁCH LẶP (nhiều dòng/mục CÙNG LOẠI) mà số lượng thật phụ thuộc DỮ LIỆU không? | CÓ ⇒ **hình 4** — thêm prop đếm (`skeletonRows`/`skeletonCount`) + mặc định hợp lý |
| Q4 | Component có trục hình khác (`size`/`variant`/`collapseFrom`…) không, và trục đó caller **BIẾT TRƯỚC** (cấu hình tĩnh) hay **DO DỮ LIỆU quyết** (chỉ biết SAU khi tải xong)? | biết trước ⇒ **hình 3** (PHẢI rẽ nhánh) · do dữ liệu ⇒ **hình 6** (cố ý một hình) · không có trục nào ⇒ Q5 |
| Q5 | Hình cố định đó có NHIỀU HƠN MỘT node/dòng shimmer không? | CÓ ⇒ **hình 2** · KHÔNG (chỉ 1 node) ⇒ **hình 1** |

**Trước khi tin cây: nhánh `isSkeleton` luôn phải đứng TRƯỚC mọi nhánh rẽ hình khác trong
hàm** (§12g §"⚠️ Nhánh isSkeleton phải xét TRƯỚC"), và nếu component có hook thật, nhánh đó
phải đứng **SAU khi mọi hook đã gọi xong** (§4 mục 2). Xem §4 BẪY CẤU TRÚC.

---

## 3. VÉT CẠN CA DỄ LẪN — 7 giá trị ⇒ `C(7,2) = 21` cặp

Thang không có thứ tự tuyến tính nên "kề nhau" được định nghĩa lại: hai giá trị **kề nhau**
khi chúng là hai nhánh trả lời của **CÙNG MỘT câu hỏi** trong cây §2 (khác nhau đúng một
quyết định). Liệt kê đủ 21 cặp, không chọn lọc.

### 3a. Bảy cặp KỀ NHAU trên cây — mỗi cặp một phép phân định dứt khoát

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **0 ↔ 1** | Bỏ hết slot/children ra, phần XƯƠNG còn lại của chính component này có tự vẽ pixel nào không (ảnh/chữ/icon)? Không còn gì ⇒ `0`. Còn một hình ⇒ `1`. | chưa |
| **1 ↔ 2** | Nội dung thật là MỘT đơn vị đọc (nhãn, ảnh) hay một TÀI LIỆU nhiều dòng LUÔN cố định kết cấu? Một đơn vị ⇒ `1`. Nhiều dòng cố định không phụ thuộc dữ liệu ⇒ `2`. | chưa |
| **2 ↔ 4** | Số node shimmer đó là một THAM SỐ consumer truyền (`skeletonRows`/`skeletonCount`) hay LUÔN một hằng số viết chết trong code? Hằng số ⇒ `2`. Có prop đếm mặc định ⇒ `4`. | chưa |
| **1 ↔ 5** | Phần tử trong nhánh skeleton có phải một COMPONENT KHÁC đã có sẵn `isSkeleton` của chính nó không? Có ⇒ `5` (chỉ chuyền cờ). Chưa ai định nghĩa hình đó ⇒ tự vẽ (`1`). | ⚠️ suýt cắn: `SegmentBar` từng tự bọc thêm `<div data-anat-part="Legend">` NGOÀI `Legend` con thay vì chuyền thẳng badge, sửa lại §2s |
| **2 ↔ 5** | Cùng phép thử trên, áp cho "nhiều node cố định": phần đó có phải 1 composite con đã có `isSkeleton` không? | như trên |
| **3 ↔ 5** | Cùng phép thử trên, áp cho "trục biết trước": trục đó có đang được DELEGATE cho 1 component con (thay vì tự tra bảng size/variant) không? | chưa |
| **3 ↔ 6** | Trục hình đó, giá trị của nó caller có VIẾT SẴN trong code TRƯỚC khi request chạy không (`size`, `collapseFrom`), hay chỉ biết SAU khi dữ liệu resolve (`totalPages`)? Biết trước ⇒ `3`, PHẢI rẽ nhánh. Do dữ liệu ⇒ `6`, cố ý một hình. | ✅ 2 lần: `Breadcrumbs` từng để `isSkeleton` bỏ qua `collapseFrom`/`collapseOnMobile`; `Tabs.Base` bỏ qua `variant` (secondary vẫn vẽ pill của primary) |

### 3b. Năm cặp CÙNG NHÁNH CHA — câu hỏi cấp trên chưa trả lời, không có phép thử riêng

| Cặp | Đọc thế nào |
|---|---|
| `0 ↔ 2` | Chưa trả lời được Q1 ("component này có tự vẽ hình không"). Trả lời Q1 trước rồi mới hỏi tiếp. |
| `0 ↔ 4` | Cùng lý do — một khung bọc DANH SÁCH con (con tự có `skeletonRows`) không có nghĩa BẢN THÂN khung này cũng cần `isSkeleton`. |
| `1 ↔ 3` | Chưa trả lời được Q4 ("component này có trục hình nào không"). Một hình "trông như 1 node" nhưng có `size`/`variant` thật ra thuộc `3`, không phải `1`. |
| `3 ↔ 4` | Chưa trả lời được Q3 ("đây có phải danh sách LẶP không"). Một cụm 1-node-nhiều-cấu-hình (`3`) khác hẳn danh sách N-hàng (`4`). |
| `4 ↔ 6` | Cùng lý do Q3 — `4` là list biết số hàng qua prop, `6` là một hình vì trục do dữ liệu; đây là 2 khái niệm khác trục, không so trực tiếp được. |

### 3c. Chín cặp CÁCH XA — không có phép thử, và cố ý không có

`0↔3` · `0↔5` · `0↔6` · `1↔4` · `1↔6` · `2↔3` · `2↔6` · `4↔5` · `5↔6`

**Phân vân giữa hai giá trị ở nhóm này là dấu hiệu ĐỌC SAI Q1 hoặc Q2 ngay từ đầu**, không
phải chọn nhầm hình. Dừng lại, trả lời lại Q1 ("có tự vẽ hình không") và Q2 ("có đang compose
1 component con đã có sẵn isSkeleton không") trước khi chọn tiếp.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn hình, mà vì đọc sai cấu trúc/thứ tự

1. **Nhánh `isSkeleton` đặt SAU một nhánh rẽ hình khác.** ❌ neo: `Typography` từng để việc
   check `isSkeleton` dưới nhánh heading → `size="h3" isSkeleton` render ra heading RỖNG, tsc/eslint
   không bắt được. Sửa: `isSkeleton` phải là `if` ĐẦU TIÊN, trước mọi nhánh khác.
2. **Component CÓ HOOK mà đặt early-return `isSkeleton` TRƯỚC khi mọi hook đã gọi xong** — vi
   phạm Rules of Hooks (hook bị gọi có điều kiện). ❌ neo: `MarkdownContent.tsx` (2026-07-29) tự
   đặt sai HAI lần liên tiếp (trước cả `useRef`/`useMemo`, rồi vẫn còn một `useMemo` kẹt lại sau
   nhánh) trước khi sửa đúng — nhánh chỉ hợp lệ SAU dòng cuối cùng gọi hook. Khác component không
   hook (`Typography` — "đầu hàm" là đủ).
3. **Bỏ qua trục "biết trước" khi vẽ skeleton — vẽ một hình chung cho MỌI cấu hình.** ❌ neo:
   `Breadcrumbs` (bỏ qua `collapseFrom`/`collapseOnMobile`), `Tabs.Base` (bỏ qua `variant`). Đây
   không phải chọn sai hình 3 hay 6 — đây là ĐÃ Ở hình 3 nhưng quên rẽ nhánh.
4. **Tự dựng lại cây shimmer song song cho một component con ĐÃ CÓ `isSkeleton` riêng** thay vì
   chuyền cờ thẳng xuống. ⚠️ suýt cắn: `SegmentBar` một lần tự bọc `data-anat-part="Legend"`
   quanh `Legend` con thay vì để `Legend` tự badge chính nó — dọn lại đúng "chuyền cờ xuống atom,
   đừng dựng cây song song" (§12g.0 mục 3, ghi trong `steps/13` §2s).
5. **Dựng lại compound `Skeleton.*` dùng chung** (soi gương từng component ở một file riêng,
   sống NGOÀI chủ của hình). ❌ neo trôi có thật: `Skeleton.Accordion` vẽ **dư một ô caret** mà
   `TruthList` thật đã bỏ Indicator — không ai phát hiện vì hình loading sống ngoài chủ. Compound
   này đã XOÁ HẲN 2026-07-25, cấm tái sinh dưới bất kỳ tên nào.
6. **Bịa "hình thẻ giả" cho KHUNG** thay vì giữ khung THẬT. Thầy chốt bằng câu hỏi ngược: *"Card
   đâu có skeleton?"* — container (`rounded-3xl`/`bg-surface`/shadow/separator/gap) giữ nguyên,
   chỉ NODE NỘI DUNG bên trong mới thành gạch.
7. **Sau khi thêm union `isSkeleton`, TypeScript KHÔNG tự narrow biến đã destructure theo nhánh
   `false`** — phải tự thêm fallback (`value ?? default`, `arr ?? []`, `x!`) tại từng chỗ dùng, và
   COMMENT rõ đây là fallback không bao giờ thực sự chạy (union đã đảm bảo), không phải xử lý
   edge-case thật. Bỏ sót bước này là tsc đỏ sau khi thêm cả loạt union (§2r).

9. **Copy y nguyên nhánh `isSkeleton` cũ sang bản gộp, vì "code cũ chắc chạy được".**
   Neo 2026-07-29 (`TrialEnrollBanner`): nhánh cũ CHƯA TỪNG có leaf riêng nên chưa từng render
   thật lần nào. Dựng leaf mới cho nó thì lộ ra lỗi HTML có sẵn: `FeedbackCallout` render
   `title`/`description` trong `<p>` (qua `Alert.Title`/`Alert.Description` của HeroUI), còn
   `Typography isSkeleton` phát ra `<div>` — `<div>` lồng trong `<p>` là HTML không hợp lệ, và
   React báo hydration error THẬT, không phải cảnh báo suông.

   Fix đúng: `FeedbackCallout` không có `isSkeleton` riêng, nhưng atom `Alert` bên dưới nó ĐÃ
   CÓ — gọi thẳng `Alert isSkeleton` (tiền lệ sẵn ở `CourseTeamGate.tsx`). Đúng hình 5 của
   thang §1: chuyền cờ xuống con đã có sẵn, đừng tự dựng cây shimmer song song.

   Bài học chung: **dựng một leaf/state MỚI thường lộ ra bug đã nằm im từ lâu.** Một nhánh chưa
   có leaf là một nhánh chưa ai nhìn thấy, và "nó vẫn ở đó từ trước" không phải bằng chứng nó chạy.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của CHÍNH component đang sửa** (khai "ported from…" trong header) — ĐO nó.
   ⚠️ **Hiện KHÔNG có neo `src` nào cho trục này** — `grep -rl "isSkeleton" src/` ra RỖNG. Mọi
   24 component ở §2r/§2s đều đang ở giai đoạn "STORYBOOK-LOCAL DESIGN SPEC — ported faithfully
   from `@/components/blocks/…`, chưa sync ngược `src`". Khi đồng bộ ngược, `src` chưa có
   `isSkeleton` để tin — dùng bậc 2.
2. **Cây quyết định §2** — nguồn chính hiện tại, vì (1) chưa tồn tại cho trục này.
3. **Component khác đã áp đúng khuôn** (`Typography`/`CoverImage`/`Legend`…) — chỉ là dữ liệu
   tham khảo cách viết union + đặt nhánh, KHÔNG áp máy móc hình của component A sang component B
   chỉ vì "nhìn giống" (đúng luật xuyên trục #2 ở `INDEX.md`).

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Component sở hữu HÌNH thật (không phải slot thuần/re-export) mà THIẾU `isSkeleton` | ⬜ **CHƯA** — gate cần viết: liệt kê `.storybook/components/**` (loại `_legacy`/`frames`), loại file re-export/namespace thuần, báo file còn lại KHÔNG có chuỗi `isSkeleton` trong props (chính là script Node đã chạy thủ công ở `steps/13` §2r — 246 file quét → 24 gap thật — đề xuất bake cố định) |
| 2 | Nhánh `isSkeleton` không đứng TRƯỚC mọi nhánh rẽ hình khác | ⬜ **CHƯA** — gate cần viết: parse từng file, nếu có `if (isSkeleton)` thì mọi `if` khác test một prop hình (`size`/`variant`/`shape`) không được đứng ở dòng NHỎ HƠN nó |
| 3 | Component CÓ HOOK đặt nhánh `isSkeleton` TRƯỚC khi mọi hook đã gọi (vi phạm Rules of Hooks) | ⬜ **CHƯA** — `eslint.config.mjs` dòng 41 đã đăng ký plugin `react-hooks` nhưng CHỈ tắt `exhaustive-deps`, KHÔNG bật `rules-of-hooks` — gate khả thi ngay: bật `"react-hooks/rules-of-hooks": "error"` |
| 4 | Bỏ qua trục hình "biết trước" khi vẽ skeleton (vẽ 1 hình chung cho mọi `size`/`variant`/`collapseFrom`) | ⛔ không gate được — cần hiểu ngữ nghĩa "trục nào caller biết trước", kỷ luật đọc lại §12g.0 mỗi lần thêm skeleton |
| 5 | Tự dựng cây shimmer song song cho component con ĐÃ CÓ `isSkeleton` riêng, thay vì chuyền cờ xuống | ⬜ **CHƯA** — gate cần viết: đối chiếu Deps tab (đã khai import component con) với việc `<HeroSkeleton` xuất hiện NGOÀI lời gọi component con đó, trong cùng nhánh `isSkeleton` |
| 6 | Dựng lại compound `Skeleton.*` dùng chung (soi gương 1-1 từng component, sống ngoài chủ) | ⬜ **CHƯA** — gate cần viết: cấm bất kỳ export dạng `Skeleton.<PascalCase>` ánh xạ tới tên một component khác trong `.storybook/components/**` |
| 7 | Prop nội dung (`text`/`items`/`value`…) hạ xuống OPTIONAL đại trà thay vì ép bằng UNION theo `isSkeleton` (§12b) | ⬜ **CHƯA** — `check-inline-types.mjs` hiện chỉ bắt shape vô danh, không kiểm discriminated union; gate riêng cần viết |
| 8 | Thiếu leaf `Skeleton` riêng trong story (chỉ thêm prop ở component, không thêm leaf, §12g.0a) | ⬜ **CHƯA** — `check-story-coverage.mjs` chỉ kiểm TỒN TẠI file story theo block, không kiểm ĐỦ leaf bên trong |
| 9 | Báo xong khi chưa `tsc --noEmit` sau khi thêm union (bỏ sót narrow-fallback ở nhánh `false`) | ⛔ không gate được trước — chỉ `tsc` bắt được SAU khi đã viết sai; kỷ luật luôn chạy `tsc` ngay sau mỗi union mới |
