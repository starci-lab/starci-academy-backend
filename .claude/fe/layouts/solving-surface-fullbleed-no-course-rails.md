# Concept — Bề mặt "giải đề"/làm-1-việc tập trung (challenge solve) = full-bleed, BỎ rail nav khóa học

> Heuristic (họ `concepts/*`). Cùng họ [[fullbleed-canvas-no-chrome-and-orient-zoom]] (trang chiếm trọn viewport, tự lo định hướng riêng). Quyết định rail ở [[when-rail]].

## Quy tắc (STRICT)
- **Trang là "bề mặt giải/làm việc tập trung trên 1 item" (challenge solve, code lab…) = full-bleed, BỎ rail điều hướng khóa học** (cây nội dung + on-this-page). Người học vào đây để **giải 1 đề**, không duyệt khóa → nhồi cây module/bài vào chỉ bóp vùng làm việc. Giống trang giải LeetCode/Exercism: chỉ có đề + vùng nộp, KHÔNG kèm nav site.
- **Điều hướng lùi phải CÓ và rõ trên chính trang đó.** Bỏ rail chỉ OK khi trang tự có đường về: challenge có **back-link** ("← Quay lại bài học" → về bài chứa nó, [[elements/header]] §3). Cây đầy đủ sống ở trang bài học; luồng = bài → giải (tập trung) → quay lại → chọn item khác. Lùi 1 bước, không cụt.
- **Icon rail mảnh (LearnSidebar) GIỮ** (nó là `<aside>` cố định của `LearnShell`, không phải `leftRail` prop) → vẫn chuyển surface được. Chỉ bỏ `leftRail`/`rightRail` (rail nội dung) + bật `fullBleed`.
- **Phân biệt với trang ĐỌC:** lesson reader (đọc bài) GIỮ cây nội dung + on-this-page (đang duyệt/đọc, cần cây). Chỉ leaf "giải đề" mới full-bleed. Cùng route pattern (`segments.includes("modules")`) nhưng `segments.includes("challenges")` → override thành full-bleed.
- **Phân biệt tab (query param) vs route segment:** `?tab=challenges` = query param (đổi client-side trong cùng trang reader — VẪN giữ rail) — KHÁC trang SOLVE `…/challenges/<id>` (route segment → full-bleed). Đừng nhầm 2 thứ.

## Liên quan
- [[fullbleed-canvas-no-chrome-and-orient-zoom]] (canvas full-bleed) · [[when-rail]] (khi nào dùng rail) · [[leaf-page-one-nav-and-combined-tab-toolbar]] (1 affordance lùi) · [[elements/header]] (back-link slot).
