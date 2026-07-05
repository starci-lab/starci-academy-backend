---
name: starci-fe-layout-brainstorm
description: >
  Draw the LAYOUT BLUEPRINT of a whole FEATURE (ALL its routes/tabs/modes — view, edit, create,
  detail — not one page in isolation) in the MAIN StarCi Academy web app
  (`C:\Repositories\starci-academy`) — WHERE each region renders (nav/tabs, CTA buttons, cards,
  rails, sections) and WHY it sits there, with EVERY tab's content expanded (not hidden behind a
  tab switch). Also decides ROUTING architecture (whether a surface should be a separate route vs
  a query-param mode of the same surface, e.g. `/cv/edit` → `?tab=cv&edit=true`) and unifies an
  inconsistent URL scheme across sibling surfaces into ONE coherent layout system. This is the
  coarse arrangement/information-architecture pass — NOT per-component styling detail. Same working method as `starci-fe-ux-brainstorm` (research BE/DB/legacy via
  Explore agents, ui-ux-pro-max, ref-grounded, NO code). EVERY run MUST render a MANDATORY widget
  mockup showing the fixed zone map PLUS the FULL data-state matrix (empty / 1 / N / overflow /
  mixed-variant), each tab's content expanded, and the course-CTA funnel marked in every state —
  a layout spec is not complete until all states are drawn. HARD MINDSET: every layout MUST route
  the user toward enrolling in a course (course-CTA funnel), and every empty/gap region funnels to
  `/courses`. Run with MAX reasoning effort (Opus). Trigger when the user types
  `/starci-fe-layout-brainstorm <page>` or asks to draw/plan a page's layout.
---

# /starci-fe-layout-brainstorm — Vẽ BẢN ĐỒ LAYOUT cả trang (Opus · MAX effort)

Vẽ **bố cục CẢ TRANG/web**: cái gì render Ở ĐÂU (tab, nút CTA, card, rail, section) + **TẠI SAO ở đó**, và **render
nội dung TỪNG TAB ra** (không giấu sau tab switch). Đây là pass **arrangement thô** — KHÔNG đi vào chi tiết style
component. **KHÔNG viết code.** CHẠY MAX EFFORT.

> Khác `/starci-fe-ux-brainstorm`: cái kia re-imagine UX sâu (nhiều hướng, purpose, states, copy). Cái NÀY = **bản
> đồ layout** — sơ đồ khối cả màn: nav/tab structure, vùng nào ở đâu, CTA anchor ở đâu, card zone ở đâu, mỗi tab
> chứa gì. Ít "3 hướng khác nhau triệt để", nhiều "blueprint bố cục + lý do đặt chỗ". Nếu cần đào UX sâu 1 khối →
> dùng `/starci-fe-ux-brainstorm`; nếu cần khung tổng thể "web trông thế nào" → dùng skill này.

## MINDSET CỨNG (STRICT) — mọi layout PHẢI có CTA vào khóa
- **Mỗi bản đồ layout PHẢI chỉ rõ ĐƯỜNG CTA vào khóa học** (course-CTA funnel). Vẽ layout mà không có anchor "vào
  khóa" = SAI, làm lại. Ghi rõ CTA-khóa NẰM Ở ĐÂU trên màn + tại sao chỗ đó.
- **Mọi vùng RỖNG / thiếu dữ liệu = phễu về `/courses`** (giọng *"học để KIẾM bằng chứng/kết quả thật"*, KHÔNG
  *"mua để tăng số"* — giữ [[fair-monetization-axiom]]). Ô trống không bao giờ là ngõ cụt; nó là lời mời học.
- **Vòng khép luôn phải đọc ra được từ layout:** giá trị (recruiter thấy / mở khóa / điểm / bằng chứng) ⇐ thành tích
  ⇐ **phải học**. Layout phải đặt các khối sao cho user thấy được mạch này.
- Với trang KHÔNG phải hồ sơ/CV (vd trang marketing, dashboard, khóa học) → CTA-khóa vẫn phải hiện diện đúng chỗ
  (hero CTA, card khóa, nudge "học tiếp") — không trang nào của app được thiếu đường vào khóa.

## SCOPE = CẢ FEATURE + kiến trúc ROUTE là quyết định phải NGHĨ (STRICT)
- **Layout-brainstorm KHÔNG chỉ 1 trang lẻ — khoanh + thiết kế cho CẢ FEATURE: MỌI route/tab/mode liên quan** (xem ·
  sửa · tạo · chi tiết · state…). Redesign **1 HỆ layout NHẤT QUÁN** xuyên các surface — KHÔNG polish 1 trang rồi bỏ
  mặc sibling (lệch nhau = chối). Vd feature CV = `?tab=cv` (xem) + trang sửa + tạo → phải cùng 1 ngôn ngữ layout.
