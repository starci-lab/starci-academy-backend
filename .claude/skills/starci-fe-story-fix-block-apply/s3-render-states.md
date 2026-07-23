# S3 — Render states = cây `variant / scenario / state`

Mỗi state = **1 LEAF riêng** (KHÔNG stack + `<Label>` trên 1 canvas). Cây 3 tầng:

- **`variant`** = hình thái do PROP lái (`item`/`hero`) → nest `Block/<cat>/<Component>/<Variant>`.
- **`scenario` = SHAPE** = khác ở COMPOSITION (part NÀO render, vd có/không `ProgressMeter`) → **anatomy khác nhau**. ⭐ Tách scenario theo **SHAPE, KHÔNG theo tone**. Nest `<Scenario>` **CHỈ khi ≥2 shape**; 1 shape → states phẳng dưới variant (vd `Item`). Title `.../<Variant>/<Scenario>`, **1 file = 1 scenario**.
- **`state`** = cùng shape, khác data/tone/lifecycle (`không gấp`/`gấp` = TONE; `loading`/`error` = lifecycle). urgent = STATE trong shape, KHÔNG phải scenario.

**Render mỗi leaf:**
- 1 `export const` + `name:` = nhãn (tên leaf CHÍNH LÀ nhãn, KHÔNG `<Label>` inline). 1 state = 1 canvas `layout:"fullscreen"`.
- **Mỗi leaf bọc render trong `BlockAnatomy` RIÊNG:** `frame(<BlockAnatomy name tier leaf parts={<LEAF>_PARTS} note|reason>{render}</BlockAnatomy>)`. **KHÔNG** story `Anatomy` gom, **KHÔNG** `blockShell` (đã bỏ). `frame = (n) => <div className="mx-auto max-w-4xl p-8">{n}</div>`.

**⭐ Anatomy = ĐÚNG cây DOM THẬT (U1):** `parts` mỗi leaf PHẢN ÁNH ĐÚNG cây DOM/JSX leaf đó render — **MỌI primitive/sub-block render thật đều có mặt**, kể cả part **cấu trúc** (`AsyncContent`, wrapper); **nesting khớp DOM** (`children` cho part con); thứ tự top-to-bottom. Đối chiếu JSX THẬT: **không sót, không dư, không curate**. **Dùng primitive THẬT** (import), CẤM stub inline (vd `AsyncContent` thật, không tự viết fragment). Leaf khác composition → `parts` riêng; leaf cùng composition share 1 hằng `*_PARTS`. Part gắn `tier` (`block`/`design`/`primitive`); cụm ≥2 element ĐỒNG VAI = **1 GROUP** (`ButtonGroup · nút chính + phụ`, KHÔNG `Button ×2`). Badge = panel ĐO `data-anat-part` (element thật / marker `AnatomyOverlay` khi `showAnatomy`) → **pill KHÔNG đè nội dung**; `name` phải KHỚP tag part thật; hover = tụ sáng.

**⭐ Skeleton/Error = 1 per SCENARIO, MIRROR đúng shape** (No-progress skeleton KHÔNG thanh; Progress CÓ thanh). Lặp theo scenario là ĐÚNG; KHÔNG nhân theo tone; KHÔNG accent-sweep.

**State CÓ THẬT** (theo consumer/loader) — đừng bịa; empty CHỈ khi consumer có nhánh empty.

**⭐ Nhiều state → 1 BASE + spread delta:** `<scenario>Base` (props chung), mỗi leaf `{ ...base, <delta nhỏ> }` để lộ rõ cái GÌ đổi. Data-heavy → `.mocks.ts`.
