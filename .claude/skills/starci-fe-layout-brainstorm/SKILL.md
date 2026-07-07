---
name: starci-fe-layout-brainstorm
description: >
  Build the LAYOUT of a whole FLOW (a feature's full sequence of surfaces/phases/routes — e.g. setup→work→result,
  view→edit→create — NOT one page in isolation) in the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`).
  Picks each surface's SHELL by its JOB (job→shell→archetype), maps zones, covers the data-state matrix
  (empty/1/N/overflow/mixed) + the course-CTA funnel + the CONVERSION lens (CTA · psychology · linking, honest per
  fair-monetization) in every state, and briefs each block to ONE line (internals → `starci-fe-block-skill`). Grounded
  in `.claude/fe/{layouts,components,features,principles}` + the real source; researches the web when `fe/` doesn't
  cover a pattern or when unsure. SELF-VERIFIES against house-rules, then renders an INTERACTIVE clickable HTML
  prototype of the flow (walk it like slides) hosted on localhost:8080 for approval. On approval, writes a
  `<feature>.proposal.md` into a QUEUE (`fe/proposals/`) that a SEPARATE `starci-fe-ux-apply` run builds — it does NOT
  build itself. Opt-in "panel" mode fans out rival shell directions + an adversarial critic
  for hard flows. NOT per-component styling. Trigger when the user types `/starci-fe-layout-brainstorm`, asks to
  build/plan a page or FLOW layout, or suggests a feature-layout to build.
---

# /starci-fe-layout-brainstorm — Dựng LAYOUT cả 1 FLOW (theo JOB, prototype bấm-được)

Layout chọn theo **CÔNG VIỆC của bề mặt**. **FLOW-first:** khoanh CẢ luồng (mọi surface/pha/route/mode), không 1
trang lẻ. Tập trung **SHAPE**; nội dung block dừng ở **BRIEF** (chi tiết → `starci-fe-block-skill`). Output = **prototype
HTML bấm-được** (đi luồng như slide) trên **:8080**, không chỉ tả chữ.

## Nền tra cứu (đọc TRƯỚC, đừng tự chế)
- **`.claude/fe/layouts/`** — `surface-job-drives-layout` ⭐ → `page-shell-selection` → archetype · `region-model` · `full-bleed-work-surface` · `responsive-regions`.
- **`.claude/fe/components/INDEX.md`** — block canonical để brief (KHÔNG hand-roll `<div>`).
- **`.claude/fe/features/<name>.md`** — doc feature (job·shell·CTA·links·psych) nếu có.
- **`.claude/fe/principles/`** — `call-to-action` · `content-linking` · `persuasion-psychology` · `product/fair-monetization-axiom`.
- **Web — khi `fe/` CHƯA phủ HOẶC trò KHÔNG CHẮC** → `WebSearch`/`WebFetch` sản phẩm đầu ngành + NN/g·Polaris·Material·Fluent, neo vào ref cụ thể, liệt kê nguồn. KHÔNG bịa từ trí nhớ; KHÔNG re-research pattern `fe/` đã có.

## Quy trình
1. **Khoanh FLOW** — liệt kê MỌI surface/pha/route/mode + đọc source thật (`src/components/features/<...>`) + `fe/features/<name>.md`.
2. **(OPT-IN) PANEL mode** — ca layout mơ hồ / thầy gọi "chiến": author 1 `Workflow` (sonnet) fan-out **N hướng shell song song** + **1 agent critic ADVERSARIAL** đập từng hướng (vi phạm rule? state hở? phễu đứt?) → synthesize hướng thắng. Ca thường bỏ qua (giữ gọn).
3. **JOB → SHELL mỗi surface** — `surface-job-drives-layout`; flow nhiều-pha = **đổi shell theo pha**. Chọn shell qua `page-shell-selection`.
4. **Map ZONES** — `region-model` + `responsive-regions` (rail→chips, 2-pane→stack).
5. **STATE + LENS CONVERSION mỗi state** — rỗng·1·N·overflow·mixed; đặt **VÀO vùng** (không chỉ liệt kê): **CTA** (1 primary, Fogg trigger) · **Link** (onward, không ngõ cụt) · **Tâm lý** (goal-gradient/social-proof/scarcity/hook, số THẬT) · **HONEST** (nudge để HỌC, cấm dark-pattern — `fair-monetization`). Rỗng = lời mời học → phễu khóa.
6. **GROUNDING sâu (always-on)** — brief mỗi block map vào **block THẬT** (grep `fe/components/` + source feature). KHÔNG bịa tên block; block chưa có → nói rõ "cần tạo".
7. **SELF-VERIFY gate (always-on)** — tự chấm blueprint theo checklist dưới TRƯỚC khi show. Miss → sửa, đừng đẩy lỗi cho thầy.
8. **PROTOTYPE bấm-được (:8080)** — dựng 1 file HTML self-contained (xem §Prototype) → host → thầy BẤM đi hết luồng + mọi state + phản biện.

→ **Thầy duyệt/phản biện** → **9. CHỐT (KHÔNG build):** ghi `fe/proposals/<feature>.proposal.md` (spec đầy đủ, xem §Chốt) + 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md`. **Brainstorm DỪNG ở đây** — build là việc của `starci-fe-ux-apply` (chạy sau, có thể session khác).

