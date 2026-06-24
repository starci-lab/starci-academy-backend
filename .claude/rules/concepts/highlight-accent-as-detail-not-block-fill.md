# Concept — Highlight "của tôi/đang chọn" = accent ở CHI TIẾT, KHÔNG phải nền khối

> Heuristic (họ `concepts/*`). Rút từ Leaderboard: row "Bạn" + card "Hạng của bạn" đều `bg-accent/10` → 2 mảng hồng chồng = "hồng nguyên khối nhìn ghê" (thầy 2026-06-25).

## Quy tắc (STRICT)
- **Để đánh dấu "của tôi / đang chọn / nổi bật" trong 1 LIST, dùng accent ở CHI TIẾT NHỎ — KHÔNG tô `bg-accent/*` cả khối.** Chi tiết = **ring avatar** (`ring-2 ring-accent`), **chip** ("Bạn"), **giá trị/số** (`text-accent`), **icon** (crown). Nền row để trong suốt + chỉ `hover:bg-default-50`. Accent là GIA VỊ (điểm xuyết), không phải nền.
- **Vì sao:** accent (brand) thường rực (vd hồng StarCi). Tô `bg-accent/10` lên 1 khối đã đậm; tô lên ≥2 khối cạnh/chồng nhau → mắt thấy "mảng màu nguyên khối", nặng, kém sang. 1 màn chỉ nên có **vài điểm accent nhỏ**, không mảng nền lớn. (Ref design-restraint · minimum visual weight.)
- **Số/giá trị cũng đừng để accent HÀNG LOẠT.** Vd cột XP: chỉ row "của tôi" mới `text-accent`; các row khác `text-foreground`/muted. Nếu MỌI row đều accent → hết tác dụng phân biệt + rực cả cột.
- **Khối "bounded" được phép có nền nhạt accent khi nó là 1 ĐỐI TƯỢNG riêng nhỏ** (vd 1 chip, 1 badge, podium-pedestal của chính tôi) — nhưng vẫn là mảng NHỎ, không phải card/section lớn. Card/section lớn của "tôi" → border/ring + chi tiết accent, nền giữ `bg-surface`.
- **Đừng lặp cùng 1 thông tin ở 2 khối accent.** Vụ Leaderboard: sidebar đã hiện "XP của bạn theo hạng mục" → bỏ luôn `MyRankCard` (card accent breakdown bên phải lặp lại). 1 thông tin = 1 chỗ; bớt được 1 mảng accent.

## Áp đầu (2026-06-25)
- `Leaderboard`: bỏ `bg-accent/10` ở row viewer (chỉ ring avatar + chip "Bạn" + XP accent); XP accent chỉ cho row của tôi; bỏ `MyRankCard`/`XpBreakdown` (lặp sidebar). Podium pedestal của tôi = `bg-accent/15` (mảng nhỏ, OK). Ref [[concepts/whitespace-over-dividers]] (design restraint) + [[leaderboard-board-states-podium-champion]].
