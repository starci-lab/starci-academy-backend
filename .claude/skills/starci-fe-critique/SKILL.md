---
name: starci-fe-critique
description: >
  Devil's-advocate BUSINESS critique of a feature/page/flow in the StarCi Academy product ("phản
  biện"). Grounds itself in the REAL source (BE logic + gates + loops + FE) via Explore agents, then
  fires DEEP business questions — value/demand loops, conversion (free→paid, upload-user→generate-user,
  viewer→enroller), demand generation, monetization fairness, retention/progression, two-sided
  (learner ↔ recruiter) value, abuse/gaming, positioning/defensibility — so the teacher can debate
  each and reach clarity ("thông suốt vấn đề"). It takes a pointed stance ("here's why this might be
  broken"), not neutral Q&A. Output = a structured critique doc of ENGLISH questions grouped by lens
  + the holes it found. NO code, NO UI styling — this interrogates the BUSINESS, not the pixels. Run
  with MAX reasoning effort (Opus). Trigger when the user types `/starci-fe-critique <feature>` or
  asks to phản biện / stress-test / challenge / interrogate a feature's business logic.
---

# /starci-fe-critique — Phản biện BUSINESS 1 tính năng (Opus · MAX effort)

Đóng vai **phản biện (devil's advocate)** cho 1 tính năng/trang/luồng: bắn **deep questions về BUSINESS** để thầy
**phản biện lại → thông suốt vấn đề**. KHÔNG bàn UI/pixel — soi **cơ chế KINH DOANH**: tính năng có tạo ra nhu cầu,
có chuyển đổi, có kéo về khóa, có công bằng, có bền không. **KHÔNG viết code.** CHẠY MAX EFFORT.

> Khác họ `/starci-fe-*-brainstorm` (vẽ UX/layout). Skill này KHÔNG vẽ — nó **chất vấn**. Mục tiêu: trước khi tốn công
> dựng, đảm bảo tính năng **đứng vững về business**. Ra sau brainstorm (đã có hướng) hoặc trước apply (ensure) đều được.

## Output = câu hỏi bằng ENGLISH (thầy phản biện)
- **Câu hỏi phản biện viết bằng ENGLISH** (thầy chốt: *"dịch phản biện sang english"*) — framing business bằng English
  cho sắc, ép trả lời chính xác. Thầy trả lời/bác lại bằng gì cũng được.
- Doc hướng dẫn + phần khung vẫn tiếng Việt; chỉ **các câu hỏi phản biện** là English.

## Nguyên tắc
- **GROUNDED — không phán suông.** Trước khi hỏi, PHẢI đọc source THẬT (BE logic: chấm/gate/loop/mutation + FE flow)
  để biết tính năng **thực sự hành xử ra sao**. Mỗi câu hỏi neo vào hành vi thật ("hiện tại upload được chấm bằng
  `CvScoringService` free, không debit credit → hỏi: …"). KHÔNG hỏi chung chung kiểu tư vấn.
- **Stance PHẢN BIỆN, không trung lập.** Mỗi câu = 1 đòn: nêu **giả thuyết nó có thể HỎNG/HỞ** rồi bắt thầy phản biện.
  "Here's why X might fail: …. Convince me it doesn't." — không phải "bạn nghĩ sao về X?".
- **Bám NORTH STAR StarCi:** cuối cùng mọi tính năng phải **kéo user học/enroll khóa** + **giữ [[fair-monetization-axiom]]**
  (học để kiếm bằng chứng thật, KHÔNG mua để tăng số). Câu hỏi phải soi: tính năng này có phục vụ vòng đó không, hay
  là nhánh cụt / vanity / lỗ hổng công bằng.
- **Business, KHÔNG UI.** Không hỏi "nút để đâu" (đó là layout skill). Hỏi "cơ chế này tạo demand/chuyển đổi/tiền/giữ
  chân ra sao, chỗ nào rò".
- **Ref-grounded khi cần:** cơ chế business (demand loop, two-sided marketplace, freemium conversion, hook model…)
  chưa chắc → `WebSearch`/`WebFetch` đọc nguồn thật (a16z/Reforge/Lenny/Hooked…) rồi neo câu hỏi vào 1 khung đã chứng
  minh, không bịa.

## Quy trình (MAX effort)
1. **Khoanh feature + chốt "BUSINESS JOB" thật của nó:** tính năng này rốt cuộc phải làm gì cho DOANH NGHIỆP (tạo
   demand? convert? giữ chân? mở giá trị cho phía trả tiền?). Viết 1 câu "job-to-be-done business".
2. **Research SONG SONG — spawn Explore agents (đừng đoán):**
   - **BE logic**: mutation/service/gate/loop THẬT phục vụ tính năng (vd chấm điểm, ngưỡng unlock, credit debit,
     entitlement, projection) — nó tính/quyết gì, free hay tốn tiền, gate theo gì.
   - **FE flow**: user đi qua các bước nào, CTA dẫn đâu, sau khi xong thì gì kéo họ đi tiếp.
   - **Business signals**: field/loop đã có mà chưa khai thác để tạo demand/convert (cơ hội) + chỗ đang là ngõ cụt.
3. **Bắn câu hỏi theo 8 LENS business (dưới)** — mỗi lens vài câu SẮC, grounded, có stance. Ưu tiên câu **lộ lỗ hổng
   thật** (nhánh cụt, không tạo demand, gaming được, không fair, không kéo về khóa).
4. **Tổng hợp "HOLES FOUND":** 3–7 lỗ hổng business lớn nhất (nếu thầy không phản biện nổi = phải sửa thiết kế).
5. **Output:** ghi **`<Feature>/CRITIQUE.md`** (English questions theo lens + holes) + tóm tắt chat (business job ·
   holes lớn nhất · lens nào yếu nhất). **KHÔNG code.**
6. **Widget (TÙY CHỌN, chỉ khi có LOOP/FUNNEL đáng vẽ):** nếu phản biện xoay quanh 1 vòng (vd upload→score→demand→
   generate→enroll) hay 1 phễu chuyển đổi → có thể vẽ 1 diagram vòng/phễu (`show_widget`, `read_me` module `diagram`)
   đánh dấu chỗ RÒ (nơi câu hỏi chỉ ra đứt mạch). Không bắt buộc — trọng tâm skill là CÂU HỎI, không phải hình.

## 8 LENS phản biện business (checklist — đừng bỏ lens nào)
1. **Business job & fit** — tính năng này job thật là gì? Có đúng là thứ business cần, hay "làm cho có"? Nếu bỏ nó,
   doanh nghiệp mất gì cụ thể?
2. **Demand-generation loop** — sau khi user DÙNG XONG (vd chấm CV xong), cái gì làm họ MUỐN bước tiếp? Kết quả có
   tự-sinh nhu cầu mới không (điểm thấp → muốn tạo CV tốt hơn → phải học)? Hay dùng xong là hết, không có hook?
3. **Conversion & funnel leak** — nó chuyển đổi ai thành ai? (free→paid · **upload-user → generate-user** ·
   viewer → enroller · 1 khóa → nhiều khóa). Chỗ nào rò? Vì sao user KHÔNG chuyển?
4. **Monetization & fairness** — kiếm tiền/mở giá trị chỗ nào? Có cách "mua để tăng số" (phá [[fair-monetization-axiom]])
   không? Có đẩy user về LÀM THẬT (học) thay vì trả tiền tắt không?
5. **Retention & progression** — nó đẩy user TIẾN trong hành trình học, hay là nhánh cụt/vòng lặp vô nghĩa? Lý do gì
   họ quay lại lần 2?
6. **Two-sided value (learner ↔ recruiter/employer)** — phía TRẢ TIỀN/giá trị (recruiter, doanh nghiệp) được gì? Tín
   hiệu (điểm/CV) có ĐÁNG TIN với họ không? Nếu điểm bịa/gaming được thì phía kia còn tin không?
7. **Abuse / gaming (business)** — user lách thế nào? (upload CV xịn của người khác để qua gate 70? spam tạo CV? 5 CV
   để "trông nhiều"?) Cơ chế có thưởng nhầm hành vi rỗng không?
8. **Positioning & defensibility** — tại sao user dùng cái này ở StarCi thay vì Canva/LinkedIn/Rezi? Điều gì StarCi có
   mà chỗ khác KHÔNG (bằng chứng từ khóa học)? Nếu thiếu cái đó thì tính năng có lý do tồn tại không?

## Ví dụ (thầy đưa — kiểu câu hỏi cần ra)
- *"If a user uploads an existing CV, how is it scored — and what stops them from uploading a polished CV that hides
  they've built nothing? If the score is trusted by recruiters, isn't upload a hole in the 'learn to earn proof' loop?"*
- *"After we score their CV, what concretely creates DEMAND to generate a new one? If the score is 58, does the UI make
  'generate from your course achievements' the obvious next move — or is scoring a dead-end?"*
- *"How do we convert an upload-user into a generate-user (the one that pulls them back into courses)? What's the exact
  moment + trigger, and why would they cross over instead of just re-uploading?"*

## Sau phản biện — KHÔNG phản biện được thì DỰNG LAYOUT + QUẤT SONNET WORKFLOW (thầy chốt 2026-07-05)
- **Nếu thầy phản biện lại được** 1 câu → tính năng chỗ đó đứng vững, ghi lại lập luận (có thể thành rule). Đi tiếp.
- **Nếu thầy KHÔNG phản biện được** 1 hole (thua) → hole đó thành **YÊU CẦU CỨNG phải sửa**. Quy trình chốt — **3 cổng
  TUẦN TỰ, KHÔNG được nhảy cóc sang workflow:**
  1. **Chốt resolution** (từ mục "Resolution directions" trong `CRITIQUE.md`) — chọn hướng vá lỗ (thầy chọn, hoặc uỷ
     quyền cho trò chọn hướng defensible nhất + bám [[fair-monetization-axiom]]/North Star). **Chờ thầy ĐỒNG Ý với kế
     hoạch phản biện** rồi mới sang bước 2.
  2. **CHẠY `/starci-fe-layout-brainstorm` để CHỐT LAYOUT (GATE BẮT BUỘC trước workflow).** Feed resolution vào skill
     layout-brainstorm → vẽ widget layout (ma trận state + phễu + cách-vá: mark "unverified", demand-bridge, …) →
     **thầy DUYỆT/CHỐT layout**. CHƯA có layout chốt = **CẤM** quất workflow. (Skill critique KHÔNG tự build; nó
     chuyển giao cho layout-brainstorm trước.)
     - **Layout phải phủ CẢ FEATURE, không patch 1 trang:** layout-brainstorm khoanh MỌI surface liên quan (xem/sửa/
       tạo/chi tiết) + rà URL scheme, quyết **"rời hay không rời"** (route riêng vs query-param mode cùng surface,
       vd `/cv/edit` → `?tab=cv&edit=true`) + hợp nhất thành 1 hệ nhất quán. ĐỪNG chốt layout lệch (1 trang đẹp,
       sibling chỏi). Đây là lỗi đã mắc: fix `?tab=cv` mà bỏ mặc `/cv/edit` phẳng cũ → lệch.
  3. **Layout đã chốt → XÚC: quất SONNET WORKFLOW** — author + chạy 1 `Workflow` **model sonnet** (kết hợp layout đã
     chốt + fix business từ critique) để IMPLEMENT: fan-out agent (BE fix gate/logic + FE dựng đúng layout đã chốt) →
     verify tsc/eslint. Spec viết rõ trong prompt agent (từ CRITIQUE resolution + LAYOUT doc đã duyệt), verify-heavy.
- **Thứ tự CỨNG:** critique-thua → thầy đồng ý resolution → **layout-brainstorm + thầy chốt layout** → *rồi mới* xúc
  workflow. ĐỪNG fire workflow ngay sau khi chọn resolution (bỏ qua bước chốt layout = sai quy trình).
- Nguyên tắc: **phản biện KHÔNG phải để nói suông — thua 1 hole = phải dựng + build, NHƯNG build sau khi layout chốt.**
  Critique → (rebut | resolution → **chốt layout** → build).

→ Thầy phản biện từng câu → thông suốt / lộ lỗ cần sửa (rebut = giữ · thua = dựng+build). **KHÔNG viết file `drafts/*.md` (thầy chốt 2026-07-06: tốn kém).** Nguyên tắc mới → cập nhật THẲNG canonical **v2** (`.claude/rules/{elements,layouts,responsives,concepts}/*.md`), CHỈ khi tái dùng thật + giữ ngắn.
