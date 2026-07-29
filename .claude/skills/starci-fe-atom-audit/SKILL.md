---
name: starci-fe-atom-audit
description: Audit + dựng lại MỘT atom trong Storybook design-system theo canon tầng ATOM — chốt PROPS → STATES → DEPS trước, render sau. Áp §12g (1 prop = 1 leaf, leaf render đủ mọi state có thể có của prop), §12a/§12b/§12c, §5.0/§5.0a icon, và ba bài học rút từ ca mẫu `Button` (2026-07-26): tách file để deps thành import THẬT · gộp member không phải hình thái riêng · đặt tên prop đối xứng. Dùng khi thầy gõ `/starci-fe-atom-audit <Atom>` (vd `Chip`, `Input`, `Avatar`), "làm atom X giống Button", "audit atom X".
---

# /starci-fe-atom-audit — audit + dựng lại một ATOM

> **Canon SSOT:** `.claude/fe/principles/naming/context.md` §12a namespace ·
> `.claude/fe/rules/3-shape-tier.md` §12b cấm children ·
> `.claude/fe/principles/skeleton/context.md` §12c skeleton co-located ·
> `.claude/fe/rules/3-shape-tier.md` §12d size↔icon · `.claude/fe/rules/2-leaf-states.md`
> §12f state thuộc về ai · `.claude/fe/rules/2-leaf-states.md` **§4 tầng atom
> = 1 prop 1 leaf** · `.claude/fe/principles/skeleton/context.md` §2 hình shimmer nào ·
> `.claude/fe/principles/icon/context.md` §5.0 một bộ icon · §5.0a weight theo size.
> **Code:** `C:\Repositories\starci-academy\.storybook` (branch `mtp`).

## ⛔ Luật cứng của lane

- **KHÔNG render/sửa story TRƯỚC khi chốt bảng PROPS · STATES · DEPS.** Đây là thứ thầy
  chốt 2026-07-26: xác định trước, render sau. Dựng trước rồi mới nghĩ là ra story lặp,
  leaf thiếu giá trị, deps rỗng.
- **KHÔNG chạy `git`** (checkout/reset/stash) trong bất kỳ agent nào.
- **Một file = một agent.** Không bao giờ hai agent ghi cùng file.
- Chỉ **một** agent được chạy `tsc`/`eslint` (phase verify). Chạy song song là treo máy.
- Comment/JSDoc viết **tiếng Việt**, khớp giọng file xung quanh.

---

## BƯỚC 1 — BẢNG PROPS (read-only)

Đọc file component, liệt kê **mọi prop**, chia hai nhóm:

| Nhóm | Xử lý |
|---|---|
| **CÓ HÌNH** (variant, size, icon, isDisabled, isSkeleton…) | mỗi cái = **một leaf** (§12g) |
| **KHÔNG hình** (onPress, className, showAnatomy, anatPart, key) | KHÔNG có leaf |

**Phép thử "có hình" = ĐỔI PIXEL** (§12g.1, thầy chốt 2026-07-26): đổi giá trị prop này,
màn hình có khác một pixel nào không? Không ⇒ KHÔNG leaf, dù nó là prop thật.
- ❌ prop chỉ chạy vào `aria-*`: `label` (Spinner) · `ariaLabel` · `removeLabel` · `aria-label`
  nút hiện/ẩn mật khẩu. Mở leaf cho chúng thì leaf render ra **hai ô y hệt** — chính là dấu
  hiệu LỖI ATOM mà luật này đang bắt.
- a11y vẫn phải ĐÚNG (§12e), chỉ là kiểm bằng đọc code/eslint, không bằng một leaf.

**Prop nội dung** (§12g.2, thầy chốt 2026-07-26) — chia hai loại:
- `items`/`options` (dữ liệu dựng ra N phần tử con) ⇒ **CÓ leaf, và leaf đó CHÍNH LÀ `Default`**.
  Đừng đẻ thêm leaf `Items`. Neo: `Button.Group` → `Default` ghi *"Prop `items`"*.
