# STEP 3 — LEAF + HÌNH (gap · padding · đo DOM)

> Phase 3 của workflow. Gồm **S6 · S7**. `pipeline` theo COMPONENT — không cần chờ nhau,
> component nào xong leaf thì đi tiếp sang hình luôn.
> Luật cần đọc: [`rules/2-leaf-states.md`](../rules/2-leaf-states.md) ·
> [`rules/3-design-tier.md`](../rules/3-design-tier.md).

---

## S6 · LEAF — gộp, tách, đặt tên, `code`

| | |
|---|---|
| **VÀO** | tầng đó đã đúng cấu trúc (Phase 2) |
| **LÀM** | áp phép thử cho **từng prop**: **caller bật ⇒ LEAF · dữ liệu về ⇒ STATE trong cùng leaf**. Gộp leaf trùng · tách leaf thiếu · đặt tên theo TRỤC · **mọi leaf có `code`** |
| **CỔNG ĐO** | `node scripts/check-story-ids.mjs` → live gãy **0** · mọi leaf có `code` · **không** leaf nào tên `Default` mà đang truyền `isSkeleton` |
| **RA** | bộ leaf đúng luật |
| **DỪNG KHI** | phải **gộp/tách FILE** ⇒ hỏi thầy, vì nó **xoá file** (hai file cùng member ⇒ trùng title ⇒ vỡ index) |

### Dấu hiệu leaf sai, nhận ra bằng mắt trong 5 giây

| Dấu hiệu | Kết luận |
|---|---|
| `note` của chính leaf ghi *"SAME composition as the leaf above"* | **state đội áo leaf** ⇒ gộp |
| hai leaf khác nhau đúng một con số / một câu chữ | dữ liệu ⇒ gộp, render 2 hàng trong 1 leaf |
| leaf tên `Default` mà đang bật một prop tuỳ chọn | sai tên, hoặc sai leaf |
| leaf `Items` đứng cạnh `Default` | `items` bắt buộc thì **nó LÀ `Default`** |
| leaf skeleton vẽ **một** hình cho component có `variant` | thiếu rẽ theo trục hình |

Neo thật: `PhaseScarcityNote` 3 leaf → **1** · `TrialConversionStrip` 3 → **2**.

---

## S7 · HÌNH — gap · padding · ĐO DOM

| | |
|---|---|
| **VÀO** | leaf render được |
| **LÀM** | đọc seam theo **QUAN HỆ** (`rules/3` §1), **không** theo tầng. Viết bằng **CHỮ** (`gap="grouped"`), số là compile error (§1.0). Sửa xong **đo `getComputedStyle`**, không đọc mắt |
| **CỔNG ĐO** | `node scripts/check-seams.mjs` → 0 bố cục tay, 0 off-scale, 0 `numeric-seam` · đo DOM: dãy seam phải **kể ra được nhóm**, **không được gần-đều** |
| **RA** | bảng đo `node · seam trước · seam sau · bậc §10b` |
| **DỪNG KHI** | luật cho ra hình mà **mắt thấy sai** ⇒ sửa **CANON**, không chữa riêng call-site (§4a). Trình bày **cả hai số** cho thầy soi |

### Cách đo (không mở mắt đoán)

```js
// trong iframe của story
[...document.querySelectorAll('[data-anat-part]')].map(e => ({
    part: e.getAttribute('data-anat-part'),
    rowGap: getComputedStyle(e).rowGap,
    w: Math.round(e.getBoundingClientRect().width),
}))
```

### Kiểm nhịp

Liệt kê seam theo thứ tự dọc. Dãy **gần như đều nhau** ⇒ gần chắc là sai, vì nhịp phải kể ra được nhóm.

| Nhịp | Đọc ra |
|---|---|
| `24 / 12 / 24 / 24` | 4 dải trôi — caption xa cụm cha đúng bằng khoảng cách tới CTA |
| `24 / 12 / 12 / 24` | 2 nhóm — đúng cấu trúc thật |

Kiểm thêm 3 thứ hay chết im lặng:
1. **prop `gap` có ai nhận không** — `Container.Base` chỉ áp `gap` khi dùng slot `header`/`footer`; truyền `children` thẳng thì **bỏ im lặng** (đo được seam **0px** trong khi code ghi `gap={8}`).
2. **hàng có wrap thường trực không** — đo `cột + gap + nút` so với bề rộng thật. Neo: cần **631px** mà card chỉ **488px** ⇒ CTA **luôn** xuống dòng, `wrap` không phải phòng xa.
3. **sau mỗi lần chuyển `margin` lên `gap`/`padding` phải chạy LẠI cả `check-seams` và `check-padding`.** Sửa một cổng có thể làm đỏ cổng kia: dồn margin của con vào `gap` của parent có thể sinh `numeric-seam`/off-scale mới ở `check-seams`, còn dồn vào `padding` của container có thể lộ margin thừa ở một call-site khác mà `check-padding` chưa từng bắt được vì lúc đó nó còn nằm ở con. Chỉ chạy một cổng rồi báo xong là báo XANH GIẢ.

---

## Ra khỏi Phase 3 khi

- [ ] `check-story-ids` live gãy 0
- [ ] mọi leaf có `code`
- [ ] `check-seams` 0 bố cục tay · 0 off-scale mới
- [ ] có bảng đo DOM trước/sau, và nhịp không gần-đều
- [ ] mọi prop `gap`/`padding` đều có người nhận
- [ ] mọi lần chuyển `margin` lên `gap`/`padding` đã chạy LẠI cả `check-seams` VÀ `check-padding`, không chỉ cổng vừa sửa

---

## S6b · Di trú leaf sang `states[]` (thầy chốt 2026-07-27)

| | |
|---|---|
| **VÀO** | leaf đã đúng bộ leaf (S6) |
| **LÀM** | mỗi state trong `children` tách thành một phần tử `states[]` với `name` (điều kiện dữ liệu) · `why` (2 câu văn xuôi) · `code` (snippet riêng). Bất biến của cả leaf dồn vào `reason`. Bề ngang chủ thể đi qua `renderClassName`, KHÔNG bọc `BlockAnatomy` trong `div.max-w-*` |
| **CỔNG ĐO** | mở story, đếm tab state khớp số state trong source · bấm state render rỗng thì mục `structure of this state` (đổi tên từ `deps of this state`, xem `rules/1-decompose.md` §4) phải **biến mất** · nhãn phải là `why this state`, không phải `note (whole leaf)` |
| **RA** | leaf mà LLM đọc được: đủ điều kiện, đủ cây, đủ giọng, đủ vạch cấm |
| **DỪNG KHI** | không suy ra được **điều kiện dữ liệu** của một state (tức không biết vì sao nó tồn tại) ⇒ hỏi thầy, đừng đặt nhãn cảm tính cho xong |

Luật viết đầy đủ ở [`rules/2-leaf-states.md`](../rules/2-leaf-states.md) §8 và
[`rules/4-organization.md`](../rules/4-organization.md) §4a (văn xuôi, không `—` `↔` `->`).

### Hai lỗi đo được của chính panel, kiểm luôn khi di trú

1. **Panel phải TỰ ĐO bề ngang.** `@app-md:` đo `@container` gần nhất; thiếu `@container` trên panel
   thì nó đo CANVAS và bung 2 cột dù panel chỉ rộng 576px. Kiểm: bóp viewport về 700px, grid phải
   về **một cột**.
2. **Panel không được bó theo khổ render.** Đo được sau khi sửa: panel 1201px trong khi render giữ
   576px, `Copy` nằm trọn trong panel. Trước đó cả hai đều 576px nên `Copy` bị cắt chữ.
