# Concept — Multi-session chat (nhiều "cuộc hội thoại" có tên + search): session tách khỏi message, lazy-create, ẩn session rỗng, ownership check mọi op

> Heuristic engineering (họ `concepts/*`). Rút từ Content-AI: nhiều cuộc hội thoại per-bài (1 về nginx, 1 về kafka) + search lại sau, thay vì 1 thread phẳng/bài.

## Kiến trúc (STRICT)
- **Tách "phiên" (session) khỏi message:** bảng session (enrollment_id · origin_content_id · title nullable · timestamps); message thêm `session_id` (FK CASCADE, **nullable** cho synchronize-safe + backfill legacy). Message GIỮ id của "nguồn grounded cho turn đó" (KHÔNG bỏ) → 1 cuộc trải nhiều nguồn: mỗi turn nhớ nó hỏi về cái gì. Course-scoped vẫn key theo **enrollment** ([[course-scoped-data-joins-by-enrollment]]).
- **Auto-title từ câu hỏi ĐẦU** (`UPDATE ... SET title = COALESCE(title, $first), updated_at = now()` trong save-turn) — không gọi AI riêng để đặt tên. `updated_at` bump mỗi turn → recency-first.
- **Ownership check MỌI op** (resolve session JOIN enrollment WHERE user_id) — user không đụng session người khác. Mọi thao tác (save/load/delete) đều qua check này.
- **List vs search = 1 query** (`sessions(scopeId, search?)`): search rỗng → list theo scope hiện tại; search có → ILIKE title + message ACROSS toàn bộ scope của user (không giới hạn 1 nguồn) → trả kèm `snippet` (đoạn khớp) + tên nguồn gốc (cho cross-scope search result).
- **Response envelope `data` nullable** (mọi op) — [[envelope-response-data-must-be-nullable]].
- **Migration prod + synchronize dev:** session_id NULLABLE nên schema-change không vỡ rows cũ; migration backfill prod (1 session/scope legacy, title từ câu hỏi đầu).

## FE — gotchas khi quản session trong panel remount-mỗi-lần-mở
- **Session LAZY-create:** "cuộc mới" = `currentSessionId=null` + thread rỗng; session CHỈ tạo khi GỬI tin đầu tiên (tránh đẻ session rỗng mỗi lần user mở "cuộc mới" rồi đóng ngay). Sau create, set 1 ref hydrated=sessionId để hydrate-effect không clobber turn vừa gửi.
- **Hydrate theo SESSION (không theo nguồn/content):** query lịch sử keyed bởi sessionId; hydrate-once-per-session.
- **Reset thread CHỈ ở handler chuyển/mới (KHÔNG effect-on-[sessionId]):** create-mid-send cũng đổi sessionId → nếu reset trong effect-[sessionId] sẽ xoá turn vừa append. Đặt reset (setMessages([]) + hydratedRef) TƯỜNG MINH trong `onSwitch`/`onNew`. Ref [[selection-anchored-entry-and-intent-state]] (cùng họ bẫy "state ý định set trước khi mở, không reset lúc mount/effect").
- **Ẩn session RỖNG (lazy-created nhưng chưa có turn nào)** khỏi list + auto-select: `HAVING COUNT(message) > 0` ở query list — nếu không, session rỗng do lazy-create (gửi lỗi/abandoned) trở thành "mới nhất" → auto-open → user thấy "cuộc mới" trống mỗi lần F5. Nguyên tắc: "mở cái mới nhất" = mới nhất CÓ NỘI DUNG, ẩn orphan.
- **Auto-open most-recent session khi đổi nguồn/bài** — track "đã auto-select nguồn nào" bằng ref riêng (KHÔNG lẫn với `currentSessionId=null` của "cuộc mới", để không bị auto-override).
- **Delete = per-session ở list/drawer hội thoại** (nút × mỗi row) — search v1 scope trong-nguồn-hiện-tại là đủ; cross-scope search kèm route sang nguồn khác defer v2 (cần backend trả đủ field build route).

## Gotcha BE — cột dual-decorator (`@Column` + `@RelationId` cùng tên)
- **KHÔNG `find({ where })`/`select` trên cột mang CẢ `@Column` LẪN `@RelationId`** (TypeORM) — `@RelationId` là property ảo read-only, `where`/`select` trên nó dễ **throw runtime** dù insert/`@JoinColumn` vẫn ăn được. Fail này thường bị NUỐT bởi envelope-interceptor (trả `data:null`) → FE fallback `?? []` → trông như "rỗng" dù DB có data, ownership đúng — RẤT khó chẩn đoán. **Fix: dùng raw SQL** (hoặc query-builder trên cột thật) khi cần `where`/`select` trên cột đó.

## Gotcha BE — caller cầm ID khác loại (socket sub vs GraphQL uuid) phải decode TRƯỚC khi gọi service course-scoped
- Service course-scoped nhận `users.id` (uuid) thật; nếu 1 caller khác (socket gateway) chỉ cầm Keycloak `sub` (string khác dạng) mà KHÔNG decode trước → mọi JOIN `enrollments.user_id` khớp 0 dòng → **save/query no-op IM LẶNG** (không lỗi, chỉ không lưu được gì). **Fix: gateway PHẢI resolve `sub → users.id` TRƯỚC khi gọi service** (1 lookup, cache nếu cần). Đối xứng [[opaque-global-id-must-decode-before-raw-id-mutation]] (FE) + [[fe-swr-gate-must-match-be-enroll-guard]] (contract khớp) — nguyên tắc chung: **2 đường gọi cùng 1 service PHẢI truyền CÙNG 1 LOẠI id**, đừng để lệch loại giữa các caller.

## Liên quan
- [[overlay-from-popover-render-in-panel]] (overlay phụ mở từ trong panel chat này) · [[course-scoped-data-joins-by-enrollment]] · [[envelope-response-data-must-be-nullable]] · [[selection-anchored-entry-and-intent-state]].