- `text`/`amount`/`title` (một chuỗi/số) ⇒ **KHÔNG leaf riêng** — mọi leaf khác đều phải truyền
  nó nên nó không phải một trục. Neo: `Chip.Base` → `Default` ghi *"Bare chip"*.

Với mỗi prop có hình, ghi **ĐỦ TẬP GIÁ TRỊ**:
- union → liệt kê hết. ⚠️ *Thiếu một giá trị là giá trị đó sẽ mọc thành leaf lạc chỗ ở
  nơi khác* (neo: `danger` không có trong mảng `VARIANTS` nên đẻ ra story `Danger` riêng).
- boolean → `true` (mặc định `false` đã nằm ở leaf `Default`).

### Đồng thời soát 3 lỗi khuôn (bài học từ `Button`)

1. **Member GIẢ** — namespace có member mà nó không phải *hình thái* riêng, chỉ là cùng
   component bỏ/thêm một phần ⇒ **gộp bằng prop boolean**.
   Neo: `Button.Icon` → `Button.Base isIconOnly`. Nuôi hai component song song nghĩa là
   mọi luật (variant · size · weight · skeleton) phải sửa hai chỗ.
2. **Tên prop LỆCH CẶP** — có `suffixIcon` mà đầu kia tên `icon` ⇒ đổi thành `prefixIcon`.
   Từ vựng phải khớp `Typography` (§5b).
2b. **COMPONENT ANH EM chỉ khác GIÁ TRỊ PROP** — một component riêng mà thực chất chỉ là
   atom gốc khoá cứng vài prop ⇒ **XOÁ**, dùng thẳng atom gốc.
   Neo 2026-07-26: `StatusChip` = `Chip.Base` khoá `tone` + copy nguyên khối nút ×. Dẹp.
   Ngược lại, component thêm **HÀNH VI** thật (đếm, cắt, tràn, tooltip) thì KHÔNG xoá — nó
   là **cụm**, đưa vào namespace thành `<Atom>.Group`.
   Neo: `TagChips` (cắt tại `maxVisible` + chip `+N` mở tooltip) → `Chip.Group`.
3. **Bảng token bị rơi** — skeleton/spacing dùng giá trị CỨNG cho mọi `size`.
   Neo: `Button` skeleton `w-24` cứng cho cả 3 bậc ⇒ ba ô nhìn y hệt + footprint sai.
   ⚠️ *Nhiều ô nhìn giống nhau = LỖI ATOM, không phải cớ để bớt ô.*

**Ra:** bảng markdown `prop · kiểu · tập giá trị · leaf?` + danh sách lỗi khuôn. **STOP.**

---

## BƯỚC 2 — BẢNG STATES (read-only)

Với **mỗi leaf** ở bước 1, viết ra **mọi state CÓ THỂ QUAN SÁT ĐƯỢC** phải render trong
leaf đó — không chỉ đủ giá trị union, mà đủ **tổ hợp còn nhìn ra khác biệt**:

- leaf `isSkeleton` → skeleton của **đủ mọi `size`** (và đủ mọi hình, vd pill vs vuông)
- leaf `isDisabled` → đủ mọi `variant`
- leaf `icon`/`prefixIcon` → đổi hình (nhiều glyph) **và** đổi size
- leaf `variant` → đủ union

**Test loại bỏ:** hai ô trong cùng leaf ra hình **y hệt** ⇒ hoặc là atom lỗi (sửa atom),
hoặc là tổ hợp vô nghĩa (bỏ ô, ghi lý do vào `note`).
Neo: `Button` leaf `Pending` từng render nút-có-icon cạnh nút-không-icon, mà Spinner THAY
icon nên hai nút giống hệt.

### ⛔ KHÔNG trộn hai prop trong một leaf

Leaf `X` render mọi state **của prop X**, KHÔNG được kéo prop Y vào cho "đủ bộ".

