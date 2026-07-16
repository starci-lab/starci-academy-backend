# Concept — 1 item fail trong 1 loạt fetch song song KHÔNG được đọc thành "rỗng"

> Heuristic engineering (họ `concepts/*`, FE data-fetch resilience). Rút từ vụ Flashcards "Hỏi nhanh" (`InterviewSession.startSession`, 2026-07-08): 1 deck `FLASHCARD_DECK_NOT_FOUND_EXCEPTION` → UI hiện nhầm "Chưa có thẻ ở cấp độ này".

## Root cause
`startSession` pool hoá cards từ N deck bằng `Promise.all(decks.map(...queryFlashcardDeck))`. `queryFlashcardDeck` không throw khi resolver trả `success:false` (envelope pattern chuẩn, xem [[envelope-response-data-must-be-nullable]]) — code cũ đọc `response.data?.flashcardDeck.data?.cards ?? []`, nuốt luôn lỗi thành mảng rỗng. Khi TOÀN BỘ N deck cùng fail (vd do drift 2-nguồn dữ liệu — xem `elasticsearch-sync` ở BE), pool rỗng y hệt trường hợp "lọc theo level ra 0 thẻ" → UI hiện chung 1 `EmptyState` "hết thẻ ở cấp độ này", SAI (gợi ý đổi filter trong khi lỗi là fetch fail).

## Luật (STRICT)
- **Fetch song song N item độc lập (mỗi item có thể fail riêng) → track fail riêng, ĐỪNG nuốt bằng `?? []`/`?? null` rồi coi kết quả gộp là "rỗng thật".** Dùng `Promise.allSettled`, giữ `anyItemFailed` bên cạnh kết quả gộp.
- **Phân biệt 2 loại "rỗng" ở UI:** (a) **rỗng-thật** (fetch OK, filter/logic hợp lệ ra 0 kết quả) → `EmptyState` bình thường, CTA đổi điều kiện lọc. (b) **rỗng-do-fail** (≥1 fetch lỗi khiến kết quả gộp trống) → `ErrorContent` (title/description khác, nút "Thử lại" gọi lại hàm fetch), KHÔNG gợi ý đổi filter — điều kiện lọc không phải nguyên nhân.
- **Fail 1 phần (không phải toàn bộ) vẫn cho qua** — pool vẫn build từ các item fetch OK, không chặn cả flow vì 1 item lỗi (fault-tolerant theo từng phần), chỉ escalate thành lỗi hiển thị khi kết quả gộp CUỐI CÙNG rỗng VÀ có fail thật.

## Bối cảnh liên quan (vụ cụ thể)
- Nguồn drift 2 phía ở BE: `flashcardDecksByCourse` (danh sách, Postgres) vs `flashcardDeck(id)` (full-card, Elasticsearch qua `FlashcardDeckReadService.getById`) — deck có ở DB nhưng chưa index ES → 404 kiểu "not found" dù deck THẬT sự tồn tại. Xem [[elasticsearch-sync]] (BE concept) để re-sync/reconcile.

## Liên quan
[[envelope-response-data-must-be-nullable]] (cùng họ "lỗi bị nuốt/che ở lớp envelope") · [[elasticsearch-sync]] (BE, nguồn drift cụ thể của vụ này) · `patterns/asynccontent-remove-debug-hold` (priority error→loading→empty→content — nguyên tắc chung, đây là ca fetch-song-song không qua 1 SWR đơn).
