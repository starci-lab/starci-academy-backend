# Concept — Selection-anchored entry point ("Hỏi AI về đoạn này") + state "ý định" set trước khi mở surface KHÔNG được reset lúc mount

> Heuristic engineering (họ `concepts/*`). Rút từ trợ giảng Content-AI: bôi đen 1 đoạn trong bài đọc → nút nổi mở chat scoped theo đoạn đó (kiểu NotebookLM source-anchored).

## Phần 1 — Selection-anchored entry (STRICT)
- **Nghe `window.getSelection()` TRONG ĐÚNG SCOPE đọc** (vd `#lesson-article`), KHÔNG toàn trang: `mouseup`/`touchend` → chỉ hiện nút khi `range.commonAncestorContainer` nằm trong scope + text đủ dài (vài ký tự trở lên).
- **Nút nổi = `createPortal(document.body)` + `position:fixed`** tại `range.getBoundingClientRect()` (trên đỉnh vùng chọn), z TRÊN FAB nhưng DƯỚI panel mở ra. **`onMouseDown preventDefault`** trên wrapper nút để giữ selection sống tới khi click bắn (mousedown thường collapse selection trước click). Ẩn nút khi: selection collapse (`selectionchange`), scroll/resize (rect trôi).
- **Truyền "đoạn đã chọn" qua OVERLAY STORE (data string)**, KHÔNG nâng React state/portal data — nút set + mở panel; panel đọc từ store. Panel remount mỗi lần mở (popover/drawer) nên state phải sống NGOÀI cây component của panel.
- **Đưa đoạn vào model = PREPEND quote (cap ~200 ký tự) vào câu hỏi** khi grounding đã có full body sẵn — quote chỉ để "trỏ" đúng đoạn, không cần gửi cả đoạn riêng.
- **Khoá premium tự nhiên đúng:** vùng đọc `select-none` khi locked → không select được → nút không bao giờ hiện trên nội dung premium chưa mở (khớp gate AI tự nhiên, không cần check riêng).

## Phần 2 — State "ý định" set TRƯỚC khi mở 1 surface KHÔNG được reset lúc MOUNT (STRICT, tổng quát hơn phần 1)
- **Bẫy:** panel (popover/drawer) **remount mỗi lần mở** → effect "reset theo nguồn" chạy LẠI lúc mount. Nếu nhét `setIntent(null)` vào effect reset-theo-content thì **giá trị vừa set NGAY TRƯỚC khi mở bị xoá lúc mount** → tính năng chết câm (không lỗi, chỉ mất tác dụng).
- **Fix: tách riêng effect, dùng prev-value ref** — `useEffect` với `prevSourceRef` → chỉ reset khi `prev !== undefined && prev !== source` (nguồn ĐỔI THẬT), KHÔNG lúc mount.
- **Nguyên tắc tổng quát:** state "ý định" (selection/draft/pending-action…) được set TRƯỚC khi 1 surface MỞ, thì surface đó KHÔNG được reset nó trong effect-on-mount — chỉ reset theo THAY ĐỔI NGUỒN thật (track prev-value qua ref). Áp cho MỌI panel remount-per-open cần nhận 1 giá trị "vừa set từ bên ngoài".
- Cùng họ bẫy: reset thread chat CHỈ ở handler chuyển/tạo mới TƯỜNG MINH (`onSwitch`/`onNew`), KHÔNG trong effect-on-[sessionId] (create-mid-send cũng đổi id → effect sẽ xoá turn vừa append nếu đặt reset trong effect).

## Liên quan
- [[content-reaction-footer-and-frameless-discussion]] (shared SWR key cross-tree, cùng họ "share state qua nguồn ngoài cây component") · [[when-drawer]] (panel/drawer overlay).
