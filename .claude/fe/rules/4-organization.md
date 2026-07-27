# TƯ DUY 4 — TỔ CHỨC: cây · tên · file · comment · props · dao gác

> Một trong 4 file tư duy. File này trả lời: **code nằm ở đâu, gọi tên thế nào, viết ra sao,
> và cái gì canh cho nó không trôi.**
> Ba file kia nói *nghĩ gì*; file này nói *đặt ở đâu cho người sau tìm được*.

---

## 1. HAI CÂY SOI GƯƠNG

```
.storybook/
  components/<tier>/<họ>/<Component>/<Component>.tsx        ← 103 file / 90 thư mục
  stories/<tier>/<họ>/<Component>/<Component>.<Member>.stories.tsx   ← 145 file / 91 thư mục
  utils/BlockAnatomy · AnatomyOverlay                        ← đồ nghề
  scripts/ (ở gốc repo)                                      ← dao gác
```

| Luật | Đo được |
|---|---|
| `tier` ∈ `atoms · frames · composites · designs · blocks · screens` | tách `layouts` 2026-07-27: 7 khung slot-trơ vs 37 component sở hữu nội dung |
| họ = **số NHIỀU** cho loại phần tử (`chips`, `cards`, `lists`), danh từ miền giữ nguyên (`learn`, `commerce`) | |
| **1 file impl = 1 NAMESPACE** (cả `.Base`, `.Group`… trong một file) | 1.14 file/thư mục |
| **1 file story = 1 MEMBER** (mỗi member một file) | 1.59 file/thư mục |
| **KHÔNG có `index.ts` barrel** — import thẳng file qua alias | 0 file |
| alias: `@sb-components/*` · `@sb-utils/*` | 682 · 200 lượt |

Ba chỗ cây từng nói dối về tầng đã sửa cùng lượt tách (2026-07-27): 5 story `Feedback.*`/`Form.*` nằm trong `stories/atoms/` mà title ghi `Layouts/...` nay về `composites/` khớp impl. Khung không còn nấc họ: `frames/Container`, không phải `frames/layout/Container`.

---

## 2. TÊN STORY — `Tier/Family/Component/Component.Member`

Component là **THƯ MỤC**, member là **node lá** (thầy chốt 2026-07-27):

```
Atoms/Chips/Chip/Chip.Base
Composites/Cards/SurfaceCard/SurfaceCard.List
Frames/Stack/Stack.V
Designs/Commerce/PhaseScarcityNote/PhaseScarcityNote.Base
Blocks/Learn/KeepGoingPath/KeepGoingPath.Base
Screens/CourseContents/Desktop/Paid
```

Trước khi chốt, `blocks`/`designs` chỉ có **3 nấc** (`Blocks/Learn/CourseBrief.Base`) trong khi `atoms`/`layouts` đã 4 nấc — đọc sidebar thấy hai kiểu cây trong cùng một Storybook. Đã sửa 9 file.

**Còn 3 chỗ cần gộp/tách FILE nên chờ chốt:**
- `Designs/Commerce/PriceTag` — một file đang tài liệu **cả hai** member (`.Prominent` + `.Inline`) ⇒ muốn đúng dạng phải tách 2 file.
- `Designs/Cards/ContinueCard/Hero/Progress` + `Hero/No progress` — hai **FILE** cùng member ⇒ đổi cả hai thành `ContinueCard.Hero` là **trùng title, vỡ index** ⇒ phải gộp 1 file 2 leaf.
- `No progress` → `NoProgress` (tên hiển thị: Title Case, không dấu cách, không prose).

**`storybook-naming.md` đã lạc hậu hoàn toàn:** nó ghi tier-1 là `Primitives · Design · Block · Layouts · Overlays` — một cây không còn tồn tại — và chưa có luật `Component/Component.Member`. Phải bake lại cùng lúc với §14d.2/§14g.

---

## 3. CÁCH VIẾT MỘT FILE COMPONENT — khuôn 7 phần

Neo: `Container.tsx` (file mới nhất, sạch nhất).

```
1. import        type-only react → @heroui/react → @sb-*
2. header JSDoc  kẻ ngang · TẦNG + WHY tồn tại + neo § + SỐ ĐO
3. union export  export type ContainerSize = "sm" | "md" | ...
4. class map     const SIZE_CLASS: Record<ContainerSize, string>   (21 file dùng khuôn này)
5. props         export interface XProps — MỖI prop một JSDoc, ghi cả default
6. component     const X = ({ size = "md", ... }: XProps) => ...
7. export        export { X, XGroup }      ← KHÔNG namespace (§3b)
```

