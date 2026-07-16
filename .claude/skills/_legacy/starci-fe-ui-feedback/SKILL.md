---
name: starci-fe-ui-feedback
description: >
  Handle ONE ad-hoc, small piece of live UI feedback from the teacher — a screenshot (or a running preview) plus a
  short spoken rule ("tabs kiểu này phải full width", "spacing sai", "màu này lệch token") — for the MAIN StarCi
  Academy web app (`C:\Repositories\starci-academy`). Different from `starci-fe-ui-patch` (which SCANS broadly for
  code that drifted from an ALREADY-documented correction): this skill is the INTAKE — the rule may not be written
  down ANYWHERE in `.claude/fe/` yet. It locates the exact call-site the feedback points at, checks whether canon
  already covers it (drift bug → just patch) or the teacher just taught a NEW ruling (write it into canon FIRST,
  citing this concrete case, then patch), applies the fix same-session (small/mechanical scope only — a class, a
  prop, a token swap), verifies tsc/eslint + a preview re-check, and PUSHES the canon change to the private repo
  immediately (`starci-claude-canon`, per `.claude/CANON.md`'s update-loop rule). Escalates to `starci-fe-block-apply`
  / `starci-fe-layout-apply` / `fe/proposals/BACKLOG.md` when the fix turns out to be bigger than 1-2 call-sites.
  Trigger when the user types `/starci-fe-ui-feedback [note]`, or gives a quick screenshot + one-line correction about
  something currently on screen and wants it both fixed AND remembered as a rule.
---

# /starci-fe-ui-feedback — 1 câu feedback trực tiếp → fix ngay + ghi rule

Khác trục với `starci-fe-ui-patch` (scan RỘNG, tìm code lệch khỏi rule ĐÃ CÓ SẴN trong `fe/`): skill này là **cửa vào**
— thầy đang nhìn app CHẠY THẬT, chỉ tay vào 1 chỗ, nói 1 câu ("cái này phải full width", "màu sai", "gap lệch"). Rule
đó **CÓ THỂ CHƯA từng được ghi** ở đâu trong canon. Việc của skill: xác định ĐÚNG chỗ, tra xem rule đã có chưa, fix, và
**luôn luôn ghi/refresh lại canon** trước khi coi là xong — nếu không, feedback y hệt sẽ phải lặp lại ở surface khác.

## Input
- 1 câu feedback ngắn (tiếng Việt hoặc Anh) + optional 1-N ảnh chụp màn hình đính kèm trong CÙNG message, hoặc preview
  đang chạy sẵn (dùng preview MCP tools soi trực tiếp nếu không có ảnh). Không cần format — thầy nói tự nhiên thế nào
  cũng được, việc của skill là DIỄN GIẢI ra đúng component + đúng rule.

## Quy trình
1. **Định vị call-site THẬT** — từ ảnh/preview + route đang mở (URL trong ảnh, hoặc hỏi/tự suy từ ngữ cảnh hội thoại),
   grep tìm ĐÚNG component đang render vùng thầy chỉ. KHÔNG đoán mò — đọc source thật trước khi sửa (đúng file:line).
2. **Tra canon hiện có TRƯỚC khi tự chế** — grep `.claude/fe/{components,patterns,principles,foundations,layouts}/`
   cho từ khoá liên quan (tên block, "full width", "gap", tên token màu…):
   - **Đã có rule khớp, code chỉ LỆCH** → đây thực ra là ca `starci-fe-ui-patch` (code đúng-lúc-viết nhưng rule đã có
     từ trước bị bỏ sót, hoặc bug thường) — fix thẳng theo rule đã ghi, KHÔNG cần viết rule mới.
   - **Chưa có rule nào bàn đúng việc này** → đây là **rule MỚI thầy vừa dạy** — bước 3 áp dụng.
3. **Ghi/refresh canon TRƯỚC hoặc CÙNG lúc fix (không để sau)** — chọn nhà đúng theo taxon (`fe/README.md` §Taxonomy):
   token/nguyên liệu → `foundations/` · khung/vùng trang → `layouts/` · 1 element → `components/` · flow/recipe →
   `patterns/` · heuristic xuyên suốt → `principles/`. Viết theo giọng đã có của nhà đó (STRICT rule ngắn, ví dụ THẬT
   từ ca này, không lan man). Rule đã có nhưng cần siết thêm → thêm mục "Đính chính (ngày)" (mirroring
   `starci-fe-ui-patch`'s own signal) thay vì sửa xoá câu cũ, để lịch sử drift còn tra được.
4. **Fix code same-session (chỉ khi NHỎ/CƠ HỌC)** — 1-2 call-site, đổi class/prop/token, không đổi cấu trúc/IA. Bám
   ĐÚNG rule vừa tra/ghi ở bước 2-3, không tự thêm ý riêng ngoài câu feedback.
   - **Quy mô lớn hơn** (nhiều call-site rải nhiều feature, đổi cấu trúc/layout, cần quyết định thêm) → KHÔNG tự ôm —
     ghi `fe/proposals/<tên>.proposal.md` + dòng **PENDING** vào `fe/proposals/BACKLOG.md`, route sang
     `starci-fe-block-apply` (1 block) hoặc `starci-fe-layout-apply` (cả flow/trang) như các skill khác.
5. **Verify** — `npx tsc --noEmit` + `npm run lint` trên file đã sửa; nếu preview server đang chạy sẵn (chung dev
   server với trình duyệt thầy đang mở — kiểm qua `preview_logs` xem có phải cùng port/URL) thì Fast Refresh tự áp,
   không cần restart; báo thầy refresh tab để soi lại thay vì tự chụp ảnh hộ (thầy đang có browser thật, mình thường
   chỉ có preview MCP headless, có thể chưa đăng nhập).
6. **PUSH canon lên PRIVATE ngay** (`.claude/CANON.md` §RULE): `cd` vào bản clone `starci-claude-canon` (hoặc
   working-copy nếu chính nó là clone), copy/áp đúng thay đổi vào `fe/<nhà>/…`, `git add && git commit && git push`.
   Đây là bước BẮT BUỘC — canon local (`.claude/fe/`) chỉ là working copy, không tự sync ngược lên private nếu không
   commit tay. Business-sạch (không lộ `features/`/`product/`/proposal riêng tư) → cân nhắc thêm bước scrub → push
   PUBLIC (`starci-ai-design-system`) theo cùng rule, nhưng KHÔNG bắt buộc mỗi lần (làm khi rule đủ chín/tổng quát).

## ★ Tự phản biện TRƯỚC khi báo "đã sửa" (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`)
Chính bộ skill này là nơi cả chuỗi lỗi `CourseCard` 2026-07-14 xảy ra (danger→secondary→danger-soft; sửa `"line"` quên `"grid"`; 2 arrow cạnh nhau) — MỌI lỗi đều sửa đúng trong <1s SAU khi thầy chỉ, nghĩa là thiếu bước tự soát, không thiếu kiến thức. Trước khi báo xong:
- **Đọc HẾT section canon liên quan, không chỉ 1 rule vừa áp** — cái vừa sửa có phá rule KỀ BÊN trong cùng file không (arrow-mọi-CTA vs nút-không-icon-là-sub-CTA)?
- **Kiểm chứng bằng grep, không bằng lời kể** — sửa đụng ≥2 render-site giống nhau (2 layout branch…) → grep lại TẤT CẢ, đừng tin câu tự thuật "đã áp cho cả 2".
- **Đừng chốt ở lựa chọn đầu tiên** — cân nhắc điểm giữa (danger↔secondary còn danger-soft) trước khi trình.
- Tự hỏi thẳng: *"thầy sẽ chỉ chỗ nào tiếp?"* — trả lời được → sửa TRƯỚC, đừng để thầy phải chỉ.

## Ràng (STRICT)
- **KHÔNG tự nâng cấp ngoài đúng câu feedback** — sửa ĐÚNG cái thầy chỉ, không nhân tiện đổi thêm chỗ khác "cho đẹp".
  Thấy chỗ khác cũng lệch cùng rule → NÓI RA (liệt kê), để thầy quyết fix luôn hay để `starci-fe-ui-patch` quét full.
- **Không ghi rule mà không có ví dụ THẬT** (route/file/screenshot cụ thể) — rule mơ hồ không neo được ca thật sẽ
  không ai tra lại được sau này.
- **Đừng quên bước 6** — quên push = rule chỉ sống trong 1 session, biến mất khi context bị nén/kết thúc.

## Liên quan
- `starci-fe-ui-patch` (sibling — SCAN rule đã ghi để tìm code CÒN lệch, khác với skill này là ĐIỂM VÀO ghi rule mới).
- `starci-fe-block-brainstorm`/`starci-fe-block-apply` (khi feedback hoá ra cần thiết kế lại internals 1 block, không
  chỉ đổi 1 class) · `starci-fe-layout-brainstorm`/`starci-fe-layout-apply` (khi feedback hoá ra là vấn đề layout/flow
  cả trang) · `starci-doc-audit` (sức khoẻ tổng thể của canon — dead link, trùng lặp — chạy định kỳ, không phải mỗi
  lần feedback).
- Bản đồ canon: `.claude/fe/README.md` · quy trình push private/public: `.claude/CANON.md`.
