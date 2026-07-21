# Feature — MindMap
> Bản đồ trực quan (xyflow) toàn khóa: module → nội dung, xem toàn cảnh và nhảy nhanh vào 1 node. Nguồn: `features/learn/MindMap`.

- **Job**: định hướng "tôi đang ở đâu trong cả khóa" bằng canvas thay vì cây text → shell [[fullbleed-canvas-no-chrome-and-orient-zoom]] đúng nghĩa: `h-[calc(100dvh-4rem)]` full-bleed dưới navbar, KHÔNG breadcrumb/PageHeader — canvas tự lo định hướng bằng chính nó (zoom/fit controls + node "đang ở đây").
- **CTA**: 1 nút nổi PRIMARY duy nhất — `MindMapContinueButton` (`Panel position="top-center"`, pill `rounded-full`) resume thẳng tới `nextContentTask` (content-first, không nhảy capstone); tự đổi thành ghi chú "Đã học hết" (`text-success`, không phải nút) khi hết nội dung; tự ẩn hoàn toàn cho guest chưa có resume. → [[call-to-action]]
- **Links (onward)**: click 1 node = điều hướng thẳng vào module/content đó — canvas CHÍNH LÀ điều hướng, không có link phụ nào khác ra ngoài trang. → [[content-linking]]
- **Psychology**: nút nổi TRÊN canvas (không phải trong 1 header cố định) giữ đúng nguyên tắc "affordance nằm đúng nơi mắt đang nhìn" — no header nghĩa là CTA phải tự tìm chỗ đứng, không mất tích; single primary action = zero-choice friction cho lối vào nhanh nhất. → [[persuasion-psychology]]
- **Ghi chú**: ví dụ SẠCH cho [[fullbleed-canvas-no-chrome-and-orient-zoom]] — không có PageHeader, không rail phụ; toàn bộ layout-brief chỉ còn 1 câu hỏi "node nào là hiện tại" (camera default nên orient vào đó, không fit-all — cần soát riêng ở `MindMapCanvas`/hook fit-view, chưa đọc sâu ở đây).
