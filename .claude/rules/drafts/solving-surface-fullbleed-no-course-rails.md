# Draft — Bề mặt "giải đề"/làm việc tập trung (challenge) = full-bleed, BỎ rail nav khóa học (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (layout/canvas) + [[fullbleed-canvas-no-chrome-and-orient-zoom]] + `main.md` §14.
- Bối cảnh: trang giải 1 challenge (`…/contents/<id>/challenges/<id>`) bị **chật**: layout vẫn bật `ContentMap`
  rail (cây nội dung ~320px) + OnThisPage VÌ `segments.includes("modules")`, trong khi `ChallengeView` đã là 2 cột
  (brief 2/5 · các bước 3/5) → cột brief bị bóp. Thầy: *"sửa trang này hơi chật"*.

## Luật (STRICT)
- **Trang là "bề mặt giải/làm việc tập trung trên 1 item" (challenge solve, code lab…) = full-bleed, BỎ rail điều
  hướng khóa học** (cây nội dung + on-this-page). Người học vào đây để **giải 1 đề**, không duyệt khóa → nhồi cây
  module/bài vào chỉ bóp vùng làm việc. Giống trang giải LeetCode/Exercism: chỉ có đề + vùng nộp, KHÔNG kèm nav site.
  Ref [[fullbleed-canvas-no-chrome-and-orient-zoom]] (mind-map canvas cũng full-bleed bỏ chrome — cùng họ "trang chiếm
  trọn viewport, tự lo định hướng riêng").
- **Điều hướng lùi phải CÓ và rõ trên chính trang đó.** Bỏ rail chỉ OK khi trang tự có đường về: challenge có nút
  **"← Quay lại bài học"** (`ChallengePage` `onBack` → bài chứa nó). Cây đầy đủ sống ở trang bài học; luồng = bài →
  giải (tập trung) → quay lại → chọn item khác. Lùi 1 bước, không cụt.
- **Icon rail mảnh (LearnSidebar) GIỮ** (nó là `<aside>` cố định của `LearnShell`, không phải `leftRail` prop) → vẫn
  chuyển surface được. Chỉ bỏ `leftRail`/`rightRail` (rail nội dung) + bật `fullBleed`.
- **Phân biệt với trang ĐỌC:** lesson reader (đọc bài) GIỮ cây nội dung + on-this-page (đang duyệt/đọc, cần cây).
  Chỉ leaf "giải đề" mới full-bleed. Cùng `segments.includes("modules")` nhưng `segments.includes("challenges")` →
  override thành full-bleed.

## ĐÃ ÁP DỤNG 2026-06-21 (thầy duyệt — PA1)
- `learn/layout.tsx`: thêm `isChallenge = segments.includes("challenges")` → `leftRail=undefined`,
  `rightRail=undefined`, `fullBleed = isMindMap || isChallenge`. KHÔNG đụng `ChallengeView` (cột brief tự giãn khi
  hết rail). Giữ nút "Quay lại bài học" sẵn có.
- Bỏ ngỏ (hỏi sau): có cần làm nút "Quay lại bài học" nổi hơn (link nhỏ → button) không.
