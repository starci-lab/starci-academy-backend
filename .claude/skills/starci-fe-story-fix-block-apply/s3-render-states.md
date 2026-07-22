# S3 — Render states = cây `variant / scenario / state`

Mỗi state = **1 LEAF riêng** (KHÔNG stack + `<Label>` trên 1 canvas). Cây 3 tầng:

- **`variant`** = hình thái do PROP lái (`item`/`hero`) → nest `Block/<cat>/<Component>/<Variant>`.
- **`scenario` = SHAPE** = khác ở COMPOSITION (part NÀO render, vd có/không `ProgressMeter`) → **anatomy khác nhau**. ⭐ Tách scenario theo **SHAPE, KHÔNG theo tone**. Nest `<Scenario>` **CHỈ khi ≥2 shape**; 1 shape → states phẳng dưới variant (vd `Item`). Title `.../<Variant>/<Scenario>`, **1 file = 1 scenario**.
- **`state`** = cùng shape, khác data/tone/lifecycle (`không gấp`/`gấp` = TONE; `loading`/`error` = lifecycle). urgent = STATE trong shape, KHÔNG phải scenario.

**Render mỗi leaf:**
- 1 `export const` + `name:` = nhãn (tên leaf CHÍNH LÀ nhãn, KHÔNG `<Label>` inline). 1 state = 1 canvas `layout:"fullscreen"`.
- Content → `blockShell(<div className="w-*">…</div>, ANATOMY)`; loading/error (SectionCard-based) render plain + `p-3`/`p-8` wrapper.

**⭐ Anatomy ĐÚNG LEAF (U1):** anatomy mỗi leaf CHỈ kể part CHÍNH LEAF ĐÓ render — loaded KHÔNG kể Skeleton/ErrorState; leaf khác composition → anatomy RIÊNG (leaf cùng composition share 1 object). CẤM tag `state:` "kể ké". Part gắn `tier` (`block`/`primitive`). **Cụm ≥2 element ĐỒNG VAI = 1 GROUP** (`ButtonGroup · nút chính + nút phụ`, KHÔNG `Button ×2`). Đối chiếu JSX THẬT — không sót không dư.

**⭐ Skeleton/Error = 1 per SCENARIO, MIRROR đúng shape** (No-progress skeleton KHÔNG thanh; Progress CÓ thanh). Lặp theo scenario là ĐÚNG; KHÔNG nhân theo tone; KHÔNG accent-sweep.

**State CÓ THẬT** (theo consumer/loader) — đừng bịa; empty CHỈ khi consumer có nhánh empty.

**⭐ Nhiều state → 1 BASE + spread delta:** `<scenario>Base` (props chung), mỗi leaf `{ ...base, <delta nhỏ> }` để lộ rõ cái GÌ đổi. Data-heavy → `.mocks.ts`.