- **"RỜI hay KHÔNG RỜI" (route riêng vs query-param mode trên CÙNG surface) là QUYẾT ĐỊNH PHẢI SUY NGHĨ, không mặc
  định giữ legacy.** Hỏi: mode này là **"1 TRẠNG THÁI của surface"** (→ query-param mode, cùng shell) hay **"1 VIỆC
  riêng tách hẳn"** (→ route rời)?
  - Là trạng thái của cùng surface (vd sửa CV) mà đang là route rời `/cv/edit` với layout khác hẳn → **cân nhắc hợp
    nhất thành `?tab=cv&edit=true`** (cùng shell + ngôn ngữ layout với `?tab=cv`).
  - Là việc-tập-trung tách bạch (leaf solve, canvas full-bleed) → route rời hợp lý (giữ). Ref [[when-rail]] /
    [[leaf-page-one-nav-and-combined-tab-toolbar]] cho tinh thần "surface tập trung".
- **Hợp nhất URL scheme cho các surface anh em** → nhất quán (đừng 1 cái `?tab=`, 1 cái `/x/edit` với layout chỏi).
  Đề xuất scheme trong doc + widget (route/mode nào, vì sao). Đổi routing là 1 phần của layout, KHÔNG bỏ qua.

## Nguyên tắc (giữ nguyên từ fe-ux-brainstorm)
- **Legacy = inventory, KHÔNG phải design authority.** Đọc trang hiện tại CHỈ để liệt kê: đang render gì + đau ở đâu
  (loãng / thiếu state / CTA-khóa vắng / phân cấp sai). ĐỪNG bê cấu trúc legacy sang.
- **Grounded in data:** mọi khối tựa trên field BE/DB THẬT — đừng vẽ vùng cho dữ liệu không tồn tại. Field CÓ nhưng
  CHƯA dùng = cơ hội đặt 1 khối mới.
- **Mindset-first:** áp `main.md` §1 + skill **`ui-ux-pro-max`** (purpose trước pixel · 1 primary action/màn ·
  empty/loading/error · recruiter/user-first · nội dung > vanity · ăn cắp pattern đã chứng minh) + luật layout StarCi
  ([[when-rail]] · [[when-drawer]] · [[three-tier-page-layout]] · [[concepts/card]] · [[tabscard-two-secondary-groups]]
  · [[single-select-among-options-use-tabs]]).
- **Ref-grounded — KHÔNG bịa pattern:** loại trang/khối CHƯA có ref trong memory (`.claude/rules`, auto-memory, doc
  brainstorm cũ) → **BẮT BUỘC `WebSearch` + `WebFetch`** đọc tài liệu UX thật + soi 2–3 sản phẩm đầu ngành, rồi mới
  chốt. Mỗi lựa chọn đặt-chỗ neo được vào ref cụ thể. Liệt kê nguồn trong doc + chat.

## Quy trình (MAX effort)
1. **Khoanh vùng CẢ FEATURE (mọi route/tab/mode):** liệt kê MỌI surface liên quan (xem/sửa/tạo/chi tiết) + route +
   cây component (mới + legacy) + tab/segment/rail + **URL scheme hiện tại của từng cái** → phát hiện chỗ RỜI/lệch
   (vd `?tab=cv` vs `/cv/edit`) để quyết hợp nhất (xem §SCOPE). Không chỉ khoanh 1 trang.
2. **Research SONG SONG — spawn Explore agents (đừng đoán):**
   - **BE** `C:\Repositories\ac\starci-academy-backend`: GraphQL query/mutation phục vụ trang + field trả về.
   - **DB**: Postgres entities — field/quan hệ thật → dữ liệu KHẢ DỤNG (kể cả field chưa khai thác) = khối tiềm năng.
   - **Legacy UX**: trang hiện render gì, có mấy tab/rail, CTA-khóa có/không + pain bố cục.
