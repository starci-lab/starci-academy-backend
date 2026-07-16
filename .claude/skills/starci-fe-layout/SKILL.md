---
name: starci-fe-layout
description: >
  Brainstorm LAYOUT cho CẢ MỘT FLOW (chuỗi surface/pha/route đầy-đủ của 1 feature — vd setup→work→result,
  view→edit→create — KHÔNG phải 1 trang lẻ) của app FE chính (`$FE_SOURCE`, branch mtp).
  Chọn SHELL mỗi surface theo JOB (job→shell→archetype), map zones, phủ state-matrix (rỗng/1/N/overflow/mixed)
  + conversion lens (CTA · link · psychology, honest theo fair-monetization) trong MỌI state, brief mỗi block
  1 dòng; surface render DATA từ BE → deep-scan song song cả `$FE_SOURCE` lẫn `$BE_SOURCE\src`. Ground vào
  **`.artifacts/states`** (Storybook-truth, do `starci-fe-sync` giữ — KHỎI rescan src) +
  **`.artifacts/concepts`** (định hướng feature) + rule read-only **`.claude/fe/axis-3-layout`** (+
  axis-2-biz-ui/axis-1-rules khi cần); **KHÔNG search web** — thiếu dữ kiện thì DỪNG hỏi thầy. Output = PROTOTYPE HTML bấm-được ghi
  `.artifacts/prototypes/<feature>/` host :8080 cho thầy đi luồng như slide → thầy duyệt → CHỐT
  `.artifacts/proposals/<feature>.proposal.md` (PENDING trong BACKLOG). Skill này KHÔNG build code —
  build là việc của `starci-fe-build` (proposal là bàn giao, chạy được session khác). Trigger khi user gõ
  `/starci-fe-layout <feature>`, hoặc nói "brainstorm layout", "dựng layout flow X", "thiết kế luồng/trang",
  "prototype flow cho thầy duyệt".
---

# /starci-fe-layout — Brainstorm LAYOUT cả FLOW → prototype :8080 → chốt proposal

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

Layout chọn theo **CÔNG VIỆC của bề mặt**, không theo thói quen. **FLOW-first:** khoanh CẢ luồng (mọi
surface/pha/route/mode), không thiết kế 1 trang lẻ. Tập trung **SHAPE**; nội dung block dừng ở **BRIEF 1 dòng**
(internals → `starci-fe-block`). Output = **prototype HTML bấm-được** trên **:8080** — không tả chữ suông.

## Nguồn (đọc TRƯỚC, đừng tự chế) — artifacts + canon, KHÔNG web

| Nguồn | Ở đâu | Dùng làm gì |
|---|---|---|
| **states** ⭐ | `.artifacts/states/` (trong FE source, `fe-sync` giữ) | UI đã render THẬT trong Storybook + vừa đổi gì — **đọc đây thay vì rescan `src/`**; cần mới hơn → chạy `/starci-fe-sync` trước |
| **concepts** ⭐ | `.artifacts/concepts/<feature>.md` | ĐỊNH HƯỚNG feature (ý đồ · outcome · muốn-thành-gì) — thay cho search web. **Chưa có / thiếu điều cần → DỪNG hỏi thầy**, không tự chế |
| **layouts** | `.claude/fe/axis-3-layout/RULES.md` (read-only) | §JOB→SHELL ⭐ (job→shell→archetype) → §Zone (region-model) · §Responsive · §State-matrix |
| **components** | `.claude/fe/axis-2-biz-ui/RULES.md` | §Bảng tra data-shape → block canonical để brief — KHÔNG hand-roll `<div>` |
| **principles** | `.claude/fe/axis-3-layout/RULES.md` §Conversion | CTA · content-linking · persuasion-psychology + fair-monetization (honest, gộp chung §Conversion) |

- **`.claude/` là RULE read-only** — skill này CHỈ ĐỌC, tuyệt đối KHÔNG ghi vào `.claude/` trong vòng lặp.
- **KHÔNG search web.** Nguồn khép kín: states + concepts + canon. Thiếu → hỏi thầy.

## Quy trình