| Luật | Trạng thái đo được |
|---|---|
| **mọi component**: `const X = ({ ... }: XProps) => {}` với type **đặt tên** `<Component>Props` | 6 chỗ sai (4 chỗ viết `Omit<>`/`Pick<>` thẳng ở chữ ký, 1 không props, 1 là `_probe.tsx`) |
| `type XProps = A & B` (**hợp thành**, để union loại trừ nhau) là **hợp lệ** | `ChipBaseProps` dùng union cho icon/dot loại trừ — ép `interface` là **phá** cơ chế |
| **cấm type object lồng inline** — xem §3a | **73 chỗ / 44 file** (41 tham số hàm · 30 generic · 2 prop) |
| `React.FC` / `forwardRef` | 0 / 0 — sạch |
| **KHÔNG namespace** (§3b) | ✅ 0 — 65 namespace / 111 member đã phẳng 2026-07-28, cổng `check-no-namespace` canh |
| `_probe.tsx` — file thử gọi-trần **đã bị commit** | ✅ đã xoá |

---

## 3b. KHÔNG NAMESPACE — component gọi bằng TÊN của nó

> **P0 · `X.Base` → `X` · `X.Member` → `XMember`. Không `Object.assign`, không
> `export const X = { … }`.** Thầy chốt 2026-07-28. Cổng: `check-no-namespace.mjs`.

**Vì sao.** Dấu chấm đọc như một BIẾN THỂ và thực ra là một THƯ MỤC. Đo trước khi xoá: chỉ
**1/10** namespace có các member dùng chung chữ ký prop (`ContinueCard`); chín cái còn lại gom
những component API khác hẳn nhau dưới một cái tên. Nó còn làm bảng anatomy nhập nhằng —
`Avatar.Base` (của ta) và `Avatar` (HeroUI) là hai node mà tên chỉ hơn nhau một hậu tố.

**Ngoại lệ có thật:** khi các member **chỉ dùng cùng nhau** (`Dialog.Root` vô nghĩa nếu không
có `.Trigger`) thì namespace hợp lý — đó là lý do Radix giữ, MUI và shadcn bỏ. Hệ này không
rơi vào ca đó: `ButtonGroup` dùng độc lập với `Button`.

### Bốn cái bẫy — mỗi cái đã suýt làm hỏng một lần

| Bẫy | Triệu chứng | Cách canh |
|---|---|---|
| **CRLF** | regex viết theo `\n` khớp **không gì** mà vẫn báo thành công (kiểm kê ra 66 thay vì 111) | làm việc theo DÒNG, không theo `\n` |
| **compound của vendor** | `Tabs.Base` của ta, `Tabs.Tab` của HeroUI — cùng repo, đôi khi **cùng file** | khớp theo **CẶP**, không theo tiền tố; 0 cặp thuộc cả hai |
| **alias nội bộ** | `Typography as TypographyAtom` — đổi theo tên chính tắc là bỏ sót | đọc import của TỪNG file |
| **tên phẳng đâm nhau** | đổi vào tên đã bị chiếm ⇒ **âm thầm** trỏ sang component khác, chỉ lộ khi kiểu prop tình cờ lệch | giữ alias, và coi mỗi lần đụng là **một trùng lặp cần dọn** |

Bẫy thứ tư là thứ có giá trị nhất: 14 chỗ phải giữ alias chính là danh sách component trùng
(`Progress.Meter` vs composite `ProgressMeter`, `Button.Group` vs composite `ButtonGroup`).
**Làm phẳng tên là cách rẻ nhất để lộ trùng lặp** — dấu chấm che chúng đi.

### Đổi tên KHÔNG được đổi ngữ nghĩa

`PriceTag.Prominent`/`.Inline` chỉ set `emphasis`, trông rất giống một prop bị bọc lại. Nhưng
doc của chính nó viện §14d.1: `emphasis` **cố ý không phơi ra**, người gọi chọn COMPONENT chứ
không chọn cỡ. Nên nó tách thành hai anh em ngang hàng, không gộp về prop.

> Bỏ namespace là đổi CÁCH GỌI. Nếu một bước "tinh gọn" nhân tiện lật một ruling đã có, đó là
> hai thay đổi bị trộn làm một.

---

## 3a. TYPESAFE ĐÀNG HOÀNG — mọi hình dữ liệu phải CÓ TÊN

