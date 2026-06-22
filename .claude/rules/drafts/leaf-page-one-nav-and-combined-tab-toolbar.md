# Draft — Trang leaf: 1 affordance điều hướng (không chồng breadcrumb + back), 2 nhóm tab gộp 1 toolbar (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (header/tabs) + [[tabscard-two-secondary-groups]] +
  **đính chính** [[header-gap2-and-breadcrumb-everywhere]] + `main.md` §14.
- Bối cảnh: trang giải challenge (`…/contents/<c>/challenges/<id>`) top bị **6 hàng chồng**: breadcrumb (layout
  `content/modules/layout.tsx`, dừng ở "Học phần") + "← Quay lại bài học" (ChallengePage) + title + chips + lang tabs
  + tab Đề/Nộp. Thầy: *"nhìn rối quá, tự dưng quay lại bài học nằm trên"*.

## Luật (STRICT)
- **Một trang chỉ 1 affordance điều hướng-lùi.** Nếu trang đã có **breadcrumb** (từ layout cha) thì ĐỪNG thêm
  back-link riêng (và ngược lại) — 2 thứ cùng vai = chồng, rối. Trang **leaf "giải đề"/làm-1-việc** (challenge solve)
  → ưu tiên **1 back-link chính xác** ("← Quay lại bài học" → về bài chứa nó) + **TẮT breadcrumb chung** (breadcrumb
  generic dừng ở "Học phần" không chỉ đúng leaf → vô nghĩa ở đây). → **đính chính** [[header-gap2-and-breadcrumb-everywhere]]
  ("MỌI trang /learn có breadcrumb"): **leaf solve page ngoại lệ** (giống canvas full-bleed) — dùng back-link thay vì
  breadcrumb. Cài: layout cha (`content/modules/layout`) check `useSelectedLayoutSegments().includes("challenges")` →
  bỏ render breadcrumb; ChallengePage giữ back-link.
- **2 nhóm tab cùng govern body → gộp 1 toolbar (1 hàng), KHÔNG xếp 2 hàng tab.** Hàng `flex justify-between border-b`:
  nhóm CHÍNH (đổi nội dung — vd Đề bài/Nộp bài) TRÁI, nhóm phụ (đổi cách trình bày — vd ngôn ngữ TS/Java/C#/Go) PHẢI.
  Cùng kiểu underline secondary. Ref [[tabscard-two-secondary-groups]] + ContentTabBar của lesson reader (Nội dung/Thử
  thách trái + ngôn ngữ phải). Xếp 2 hàng tab dọc = thừa tầng, rối.
- **Nguyên tắc tổng quát:** đếm số HÀNG NGANG ở top; mỗi hàng phải có 1 việc riêng. Gộp/cắt cho tới khi mỗi hàng
  không trùng vai hàng khác (nav · identity · toolbar). 6 hàng → 3 hàng (back · title+chips · toolbar tab|lang).

## ĐÃ ÁP DỤNG 2026-06-21 (Hướng A, thầy duyệt)
- `content/modules/layout.tsx`: `isChallenge = segments.includes("challenges")` → `!isChallenge` mới render breadcrumb.
- `ChallengeView`: gộp tab chính (Đề bài/Nộp bài) TRÁI + `ProgrammingLanguageTabs` PHẢI trên 1 `border-b` toolbar.
- Giữ "← Quay lại bài học" ở ChallengePage. tsc + lint sạch.