1. **Khoanh FLOW** — liệt kê MỌI surface/pha/route/mode. Nguồn = `.artifacts/states` + `concepts/<feature>.md`;
   chỉ mở source thật (`src/components/features/<...>`) khi 2 nguồn đó CHƯA đủ hiểu.
   - **Surface render DATA từ BE** (stats/dashboard/list/feed) → nâng thành **deep-scan song song**: fan-out agent
     đọc source THẬT cả 2 repo (FE + `starci-academy-backend`) map **TRẦN DỮ LIỆU**: (A) đang render gì ·
     (B) đã persist nhưng CHƯA vẽ ⭐ · (C) compute ra sao. "Nên render gì" = giao của [JOB] × [DATA có THẬT] —
     không đề xuất chart mà data không tồn tại, không bỏ sót data đã persist, không nhân bản cùng khuôn hero.
2. **JOB → SHELL mỗi surface** — `.claude/fe/axis-3-layout/RULES.md` §JOB→SHELL; flow nhiều-pha = **đổi shell theo pha**.
3. **Map ZONES** — `.claude/fe/axis-3-layout/RULES.md` §Zone + §Responsive (rail→chips, 2-pane→stack).
4. **STATE-MATRIX + CONVERSION LENS mỗi state** — rỗng·1·N·overflow·mixed; đặt **VÀO vùng** (không chỉ liệt kê):
   **CTA** (1 primary/màn, Fogg trigger) · **Link** (onward, không ngõ cụt) · **Psych** (goal-gradient/social-proof,
   số THẬT) · **HONEST** (nudge để HỌC, cấm dark-pattern). Rỗng = lời mời học → phễu khóa.
5. **GROUNDING block** — brief mỗi block map vào **block THẬT** (`.claude/fe/axis-2-biz-ui/RULES.md` + states). Không bịa
   tên block; chưa có → ghi rõ "cần tạo".
6. **SELF-VERIFY gate** — tự đóng vai thầy phản biện TRƯỚC khi show (checklist dưới). Miss → sửa, đừng đẩy lỗi
   cho thầy bấm ra.
7. **PROTOTYPE bấm-được** — dựng + host (xem §Prototype) → thầy đi luồng + phản biện.
8. **Thầy duyệt → CHỐT proposal** (xem §Chốt). **DỪNG ở đây — KHÔNG build.**

## §Prototype — HTML bấm-được, sống trong `.artifacts/prototypes`, host :8080

- Ghi `.artifacts/prototypes/<feature>/index.html` — **1 file self-contained** (inline CSS/JS, KHÔNG external).
  Có kit/bản mẫu cũ trong `.artifacts/prototypes/` thì kế thừa, đừng dựng từ số 0.
- **Mỗi surface/pha = 1 "màn"**; nav Prev/Next + **click hotspot** (CTA/zone) để chuyển màn hoặc toggle STATE
  (rỗng↔có-data, tab, pha). Thầy đi luồng THẬT như bấm slide.
- Wireframe khối flat (token màu theo `.claude/fe/axis-1-rules/RULES.md` §Token nền), nhãn ngắn; đánh dấu
  **[CTA]·[psych]·[link]·[state]** đúng vùng.
- **ELEMENT-AWARE (bắt buộc):** mỗi khối wireframe **GẮN TÊN block THẬT** nó đại diện (card = `LabeledCard`,
  tabs = `TabsCard`, …) — nối brief bước 5, để build khỏi mơ hồ, không hand-roll.
- Responsive: toggle desktop/mobile để soi rail→chips, 2-pane→stack.
- **Host (STRICT — đừng phục vụ nhầm prototype CŨ):** (1) kill process giữ :8080 hoặc scan port +1 tới khi free;
  (2) `python -m http.server <port>` trong thư mục prototype; (3) **VERIFY nội dung** — `curl` grep 1 marker
  DUY NHẤT (vd `<title>` = tên feature), **KHÔNG dừng ở HTTP 200** (200 có thể là prototype cũ). Sai marker →
  kill + serve lại. Đưa URL SAU khi verified.

## §Self-verify checklist (tự chấm bước 6 — kỷ luật tự phản biện TRƯỚC khi trình cho thầy)