> **P0 · Không khai type object inline. Mọi hình dữ liệu là một `interface` CÓ TÊN, EXPORT, có JSDoc.**
> Thầy chốt 2026-07-27, neo: `module: { index: number; name: string }` → `ModuleLike`.

**Vì sao không phải chuyện thẩm mỹ:** hình inline **không có tên để import**. Caller muốn dựng đúng object đó thì không có gì mà `: type` vào, nên mỗi call-site **tự mô tả lại bằng tay** — và hai chỗ mô tả tay sẽ lệch nhau. Tên là chỗ duy nhất giữ chúng khớp.

### P1 · Ba VỊ TRÍ đều tính, không chỉ prop

| Vị trí | Sai | Đúng |
|---|---|---|
| **prop** trong `interface` | `module: { index: number; name: string }` | `module: ModuleLike` |
| **generic** | `Record<AvatarSize, { box: string; dot: string }>` | `Record<AvatarSize, AvatarSizeStyle>` |
| **tham số hàm** | `({ className }: { className?: string })` | `({ className }: FieldSkeletonProps)` |

Đo được: **73 chỗ / 44 file** — 41 tham số hàm · 30 generic · 2 prop. Vị trí đông nhất là **tham số hàm** của helper cục bộ, tức chỗ ít ai để ý nhất.

### P2 · Đặt tên theo VAI, không theo chỗ dùng

| Đuôi | Dùng khi | Neo |
|---|---|---|
| `XProps` | props của một component | `ContainerBaseProps` |
| `XLike` | một **thực thể miền** truyền vào (hình "trông giống X") | `ModuleLike` |
| `XItem` | một phần tử của danh sách `items` | `SurfaceCardListItem` · `KeepGoingContent` |
| `XStyle` / `XConfig` | giá trị của bảng tra `Record<Enum, …>` | `AvatarSizeStyle` |

### P3 · CÁI ĐƯỢC PHÉP — để khỏi sửa oan

- **`type XProps = A & B` (hợp thành) là HỢP LỆ**, đừng đòi đổi sang `interface`. Neo: `ChipBaseProps = ChipBaseOwnProps & ChipLeadingProps`, trong đó phần sau là **union loại trừ** để `icon` và `dot` không thể cùng có. `interface` **không diễn tả nổi** điều đó ⇒ ép đổi là **giảm** typesafe. Cùng dạng: `TypographyProps`, `ContinueCardHeroProps`.
- **`type X = { … }` object literal trần** thì nên đổi thành `interface` (không mất gì).
- **Giá trị** trong const map (`sm: { box: "size-8" }`) **không phải type** ⇒ không thuộc luật này. Đây là chỗ bộ đếm đầu của con phồng 154 vì đếm giá trị thành type.

### P4 · Dao kiểm

```bash
node scripts/check-inline-types.mjs
```

Nó phân biệt **vị trí TYPE** với **vị trí GIÁ TRỊ** (theo dõi đang ở trong `interface`/`type` hay trong `const … = {`), nên không báo oan const map.

### P5 · Chưa chốt — xem C12/C13

- có áp cho **story fixture** (`const TONES: Array<{ tone; hint }>`) hay chỉ `components/`?
- có áp cho **helper cục bộ không export** không? (agent bắt thêm 22 chỗ dạng `({ className }: { className?: string })`)

---

## 4. COMMENT — sổ ghi quyết định, không phải chú thích code

| Đo | Số |
|---|---|
| dòng code / dòng comment | 30 003 / **11 111** → **27%** |
| khối JSDoc | 2 758 |
| neo § (`§12g`…) | 773 |
| comment có NGÀY quyết định | 327 |

Mỗi chỗ khó ghi đủ 4 thứ: **(a)** WHY tồn tại · **(b)** trước đây **sai thế nào** · **(c)** SỐ ĐO chứng minh · **(d)** neo § + ngày chốt. Đây là tài sản, giữ.

| Luật | Trạng thái |
|---|---|
| **TIẾNG ANH hết** (thầy chốt 2026-07-27) | 1 897 dòng tiếng Việt / 124 file — đo được 77% đã là tiếng Anh, luật cũ ghi "JSDoc tiếng Việt" là **sai thực tế** |
| **KHÔNG marker** (`⭐ ⚠️ ⛔ ✅ ❌ 📛`) — bỏ DẤU nhưng giữ Ý bằng chữ | 305 dòng / 140 file |
| Ký hiệu kỹ thuật GIỮ: `§` · `·` · `—` · `─` · bảng markdown | |

