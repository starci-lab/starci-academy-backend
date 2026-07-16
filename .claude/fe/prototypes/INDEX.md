# INDEX — Prototypes (flow prototype bấm-được, host :8080)

> Nhà của **prototype HTML clickable** cho skill `/starci-fe-layout-brainstorm` (bước 8). Mỗi prototype = 1 FLOW feature
> dạng HTML self-contained — bấm đi luồng như slide pptx (nav Prev/Next + click CTA/zone toggle state/pha/mode +
> desktop↔mobile). Đây là **công cụ bền** (khác instance ephemeral ở scratch): kit nâng dần + bản mẫu tra lại được.

## Kit (tái dùng — UPGRADE in-place)
- **`_TEMPLATE.html`** — khung tái dùng: nav steps · toggle state/mobile · wireframe primitive theo token (`fe/foundations/color`) · nhãn conversion-lens (◆CTA ◆tâm-lý ◆phễu) · comment "cách điền màn". **Cải khung ở đây 1 lần → mọi prototype sau kế thừa.**

## Instances (bản mẫu đã dựng)
| Flow | File | Shell chính | Trạng thái |
|---|---|---|---|
| Mock Interview — setup→interview→grading→scorecard | `mock-interview.html` | interview = full-bleed 2-pane ([[full-bleed-work-surface]]) | ✅ blueprint · **element-aware** (khối = block thật) · chờ duyệt → build |
| Flashcards "Hỏi nhanh" — setup→active(cloze)→recap→empty | `flashcard-interview-flow.html` | setup/recap = centered `max-w-3xl` · active = rộng hơn (1-cột, không 2-pane) | ✅ duyệt 2026-07-08 → chốt `../proposals/flashcard-interview-setup-and-shell.proposal.md` |

## Dựng prototype mới (trong skill)
1. `cp _TEMPLATE.html ../../../<scratch>/<feature>-flow/index.html` (hoặc lưu bản mẫu `fe/prototypes/<feature>.html`), điền màn theo comment.
2. Đổi `total` + `names[]` (JS) + `<title>` + tên feature; mỗi surface/pha = 1 `.screen`; đánh dấu lens đúng vùng.
3. Host: `python -m http.server 8080 --directory <thư mục file>` → đưa URL cho thầy bấm.
4. Bản đáng giữ → lưu `fe/prototypes/<feature>.html` + **thêm 1 dòng vào bảng Instances trên**.

## Quy ước
- Instance riêng-1-lần → để scratch (ephemeral). Instance làm **ví dụ/tái dùng** → lưu đây + ghi map.
- KHÔNG hardcode màu ngoài `:root` (mirror token). Giữ self-contained (không external).
