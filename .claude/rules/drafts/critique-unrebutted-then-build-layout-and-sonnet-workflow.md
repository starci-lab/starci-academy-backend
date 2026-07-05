# Draft — Phản biện business: THUA 1 hole (không phản biện được) → BẮT BUỘC dựng layout + quất Sonnet workflow build, KHÔNG nói suông (2026-07-05)

- File/§ đích khi `/merge`: `concepts/` (workflow/process) + skill `starci-fe-critique` + liên quan [[fair-monetization-axiom]] · skill `starci-fe-layout-brainstorm` · [[feedback-v2-workflow-cost-control]].
- Bối cảnh: `/starci-fe-critique` "CV upload & scoring" → lộ 5 hole (upload = cửa tắt qua vòng học→prove: recruiter unlock + job-readiness không cần học, chấm prose không cross-check, source-blind gate). Thầy: *"thầy thua rồi, trò tạo workflows (kết hợp ux layout brainstorm) và xúc"* + chốt rule *"không phản biện được thì dựng layout và quất workflows sonnet"*.

## Luật (STRICT)
- **Phản biện (`/starci-fe-critique`) là để RA QUYẾT ĐỊNH, không phải nói suông. Mỗi hole có đúng 2 ngã:**
  1. **Thầy PHẢN BIỆN được** → tính năng chỗ đó đứng vững → ghi lại lập luận (có thể thành rule) → giữ nguyên.
  2. **Thầy KHÔNG phản biện được (thua)** → hole thành **YÊU CẦU CỨNG** → **PHẢI dựng + build**, không để treo.
- **Quy trình khi THUA — 3 cổng TUẦN TỰ, KHÔNG nhảy cóc sang workflow (thầy chốt 2026-07-05):**
  - (a) **chốt resolution** từ mục "Resolution directions" của `CRITIQUE.md` (thầy chọn hoặc uỷ quyền trò chọn hướng defensible nhất, bám [[fair-monetization-axiom]]/North Star kéo-về-khóa) → **chờ thầy ĐỒNG Ý kế hoạch phản biện**.
  - (b) **CHẠY `/starci-fe-layout-brainstorm` → thầy CHỐT LAYOUT (GATE BẮT BUỘC).** Feed resolution vào layout-brainstorm → vẽ widget (ma trận state + phễu + cách-vá) → **thầy duyệt**. CHƯA chốt layout = **CẤM** quất workflow.
  - (c) **layout đã chốt → XÚC: quất Sonnet WORKFLOW** kết hợp layout-đã-chốt + fix business → fan-out (BE fix logic + FE dựng đúng layout) → verify tsc/eslint. Spec rõ trong prompt (từ CRITIQUE resolution + LAYOUT doc đã duyệt), **verify-heavy, KHÔNG fire-and-forget mù**.
- **Thứ tự CỨNG:** critique-thua → thầy đồng ý resolution → **layout-brainstorm + chốt layout** → *rồi mới* xúc. ĐỪNG fire workflow ngay sau khi chọn resolution (bỏ bước chốt layout = sai quy trình). (Lỗi đã mắc lần đầu 2026-07-05: xúc ngay sau resolution, chưa chốt layout — sửa quy trình lại.)
- **Model = Sonnet** cho workflow implement (thầy chốt). Giữ [[feedback-v2-workflow-cost-control]] (≤2 heavy song song, verify COUNT).
- **Vì sao:** critique mà thua rồi để đó = tính năng ship với lỗ hổng đã biết (tệ hơn không critique). Bắt "thua → build" biến phản biện thành cơ chế cải thiện thật, không phải bàn cho vui.

## Áp đầu (2026-07-05)
- CV upload & scoring: thầy thua → resolution = **gate/pillar verified-only** (chỉ `source=generated` tính vào recruiter-gate + job-readiness) + FE mark uploaded "chưa xác minh · chưa tính điểm" + demand-bridge "Tạo CV từ thành tích để tính điểm →" + empty-state phễu-khóa (V3 §10). Dựng qua Sonnet workflow (BE gate fix + FE layout). Doc: `CV/CRITIQUE.md` + `CV/UX-BRAINSTORM-V3-LAYOUT.md` §10.