Neo 2026-07-26: leaf `isIconOnly` của `Button.Base` từng render thêm một hàng skeleton
⇒ SAI, `isSkeleton` là prop riêng, có leaf riêng.

Nhưng chiều ngược lại thì ĐÚNG và BẮT BUỘC: leaf `isSkeleton` phải render **đủ mọi HÌNH
mà prop nó sinh ra** — pill (nút có nhãn) *và* vuông (`isIconOnly`). Phân biệt:
- prop nào **SỞ HỮU** leaf → quyết định leaf nằm ở đâu.
- các hình mà prop đó **sinh ra** → phải có mặt đủ trong leaf đó.

**Ra:** mỗi leaf một dòng `leaf · state phải render · vì sao`. **STOP.**

---

## BƯỚC 3 — CÂY DEPS (read-only)

**DEPS = story KHÁC mà component này dựa vào.** Chỉ khai component **CÓ story riêng** —
bấm vào phải nhảy sang được.

- ❌ **KHÔNG phải deps:** span nội bộ (`Label`, `Icon`, `Dot`, `Spinner`, `SuffixIcon`) —
  chúng không có nhà để nhảy tới, khai vào chỉ làm nhiễu cây.
- Atom lá bọc thẳng HeroUI ⇒ **deps RỖNG**, bỏ hẳn prop `parts`.
- Cụm/khối ⇒ khai đúng cái nó **dựng lại**, kèm `storyId`.

### ⭐ Deps phải là `import` THẬT — tách file nếu cần

Nếu member A dựng lại member B mà **cùng file** thì không có dòng `import` nào để lần ra
quan hệ, và cây báo "0 part" dù phụ thuộc có thật. Chuẩn:

```
<Atom>/
  <Atom>Base.tsx      ← component + bảng/type của chính nó
  <Atom>Group.tsx     ← import { <Atom>Base }  ⇒ deps thật
  <Atom>.tsx          ← namespace Object.assign, chỉ gom, không logic
```

Call-site ngoài **không đổi** đường import (vẫn `.../\<Atom>/\<Atom>`).

**File `<atom>-tokens.ts` riêng — CHỈ khi có ≥2 component NGANG HÀNG** (không cái nào dựng
cái nào) cùng cần bảng đó. Ngoài ca đó thì bảng để ngay trong `<Atom>Base.tsx`, cái khác
import từ đấy.
⚠️ Neo 2026-07-26: `button-tokens.ts` sinh ra để `ButtonIcon` khỏi phải import `ButtonBase`
chỉ-để-lấy-bảng (một phụ thuộc GIẢ). Ngay sau đó `ButtonIcon` bị gộp vào `isIconOnly` ⇒ file
token **mất lý do tồn tại**, thành file trung gian thừa. Tách file phải có anh em thật, đừng
tách theo phản xạ.

⚠️ Cây dựng **từ DOM** nên component bọc phải truyền `anatPart` xuống. Hai bẫy:
1. Nhãn phải là tên **NAMESPACE** (`"Button.Base"`), KHÔNG phải tên file (`"ButtonBase"`) —
   người đọc tra theo tên story. Áp cho cả trường `role`, vì `role` cũng hiện trên UI.
2. Story ở state **skeleton** cũng phải bật `showAnatomy` — quên là cây báo "0 part" và
   nhìn như cụm tự vẽ shimmer, sai hẳn nguồn.

**Ra:** danh sách deps (tên + storyId) hoặc "RỖNG" + kế hoạch tách file. **STOP chờ duyệt.**

---

## BƯỚC 4 — DỰNG (chỉ khi thầy duyệt 3 bảng trên)

Chạy **Workflow**, chia việc **theo FILE**:

1. **Phase sửa component** — tách file · gộp member giả · đổi tên prop · thêm bảng token
   thiếu. Mỗi file một agent.
