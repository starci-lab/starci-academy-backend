# STEP 1 (create) — VIẾT BIZ SPEC → dựng cây 4 tầng → tái dùng port → report → STOP

Read-only với code (chỉ ghi report). Nguồn sự thật = **biz spec thầy + mình soạn**, đối chiếu port THẬT để tái dùng.

## A. Clarify trước khi soạn (đừng bịa)
Mô tả thầy thường thiếu. HỎI khi chưa rõ:
- UI này là **page** hay **overlay** (drawer/modal)?
- Nó **SWITCH** giữa mấy cấu trúc? (vd danh sách ↔ chi tiết ↔ tạo mới)
- Mỗi vùng có những **STATE** nào? (empty · loading · error · có data · đang gửi…)
- **Dữ liệu** mỗi vùng render là gì? (để xếp design vs primitive)

## B. Viết BIZ SPEC (hành vi UI mới, top-down)
Không vẽ pixel — mô tả CHỨC NĂNG theo tầng:

```md
## Biz spec: <UI name>
- Loại: overlay(drawer) | page | modal
- Mục đích: <1 câu người dùng làm gì ở đây>
- Cấu trúc switch: <view A> / <view B> / ... (điều gì bấm để đổi)
- Overlay-state phủ (nếu có): <vd đang chọn item> → thêm/bớt block gì
- Mỗi vùng chức năng + state:
  - <Vùng 1>: chức năng ... — states: empty · loading · content · error
  - <Vùng 2>: ...
```

## C. Rút LEAF từ spec (§11f)
- **LEAF = 1 tập BLOCK.** Mỗi cấu trúc switch (và mỗi overlay-state làm đổi tập block) = 1 leaf.
- state trong 1 block (empty/loading/error/content) **KHÔNG** thành leaf.
- Smell test: 2 leaf trùng `parts` → gộp thành 1 leaf + state.

## D. Đào tầng (thang 3 câu §6c)
Mỗi block trong leaf:
1. props slot trơ → **PRIMITIVE** · vai nội dung có tên → câu 2.
2. 1 mẩu dữ liệu → **DESIGN** · 1 vùng chức năng có state → **BLOCK**.
3. chỉ ghép block → **LAYOUT/OVERLAY**.

Mỗi BLOCK ghi đủ **states** — đây là story states sẽ phải dựng.

## E. Format report → `$FE_SOURCE/.artifacts/decompose/<ui-name>.md`
⛔ KHÔNG grep port / đánh REUSE-NEW ở step này — cây là feature NÊN-CÓ. Đối chiếu port = STEP SAU.

```md
# Decompose (create): <UI name> — CÂY LÝ TƯỞNG (top-down)

## Feature là gì (1 câu)
<mục đích người dùng>

## Biz spec
<mục B ở trên>

## Chrome chung (mọi leaf)
- Overlay/Layout: <kiểu> · Header/nav chung: <...>

## CÂY
​```
OVERLAY/PAGE <name>
│  header: ...
├─ LEAF 1 · <tên>              (điều kiện cấu trúc)
│  ├─ nav: <...>
│  ├─ BLOCK <name>
│  │    states: <a · b · c ...>
│  │  ├─ DESIGN <name>   (vai dữ liệu)
│  │  └─ PRIMITIVE <a · b>
│  └─ BLOCK <name>  ...
└─ LEAF n · ...
​```

## Ghi chú tư duy xây app (chỗ thiết kế thêm cho đầy đủ)
1. <leaf/state/design> — <lý do UX>

## Câu hỏi chờ thầy trước khi qua step sau
- <chỗ chưa chắc trong spec>
```

## F. RENDER RA 8080 — PROTOTYPE HÌNH + CÂY (bắt buộc mỗi lần call — thầy soi mắt)
1 trang HTML `$FE_SOURCE/.artifacts/decompose/<ui>.html`, **2 phần**:
1. **PROTOTYPE (hình) — phần chính:** vẽ mockup UI THẬT mỗi **leaf** (+ state chính) theo biz spec — khung đúng dáng (overlay/page, header, body, control). Đủ để thầy thấy UI mới trông thế nào. **Icon = Phosphor import**: `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` + `<i class="ph ph-..."></i>` (đừng chế icon bằng ký tự).
2. **CÂY tầng** bên dưới: phân tầng bằng màu (overlay·leaf·block+states·design·primitive; `★HOÀN THIỆN` tô nổi).
Self-contained, theme-aware. `cp <ui>.html index.html`; serve `cd $FE_SOURCE/.artifacts/decompose && python -m http.server 8080 --bind 127.0.0.1` → verify HTTP 200 → báo link `http://localhost:8080/<ui>.html`. (8080 kẹt → port trống + báo.)

## G. STOP
Báo thầy: link 8080 + spec + cây + câu hỏi. **Dừng chờ duyệt** — chưa grep port, chưa dựng .tsx.
