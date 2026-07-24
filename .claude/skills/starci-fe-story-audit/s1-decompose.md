# STEP 1 (audit) — VẼ CÂY LÝ TƯỞNG top-down từ source có sẵn → report → STOP

**Step này VẼ cây feature NÊN-CÓ, không audit hiện trạng.** Đọc source để hiểu feature LÀM GÌ, cộng
**tư duy xây app** để HOÀN THIỆN nó thành cây đầy đủ. ⛔ KHÔNG đánh dấu có/thiếu port, KHÔNG bắt drift,
KHÔNG so với story hiện có — **để step sau**. Read-only.

## A. Đọc source để hiểu feature (top-down, đừng xé xuống nguyên tử ngay)
Mục tiêu đọc = hiểu feature LÀM GÌ, không phải chấm code.
1. **UI này là gì?** `layout(page)` (`src/app/**`) hay `overlay(drawer/modal)` (`src/components/drawers/**`, `features/**`)?
2. **Nó SWITCH giữa những cấu trúc nào?** view-state (`PanelView`/`view === "..."`, `mode`, tab, route). Đọc HẾT render mỗi nhánh.
3. **Có overlay-state phủ lên không?** (vd `selection` = đoạn bôi đen) — thêm/bớt block ở tầng đỉnh → sinh leaf; hay chỉ đổi nội dung 1 block → state.
4. **Feature có nửa vời chỗ nào?** (union member khai mà chưa render, hook/query có mà chưa dùng, state thiếu) — **ghi nhớ để HOÀN THIỆN ở bước D**, đừng vội kết luận "code chết".

## B. Rút LEAF — theo CẤU TRÚC (§11f)
- **LEAF = 1 tập BLOCK node riêng.** Leaf đổi ⇔ tập block đổi: thêm/bớt block, hoán nguyên 1 block, đổi nút nav (History↔Back), mất/thêm composer.
- Cùng tập block, khác nội dung/tình huống → **1 leaf + STATE**, KHÔNG leaf mới.
- ⛔ `empty` · `loading/skeleton` · `error` KHÔNG BAO GIỜ là leaf — luôn là state của block.
- **Smell test:** 2 leaf trùng `parts` → gộp thành 1 leaf + state.

## C. Đào từng leaf xuống tầng (§6c thang 3 câu)
Mỗi block trong leaf, xếp tầng:
1. props slot trơ (children/rows/title) → **PRIMITIVE**; vai nội dung có tên (value/cover/item) → câu 2.
2. hiển thị 1 mẩu dữ liệu → **DESIGN**; là 1 VÙNG phục vụ 1 chức năng, có bộ state → **BLOCK**.
3. chỉ ghép block thành màn/vùng nổi → **LAYOUT/OVERLAY**.

Mỗi BLOCK: liệt kê **đầy đủ states** (empty · loading · error · content · streaming · inline-edit…). Vẽ đủ để step dựng không sót.

## D. HOÀN THIỆN bằng tư duy xây app (điểm cốt lõi của step này)
Cây không chỉ chép code — nó là feature NÊN-CÓ. Dùng phán đoán UX để bổ sung:
- **Leaf nửa vời** biz đã ám chỉ (union `settings` khai + query settings tồn tại nhưng chưa có màn) → **vẽ THÀNH leaf hoàn chỉnh**, đánh dấu `★HOÀN THIỆN`.
- **State thiếu về mặt UX** (vd tách `chờ-nhập hint` khỏi `rỗng không-thấy`; tách `streaming` khỏi `content`) → thêm vào block.
- **Design node nên tách** (1 mẩu dữ liệu có vai đang bị block tự vẽ inline) → tách ra design riêng (§6c).
- Ghi RÕ mỗi chỗ hoàn thiện + lý do, để thầy duyệt (thầy có thể bác).

## E. Format report → `$FE_SOURCE/.artifacts/decompose/<ui-name>.md`

```md
# Decompose (audit): <UI name> — CÂY LÝ TƯỞNG (top-down)

> Step 1 = vẽ cây nên-có từ source + tư duy hoàn thiện. Không đánh dấu có/thiếu/drift — để step sau.
> Nguồn hiểu biz: <src/.../index.tsx>. Pull FE @ <commit>.

## Feature là gì (1 câu)
<mục đích người dùng>

## Chrome chung (mọi leaf)
- Overlay/Layout: <kiểu>
- Header/nav chung: <...>

## CÂY
​```
OVERLAY/PAGE <name>
│  header: ...
├─ LEAF 1 · <tên>              (điều kiện cấu trúc)
│  ├─ nav: <HistoryLink/BackLink/...>
│  ├─ BLOCK <name>
│  │    states: <a · b · c ...>
│  │  ├─ DESIGN <name>   (vai dữ liệu)
│  │  └─ PRIMITIVE <a · b>
│  └─ BLOCK <name>  ...
├─ LEAF 2 · ...
└─ LEAF n · <tên>  ★HOÀN THIỆN   (chỗ bổ sung ngoài code hiện tại)
​```

## Ghi chú tư duy xây app (chỗ HOÀN THIỆN, không chỉ chép code)
1. <leaf/state/design bổ sung> — <lý do UX>
2. ...

## Câu hỏi chờ thầy trước khi qua step sau
- <chỗ hoàn thiện có đúng ý thầy không>
- <còn leaf/luồng nào thiếu>
```

## F. RENDER RA 8080 — PROTOTYPE HÌNH + CÂY (bắt buộc mỗi lần call — thầy soi mắt)
1 trang HTML `$FE_SOURCE/.artifacts/decompose/<ui-name>.html`, **2 phần**:
1. **PROTOTYPE (hình) — bắt buộc, phần chính:** vẽ mockup UI THẬT của mỗi **leaf** (và state chính đáng chú ý: rỗng/selection/…) — không chỉ hộp trừu tượng. Drawer/overlay vẽ khung đúng dáng (side-drawer surface, header, thread bubbles, composer, list rows…). Đủ nhận ra feature trông thế nào.
   - **Icon = Phosphor, IMPORT vào:** `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` rồi `<i class="ph ph-paper-plane-tilt"></i>` (send · `ph-magnifying-glass` tìm · `ph-chats-circle` lịch sử · `ph-caret-down` · `ph-quotes` trích · `ph-x` · `ph-plus` · `ph-dots-three-vertical` · `ph-arrow-left` back · `ph-book-open`/`ph-cards`/`ph-puzzle-piece`/`ph-sparkle` loại nội dung). Trang serve local (không CSP artifact) → CDN chạy được; đừng chế icon bằng ký tự.
2. **CÂY tầng** (bên dưới prototype): phân tầng bằng MÀU — overlay · leaf · block(+state chips) · design · primitive; `★HOÀN THIỆN` tô nổi.
- Self-contained, inline CSS, theme-aware. `cp <ui-name>.html index.html`.
- **Serve 8080** (nền): `cd $FE_SOURCE/.artifacts/decompose && python -m http.server 8080 --bind 127.0.0.1` → verify `curl -s -o /dev/null -w "%{http_code}"` = 200 → báo link `http://localhost:8080/<ui-name>.html`. (8080 kẹt → port trống khác + báo.)

## G. STOP
Báo thầy: link 8080 + cây + chỗ hoàn thiện + câu hỏi. **Dừng chờ duyệt.** Việc so port / bắt drift / dựng = step sau.