2. **Phase codemod call-site** — đổi tên prop/member ở nơi khác.
   ⚠️ **Regex theo tên prop KHÔNG an toàn**: nhiều component dùng chung tên prop
   (`icon:` có ở `Tabs`/`Menu`/`SurfaceCard`). Phải **giới hạn phạm vi theo thẻ JSX của
   chính atom đó**, và sau khi chạy phải soát lại file nào bị đá nhầm.
   Viết codemod ra **FILE script**, đừng chạy `node -e` inline (Bash nuốt escape).
3. **Phase story** — mỗi leaf đúng một export, theo bảng bước 1+2.
4. **Phase verify** — MỘT agent chạy `tsc` + `eslint`, sửa tới xanh.

Sau đó **restart Storybook** (watcher Windows kẹt khi thêm/xoá/đổi tên story):
`preview_stop` → `preview_start` → đọc `index.json` xác nhận đúng bộ leaf.
⛔ Đừng lái Storybook qua Browser pane để soi mắt — chậm/treo, để thầy tự xem.

---

---

## PANEL ANATOMY — 2 TAB (thầy chốt 2026-07-26, RÚT GỌN cùng ngày sau khi soi thật)

Mỗi leaf có một panel dưới khung render, chia **hai tab**:

| Tab | Nội dung | Luật |
|---|---|---|
| **Deps** | cây phụ thuộc | Chỉ component **CÓ `storyId` thật** — bấm nhảy được. Entry không `storyId` KHÔNG được tính là dep (không vào cây). Rỗng ⇒ **tab không mọc ra** (không còn dòng "no deps"). |
| **Code** | snippet gọi | Snippet đủ mọi giá trị đang được leaf này minh hoạ, + nút Copy. |

⚠️ **Tab States đã BỎ** (thầy chốt 2026-07-26, lần 2 — qua soi thật trên Storybook: nó chỉ
lặp lại bằng CHỮ đúng thứ khung render bên trên đã hiện bằng HÌNH, một tab riêng cho việc
đó là dư). Prop `states`/type `AnatomyStateCell` đã xoá khỏi `BlockAnatomy` — ĐỪNG viết lại.
Kỷ luật "render ĐỦ mọi giá trị của prop, đừng để giá trị nào rớt ra ngoài" (§12g) **vẫn còn
nguyên** — chỉ là không còn ô đỏ tự động nhắc nữa, tác giả story phải tự đối chiếu union khi
viết leaf.

Deps giờ NGHIÊM khắc hơn: một entry `annotate`/`parts` thiếu `storyId` (không bấm đi đâu
được) sẽ bị BlockAnatomy tự lọc bỏ, không hiện trong cây — nên tác giả không cần tự nhớ
"chỉ khai component có story riêng", component tự gạt phần khai sai. Atom lá bọc thẳng
HeroUI mà lỡ tự khai một part TRỎ VÀO CHÍNH NÓ (neo: `Spinner.Base` bản cũ khai part
"Spinner" không `storyId`, dùng `parts` deprecated) coi như KHÔNG có deps — đúng bản chất.

### ✍️ NGÔN NGỮ — chữ trên panel viết **TIẾNG ANH**

Thầy chốt 2026-07-26: chữ máy-móc nửa Việt nửa thuật-ngữ đọc rất khó. Từ nay:
- **UI của panel** (nhãn tab, tên state, `role`, `note`, `reason`) → **English**, câu ngắn,
  giọng người. Không nhồi số hiệu canon vào chữ hiện ra màn hình.
- **JSDoc/comment trong code** → vẫn **tiếng Việt**, và ở đó mới ghi neo §.
- Đừng viết kiểu liệt kê máy ("render ĐỦ union, thiếu một giá trị là…"); viết như nói với
  đồng nghiệp ("Missing values show up red — they'll grow into a stray story elsewhere").

## Ra cuối lượt

Báo: bộ leaf mới (từ N → M) · deps · lỗi atom đã sửa · `tsc`/`eslint` · điều gì **cố ý
không làm** và vì sao. Luật mới phát sinh → **đề xuất** ghi canon, không tự ghi.