- [ ] MỌI state có đường **CTA vào khóa** (rỗng = mời học, không ngõ cụt)
- [ ] shell theo JOB (không nhồi work-surface vào cột đọc hẹp; work = full-bleed 2-pane); rail chỉ khi ≥5 item
- [ ] **1 primary action/màn**
- [ ] lens conversion đủ 3 (CTA·link·psych) + **HONEST** (số thật, không fake scarcity)
- [ ] mobile cover (rail→chips, 2-pane→stack)
- [ ] brief map **block THẬT** (không bịa)
- [ ] **(page DATA)** đã map trần-dữ-liệu; mỗi block data neo **field THẬT**; hero khớp JOB
- [ ] flow-first (đã khoanh MỌI pha/surface, không bỏ sibling)

## §Chốt → proposal (skill này CHỐT thôi, KHÔNG build)

Thầy duyệt xong → ghi **`.artifacts/proposals/<feature>.proposal.md`** — SPEC cho `starci-fe-build`:
- **flow + shell per surface** (job→shell) · **zones** · **state-matrix + conversion lens** ·
  **block briefs element-aware** (tên block THẬT) · **prototype ref** (`.artifacts/prototypes/<feature>/`) ·
  **files to touch** · **verify plan**.
- **(page DATA)** kèm **data-ceiling map** (đang render / persist-chưa-vẽ / compute) + **ma trận build**
  (`render-là-xong` / `aggregate-BE` / `đổi-schema`) — để build biết field nào sẵn, field nào phải mở BE trước.
- Thêm 1 dòng **⏳ PENDING** vào `.artifacts/proposals/BACKLOG.md` (hàng đợi = nguồn duy nhất biết cái nào
  làm rồi/chưa; tạo file nếu chưa có).
- Xong → hỏi thầy *"build luôn session này không?"* — đồng ý thì gọi `starci-fe-build <feature>`; không thì
  BACKLOG là bàn giao cho session sau.

## Bàn giao brainstorm — GHI RÕ 3 THỨ (BẮT BUỘC, trong proposal + báo thầy)

Mỗi lần brainstorm xong, KHÔNG chỉ tả chữ — proposal + tin nhắn chốt PHẢI nêu đủ:

1. **Prototype :8080 (HTML bấm-được)** — URL đang host + đường dẫn file (`.artifacts/prototypes/<feature>/index.html`). Đi luồng như slide, mọi state. (Layout = flow; nếu là 1 BLOCK lẻ → xem `starci-fe-block`, block CŨNG render prototype riêng.)
2. **BẢNG component → Storybook** — liệt kê BAO NHIÊU / component NÀO sẽ thêm/sửa story sau khi build (để thầy biết Storybook sắp phình gì):

   | Component | Story | Mới / Sửa | State demo thêm |
   |---|---|---|---|
   | `TabsCard` | `TabsCard.stories` | sửa | + state `overflow` |

3. **Nguồn tham khảo** — ground vào ĐÂU (liệt kê THẬT, không chung chung): `.artifacts/concepts/<x>` · `.artifacts/states/diff.md` (Storybook) · `.claude/fe/{axis-1-rules,axis-2-biz-ui,axis-3-layout}/RULES.md` · source `<file:line>` (+ `$BE_SOURCE\src` khi là surface DATA). **KHÔNG web** — thiếu thì đã hỏi thầy.

## Ràng (STRICT)

- **KHÔNG build code** — không sửa `src/`, không đẩy story; đó là `starci-fe-build`.
- **KHÔNG ghi `.claude/`** — rule read-only; mọi artifact động ghi `.artifacts/{prototypes,proposals}`.
- **KHÔNG tự ghi `.artifacts/states`** — `starci-fe-sync` giữ.
- **KHÔNG search web** — thiếu dữ kiện (concept trống, block lạ) → DỪNG hỏi thầy.
- **KHÔNG tự chế shell/primitive** — tra `.claude/fe/{axis-3-layout,axis-2-biz-ui}/RULES.md`; design mới không có trong canon → hỏi thầy.
- Routing là 1 phần layout: quyết "route rời vs query-param mode cùng shell" ngay trong proposal.
- Path FE = `$FE_SOURCE` (branch mtp; khai ở `$BE_SOURCE/.artifacts/config.json`)

## Bàn giao

- **BUILD proposal → `starci-fe-build`** (đọc `.artifacts/proposals/<feature>.proposal.md` → dựng → đẩy story
  "news" chờ duyệt → ✅ DONE trong BACKLOG).
- Chi tiết/style 1 block → `starci-fe-block` · states mới → `/starci-fe-sync` chạy sau build.
- Bản đồ canon: `.claude/fe/README.md`.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
