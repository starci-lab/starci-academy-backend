# Concept — Phản biện business: THUA 1 hole (không phản biện được) → BẮT BUỘC dựng layout + quất Sonnet workflow build, KHÔNG nói suông

> Heuristic workflow/process (họ `concepts/*`). Thầy chốt 2026-07-05 (vụ critique "CV upload & scoring"): *"không phản biện được thì dựng layout và quất workflows sonnet"*. Bổ trợ [[fair-monetization-axiom]] · skill `starci-fe-critique` · `starci-fe-layout-brainstorm` · `starci-fe-ux-apply`.

## Luật (STRICT)
- **Phản biện (`/starci-fe-critique`) là để RA QUYẾT ĐỊNH, không nói suông. Mỗi hole có đúng 2 ngã:**
  1. **Thầy PHẢN BIỆN được** → tính năng chỗ đó đứng vững → ghi lại lập luận (có thể thành rule) → giữ nguyên.
  2. **Thầy KHÔNG phản biện được (thua)** → hole thành **YÊU CẦU CỨNG** → **PHẢI dựng + build**, không treo.
- **Quy trình khi THUA — 3 cổng TUẦN TỰ, KHÔNG nhảy cóc:**
  - (a) **chốt resolution** từ mục "Resolution directions" của `CRITIQUE.md` (thầy chọn / uỷ quyền trò chọn hướng defensible nhất, bám [[fair-monetization-axiom]]/North Star kéo-về-khóa) → **chờ thầy ĐỒNG Ý kế hoạch**.
  - (b) **CHẠY `/starci-fe-layout-brainstorm` → thầy CHỐT LAYOUT (GATE BẮT BUỘC).** Feed resolution vào layout-brainstorm → vẽ widget (ma trận state + phễu + cách-vá) → **thầy duyệt**. CHƯA chốt layout = **CẤM** quất workflow.
  - (c) **layout đã chốt → XÚC: quất Sonnet WORKFLOW** kết hợp layout-đã-chốt + fix business → fan-out (BE fix logic + FE dựng đúng layout) → verify tsc/eslint. Spec rõ trong prompt (từ CRITIQUE resolution + LAYOUT doc đã duyệt), **verify-heavy, KHÔNG fire-and-forget mù**.
- **Thứ tự CỨNG:** critique-thua → thầy đồng ý resolution → **layout-brainstorm + chốt layout** → *rồi mới* xúc. ĐỪNG fire workflow ngay sau khi chọn resolution (bỏ bước chốt layout = sai quy trình).
- **Model = Sonnet** cho workflow implement. Giữ ≤2 heavy song song, verify COUNT (không fire-and-forget mù).
- **Vì sao:** critique thua rồi để đó = tính năng ship với lỗ hổng đã biết (tệ hơn không critique). Bắt "thua → build" biến phản biện thành cơ chế cải thiện thật.

## Liên quan
- [[fair-monetization-axiom]] (resolution bám North Star) · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (layout gate phủ ma trận state + phễu) · skill `starci-fe-critique` / `starci-fe-layout-brainstorm` / `starci-fe-ux-apply`.