**Bẫy đã cắn thật:** một lượt dọn emoji trước đây **xoá dấu kèm luôn danh từ**, để lại câu khoét lỗ — `"): rather than a bare triangle — the two siblings /"` — và **đã ship trong commit**. Vì vậy: bỏ marker = **VIẾT LẠI CÂU**, không phải xoá ký tự.

**Giá phải trả đang trả:** `SurfaceCard.tsx` **2 063 dòng** (file thứ hai chỉ 691). Sổ quyết định phình cùng file tới mức không đọc hết được ⇒ đề xuất: file >800 dòng thì header giữ ~30 dòng luật hiện hành, phần sử dời sang `<Component>.decisions.md` cạnh file.

---

## 5. STYLE cơ học — đã nhất quán, chỉ cần giữ

| Luật | Đo |
|---|---|
| **không dấu `;`** | 4 / 30 003 dòng |
| **nháy đôi** | 1005 / 1005 import |
| **thụt 4 space** | `eslint.config.mjs` `indent: ["error", 4]` |
| `"use client"` chỉ nơi có hook | 14 file |
| named export; `export default` chỉ cho `meta` của story | 146 = số file story |

---

## 6. DAO GÁC — cái gì canh cái gì

| Dao | Canh | Sức |
|---|---|---|
| `npx tsc --noEmit` | kiểu · **off-scale `gap`/`padding`** tại call-site | chặn |
| `npx eslint .storybook` | quotes · unused · indent · 5 rule `starci-fe/*` | chặn |
| `node scripts/check-story-ids.mjs` | `storyId` trỏ story **có thật** | chặn (đã cắm `pre-commit`) |
| `node scripts/check-seams.mjs` | bố cục viết tay · 2-chủ-1-seam · off-scale | chặn |
| `node scripts/check-story-coverage.mjs` | block có story chưa | chặn |
| `curl :6006/index.json` | id **live** khớp id tĩnh | đối chiếu |

**Ba bài học về chính dao gác — quan trọng hơn danh sách trên:**

1. **Lệnh verify trong doc có thể quét RỖNG.** `npx eslint ".storybook/**/*.{ts,tsx}"` (đúng lệnh `continue.md` ghi) **exit 0, không in gì** — glob không khớp file nào dưới flat-config. Quét thật `npx eslint .storybook` ra **11 error + 31 warning**. Mọi câu "eslint xanh" trước đó là **xanh rỗng**.
2. **Gate phải có NEGATIVE CONTROL.** `check-story-ids` lần đầu báo "sạch" trong khi **mù 10 storyId** nằm ở `_shared.tsx` — chỉ lộ ra khi nhét một id giả vào và thấy nó **vẫn xanh**.
3. **Đếm số khớp không có nghĩa là TẬP khớp.** Scanner từng ra đúng 1362 = 1362 so với `index.json` mà **sai 233 id** (docs là `--overview`, scanner sinh `--docs`). Chỉ `comm` hai tập mới lộ.

**Ngưỡng tỉnh táo cho mọi bộ đếm mới** (đã sập 5 lần trong một phiên): marker 8188→305 (dải unicode thiếu `\u{...}` nên khớp cả ASCII) · props 49→6 (bắt phải phép đổi tên trong destructure) · inline-type 154→73 (đếm giá trị const map thành type) · câu-bị-khoét 993→2 (`*/` bị tính là câu) · leaf-thiếu-code 663→156 (`$` trong cờ `m` khớp cuối mỗi dòng). ⇒ **số nào trông quá lớn so với tổng thì kiểm chéo 1 file bằng tay trước khi tin.**

---

## 7. Chờ thầy chốt

- ~~**C11** — 22 file namespace kiểu `export const X = { Base }` sửa sang `Object.assign` hay đổi §12a?~~
  **ĐÃ TRẢ LỜI 2026-07-28: cả hai đường đều bỏ.** Câu hỏi giả định phải chọn MỘT dạng
  namespace, trong khi câu trả lời là không dùng namespace nữa (§3b). Con số "22 file" cũng
  sai: bộ quét sinh ra nó viết theo `\n` trong repo CRLF nên bỏ sót một nửa — thực tế
  **65 namespace / 111 member**.
