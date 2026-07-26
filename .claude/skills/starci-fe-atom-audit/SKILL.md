---
name: starci-fe-atom-audit
description: Audit + dựng lại MỘT atom trong Storybook design-system theo canon tầng ATOM — chốt PROPS → STATES → DEPS trước, render sau. Áp §12g (1 prop = 1 leaf, leaf render đủ mọi state có thể có của prop), §12a/§12b/§12c, §5.0/§5.0a icon, và ba bài học rút từ ca mẫu `Button` (2026-07-26): tách file để deps thành import THẬT · gộp member không phải hình thái riêng · đặt tên prop đối xứng. Dùng khi thầy gõ `/starci-fe-atom-audit <Atom>` (vd `Chip`, `Input`, `Avatar`), "làm atom X giống Button", "audit atom X".
---

# /starci-fe-atom-audit — audit + dựng lại một ATOM

> **Canon SSOT:** `.claude/fe/principles.md` — §12a namespace · §12b cấm children ·
> §12c skeleton co-located · §12d size↔icon · §12f state thuộc về ai · **§12g tầng atom
> = 1 prop 1 leaf** · §5.0 một bộ icon · §5.0a weight theo size.
> **Code:** `D:\Repositories\starci-academy\.storybook` (branch `mtp`).

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

## PANEL ANATOMY — 3 TAB (thầy chốt 2026-07-26)

Mỗi leaf có một panel dưới khung render, chia **ba tab**:

| Tab | Nội dung | Luật |
|---|---|---|
| **States** | bảng PHỦ của prop sở hữu leaf | ⛔ **KHÔNG vẽ lại hình** — khung trên render rồi. Mỗi giá trị một ô: xanh = đã render · **đỏ = union có mà leaf chưa render**. Header ghi `n/N state`. |
| **Deps** | cây phụ thuộc | Chỉ component CÓ story riêng, bấm nhảy được. Rỗng thì nói thẳng "no deps". |
| **Code** | snippet gọi | Đủ mọi giá trị ở tab States, + nút Copy. |

Panel là **công cụ bắt lỗi**, không phải chú thích: ô đỏ chính là thứ đáng lẽ bắt được
`danger` sót khỏi mảng `VARIANTS` trước khi nó mọc thành story lạc chỗ.

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