3. **Skill `ui-ux-pro-max`** (`--design-system` + domain `product`/`ux`) cho loại trang → pattern layout + anti-pattern.
4. **Vẽ BẢN ĐỒ LAYOUT (cốt lõi của skill này):**
   - **Khung màn:** page shell (nav trên · rail trái? · cột nội dung · rail phải?) — quyết theo [[when-rail]]
     (default KHÔNG rail; rail phải "kiếm được"). Ghi TẠI SAO có/không rail.
   - **Cấu trúc TAB/segment:** liệt kê MỌI tab (vd "Kết quả · Xem trước") + **render nội dung TỪNG TAB ra** (tab này
     chứa khối gì, xếp ra sao) — KHÔNG để "tab 2 = ..." mơ hồ. Chọn kiểu tab theo vai ([[single-select-among-options-use-tabs]]:
     nav/đổi-nội-dung = underline `TabsCard`; setting tại chỗ = segmented).
   - **Vị trí + vai từng khối:** mỗi region = 1 dòng "[khối] — [ở đâu] — [PRIMARY/secondary] — [tại sao chỗ này]".
     Chỉ rõ: **1 primary CTA/màn ở đâu**, **CTA-khóa ở đâu** (bắt buộc), card zone ở đâu, rail chứa gì.
   - **MA TRẬN STATE ĐẦY ĐỦ (BẮT BUỘC — cover all test case):** định nghĩa layout cho MỌI state đếm-được của surface,
     tối thiểu: **rỗng (0)** · **1** · **N (nhiều)** · **overflow (vượt cap hiển thị → +N/drawer)** · **mixed-variant**
     (item khác nguồn/loại: generate vs upload, free vs premium…) · **đặc biệt** (locked/pending). Mỗi state ghi rõ:
     khối nào ẩn/hiện, control nào bật, nội dung đổi gì, **phễu-khóa nằm đâu**. Ref [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]].
     ĐỪNG chỉ vẽ "state có data đẹp" — thiếu 1 nhánh state = spec chưa đủ.
   - **Lý do đặt chỗ (WHY):** mỗi quyết định vị trí neo vào 1 nguyên tắc (F-pattern/đọc trên-xuống · primary-action-1 ·
     gom nhóm nghĩa · rỗng=CTA · ref sản phẩm). KHÔNG đặt chỗ "cho đẹp".
5. **Output:** ghi **`<Feature>/LAYOUT-BRAINSTORM.md`** (cạnh trang) + tóm tắt chat:
   khung màn · cây tab (mỗi tab render gì) · bảng khối→vị trí→vai→lý do · CTA-khóa nằm đâu · 3 state · điều cắt/thêm.
   **KHÔNG code.**
6. **VẼ WIDGET — BẮT BUỘC, ĐÚNG FORMAT DƯỚI (mỗi lần chạy skill PHẢI render đủ):** dùng `show_widget` (gọi `read_me`
   module `mockup` trước) render **bản đồ layout dạng wireframe khối** (flat, CSS vars, nhãn ngắn — KHÔNG nội dung
   thật rườm rà). Widget PHẢI gồm ĐỦ 4 phần, không thiếu phần nào:
   - **(a) Legend** — 4 loại khối: card/vùng · **CTA vào khóa (phễu)** · điểm/unlock (outcome) · ô-trống→phễu.
   - **(b) KHUNG VÙNG CỐ ĐỊNH** — 1 sơ đồ shell (nav · rail? · cột nội dung) + các vùng A→… xếp dọc trong cột nội
     dung, mỗi vùng 1 nhãn + vai + ẩn/hiện. Kèm 1 dòng WHY cho thứ tự vùng (vì sao selector/outcome nằm trên tabs…).
   - **(c) MỌI STATE trong ma trận (§4) render THÀNH panel riêng cạnh/stacked** — **rỗng · 1 · N · overflow · mixed**
     (+ đặc biệt nếu có). State **rỗng** phải vẽ RÕ card-lời-mời + **[Vào khóa học] PRIMARY**. State có-data phải
     **BUNG NỘI DUNG TỪNG TAB** (mỗi tab con 1 wireframe, cạnh nhau/stacked) — KHÔNG giấu sau tab switch. State N/
     overflow vẽ selector + `+N`; state mixed vẽ icon phân biệt nguồn/loại.
   - **(d) Đánh dấu rõ trên MỌI wireframe:** **[CTA]** (nhất là CTA-khóa, tô accent), **[TAB]**, **[CARD]**, **[RAIL]**,
     vùng **rỗng→phễu** (dashed accent). Mỗi state kèm 1 dòng caption "phễu-khóa ở đâu + tại sao".
   - Nếu ≥2 cách bố cục KHUNG hợp lý (hiếm ở tầng layout) → render 1–3 scenario khung cạnh nhau, mỗi cái tagline +
     trade-off, đánh dấu cái đề xuất (viền accent). Thầy NHÌN + CHỌN, KHÔNG chỉ tả chữ.
   - **Chuẩn "đủ layout" = thầy nhìn widget là thấy ĐỦ: khung vùng + mọi state dữ liệu (rỗng/1/N/overflow/mixed) +
     nội dung từng tab + phễu-khóa ở mỗi state.** Thiếu 1 state hay không bung tab = CHƯA đạt, làm lại.

→ Thầy duyệt layout → `/starci-fe-ux-apply` để dựng. **Thầy feedback bất cứ lúc nào → tự ghi
`.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát), KHÔNG sửa main.md/starci-*.md trực tiếp.