- **C12** — luật `XLike` áp cả **story fixture** (`const TONES: Array<{ tone; hint }>`) hay chỉ `components/`? Nếu cả story thì thêm ~17 mảng cần đặt tên.
- **C13** — helper cục bộ trong file (không export) có phải theo luật `XProps` không? Agent bắt thêm **22 chỗ** dạng `({ className }: { className?: string })`.
- **C14** — file >800 dòng tách sổ quyết định ra `.decisions.md`?
- **C15** — 11 error eslint thật: sửa hết trong lượt tới, hay chỉ phần trong closure đang làm rồi ghi nợ?

---

## 4b. TÊN NHÓM phải PHÂN BIỆT được — cấm gọi theo cơ chế (thầy chốt 2026-07-28)

> **Một cái tên chỉ đáng tồn tại khi nó LOẠI TRỪ được thứ khác.** Tên gọi theo cơ chế mà mọi
> component đều có thì nó không phân biệt gì cả.

Neo: `composites/rendering/` → **`composites/viewers/`**. `rendering` sai vì **mọi** component
đều render — nó gọi tên CƠ CHẾ, không gọi tên TRÁCH NHIỆM. Cùng cái bẫy với
`rules/3-design-tier.md`: đặt tên theo một tầng, tầng chết thì tên thành rác.

**Phép thử của `viewers`, và nó sắc:**

| | |
|---|---|
| mọi composite khác | **biết trước hình của mình** — thẻ có nhãn + hàng, header có tiêu đề + meta |
| viewer | **không đoán được hình của chính nó** — hình do PAYLOAD quyết định, không do prop |

Viewer nhận một thứ **soạn ở nơi khác** (chuỗi markdown, định nghĩa flow, file PDF, payload
graph) rồi vẽ lại trung thực **mà không hiểu nội dung**. Thành viên: `MarkdownContent` ·
`RichText` · `FlowDiagram` · `PDFView` · `RagSourceGraph`.

**Cách kiểm một tên nhóm trước khi đặt:** viết ra thứ nó LOẠI TRỪ. Không viết ra được thì cái
tên đang mô tả cơ chế hoặc vị trí, không mô tả trách nhiệm.

- ❌ `rendering` `helpers` `common` `shared` `misc` — không loại trừ gì
- ❌ `CourseContentsPageHeader` — gọi theo VỊ TRÍ, khoá vào một màn (§neo `CourseBrief`)
- ✅ `viewers` (hình do payload quyết) · `frames` (không biết nội dung) · `stats` (đo lường)

⚠️ Đổi tên nhóm là đổi `storyId` cho cả nhóm. Đo blast radius bằng **import**, không bằng grep
tên (§3b bẫy 4) — lượt này đo ra đúng **3 import**, nên rẻ, làm ngay trước khi nhóm đông thêm.

---

## 4a. VĂN XUÔI — chữ hiện ra màn hình viết thành CÂU (thầy chốt 2026-07-27)

Áp cho mọi chuỗi panel đọc được: `why` · `reason` · `role` của node · `leaf`.

| ⛔ Không dùng | ✅ Viết thành câu |
|---|---|
`—` làm dấu nối | `lead row, an icon beside a text cluster, centred` |
`↔` · `->` · `=>` | `the icon sits beside the text` · `becomes` · `so` |
`·` để nối ý (vẫn dùng được để ngăn hạng mục ngắn) | dùng dấu phẩy hoặc `and` |

Neo thật thầy bắt: `role` của node ghi `lead row — icon ↔ text cluster, center-aligned`. Đọc ra là
ký hiệu, không phải câu; và khi nhồi vào cột hẹp thì gãy dòng thành vô nghĩa. Viết lại:
`lead row where the icon sits beside the text cluster, both centred on the same line`.

Ba lý do, không phải khẩu vị:
1. **Panel là chỗ CHỮ SỐNG** — cột hẹp, xuống dòng bất kỳ đâu; ký hiệu bị tách khỏi hai đầu của nó
   thì mất nghĩa, còn câu thì vẫn đọc được.
2. **Người đọc cuối là LLM dựng UI.** Câu có chủ ngữ/động từ thì hiểu được; `A ↔ B` thì phải đoán
   quan hệ, và đoán là chỗ nó bịa.
3. Ký hiệu **không dịch được**: `↔` mỗi người đọc một nghĩa (đối xứng, chuyển đổi, cạnh nhau).

Ngoại lệ: bảng markdown trong JSDoc, neo `§`, và mũi tên trong sơ đồ cây (`→ Page.Header`) vẫn giữ,
vì ở đó chúng là **cấu trúc** chứ không phải câu.