## §Prototype — interactive HTML host :8080 (như slide pptx)
- **Bắt đầu từ kit `.claude/fe/prototypes/_TEMPLATE.html`** — copy ra `scratchpad/<feature>-flow/index.html` rồi ĐIỀN màn theo comment; **KHÔNG dựng từ số 0**. 1 file self-contained (inline CSS/JS, KHÔNG external). Tra bản mẫu cũ: `fe/prototypes/INDEX.md`.
- **Mỗi surface/pha = 1 "màn"**; nav **Prev/Next** + **click hotspot** (nút/CTA/zone) để **chuyển màn hoặc toggle STATE** (rỗng↔có-data, tab, pha). Thầy đi luồng THẬT như bấm slide.
- Wireframe khối flat (token màu `fe/foundations/color`), nhãn ngắn; đánh dấu **[CTA]·[psych]·[funnel/link]·[state]** đúng vùng.
- **ELEMENT-AWARE (bắt buộc):** mỗi khối wireframe **GẮN TÊN block THẬT** nó đại diện (nút = `components/button` primary · card = `LabeledCard` · tabs = `TabsCard` · avatar = `UserAvatar`/`IconTile` · chip = `components/chip`). Prototype low-fi được, nhưng phải **chỉ đúng block canonical** (nối brief bước 6) — KHÔNG để hình generic vô danh, để build khỏi mơ hồ + không hand-roll.
- Responsive: nút toggle desktop/mobile để xem rail→chips, 2-pane→stack.
- **Host (STRICT — tránh phục vụ nhầm prototype CŨ):** serve tĩnh trong thư mục file, chạy nền. Cổng ưu tiên 8080 nhưng **KHÔNG tin server sẵn có**: (1) **KILL** process giữ :8080 (`netstat -ano | grep :8080 | grep LISTENING` → `taskkill //F //PID <pid>`) **HOẶC scan port +1 tới khi free**; (2) start `python -m http.server <port>`; (3) **BẮT BUỘC VERIFY nội dung** — `curl :<port>` grep 1 marker DUY NHẤT của prototype này (vd `<title>` = tên feature), **KHÔNG dừng ở HTTP 200** (200 có thể là prototype CŨ còn sống trên 8080 — đây là lỗi đã mắc). Sai marker → kill + serve lại. Đưa URL SAU khi verified. Không có python → `npx http-server -p <port>` / preview MCP.
- Nhà prototype = **`.claude/fe/prototypes/`** (`INDEX.md` để tra). Instance riêng-1-lần → scratch (ephemeral); instance đáng tái dùng → lưu `fe/prototypes/<feature>.html` + ghi 1 dòng vào `INDEX.md`. **KIT `_TEMPLATE.html` UPGRADE in-place** → mọi prototype sau kế thừa. Giá trị bền = ruling ghi `fe/` + kit + bản mẫu.

## §Self-verify checklist (bake — tự chấm bước 7)
- [ ] MỌI state có đường **CTA vào khóa** (rỗng = mời học, không ngõ cụt)
- [ ] `when-rail` đúng (KHÔNG rail rỗng < 5 item)
- [ ] shell theo JOB (KHÔNG nhồi work-surface vào cột đọc hẹp; work = full-bleed 2-pane)
- [ ] **1 primary action/màn**
- [ ] lens conversion đủ 3 (CTA·link·psych) + **HONEST** (số thật, không fake scarcity/count)
- [ ] mobile (rail→chips, 2-pane→stack)
- [ ] brief map **block THẬT** (không bịa)
- [ ] flow-first (đã khoanh MỌI pha/surface, không bỏ sibling)

## §Chốt → proposal (bake — brainstorm CHỐT thôi, KHÔNG build)
Sau khi thầy duyệt prototype/blueprint → ghi **1 `fe/proposals/<feature>.proposal.md`** (spec để session khác build):
- **flow + shell per surface** (job→shell) · **zones** · **state matrix + lens conversion** (grounded) · **block briefs element-aware** (tên block THẬT) · **prototype ref** · **files to touch** (đường dẫn source cần sửa) · **verify plan**.
- Thêm 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md` (hàng đợi — nguồn duy nhất biết cái nào làm rồi/chưa).
- **Brainstorm KHÔNG build** (không flip features, không ghi ruling layout) — đó là việc `starci-fe-ux-apply`.
- **→ GỢI Ý APPLY NGAY (same-session):** proposal vào hàng đợi xong → **hỏi thầy "apply luôn session này không?"**. Đồng ý → chạy `starci-fe-ux-apply <feature>` NGAY session này. Không → để session sau (BACKLOG là bàn giao). KHÔNG bắt buộc tách session.
- Chốt có thể xác nhận nhanh bằng `AskUserQuestion` (*"chốt proposal này vào hàng đợi?"* · *"prototype giữ làm mẫu → `fe/prototypes/`?"*).

## Ràng (STRICT)
- **KHÔNG tự chế shell/primitive** — tra `layouts/` + `components/`. Design MỚI không có trong `fe/` → HỎI thầy.
- Routing là 1 phần layout: quyết "route rời vs query-param mode cùng shell" + hợp nhất URL scheme sibling.
- Mọi fetch → `AsyncContent`. 1 component = 1 folder `index.tsx`, props discipline.

## Bàn giao
- **BUILD proposal → `starci-fe-ux-apply`** (đọc `fe/proposals/<feature>.proposal.md` → dựng → ✅ DONE + flip features).
- Chi tiết/style block → `starci-fe-block-skill` · Skeleton → skill skeleton · Phản biện business → `starci-fe-critique`.
- Bản đồ: `.claude/fe/README.md` · hàng đợi: `.claude/fe/proposals/BACKLOG.md`.
