# Concept — FE SWR gate phải KHỚP BE guard: bỏ `enrolled` khỏi key khi BE đã mở cho trial

> Heuristic engineering (họ `concepts/*`, contract FE↔BE). Cùng họ với [[opaque-global-id-must-decode-before-raw-id-mutation]] + [[envelope-response-data-must-be-nullable]] (contract/lỗi ngầm FE↔BE) + [[premium-gate-is-enrollment-not-vip]].

## Luật (STRICT)
- **Khi BE gỡ enroll-guard cho 1 surface (mở cho trial), FE SWR hook của surface đó PHẢI bỏ `enrolled` khỏi ĐIỀU KIỆN gate key.** Nếu không, query không bao giờ fire cho non-enrolled → UI rỗng "ngầm" (không lỗi, không empty thật, chỉ là chưa fetch). FE gate phải **đồng bộ** với BE guard; lệch = data có mà không hiện.
- **Dấu hiệu:** 1 đại lượng đếm (header `numChallenges`, badge) hiện ra N nhưng list/tab tương ứng RỖNG → nghi FE gate chặn fetch (enrolled/permission) trong khi nguồn đếm đi đường khác (outline/projection không gate).
- **Giữ login gate (`authenticated`), bỏ `enrolled`.** Premium content vẫn được bảo vệ bằng lock tab + content gate (locked lesson → tab khoá, không mở tới query) nên bỏ `enrolled` KHÔNG lộ premium.
- **Giữ `enrolled` trong KEY ARRAY** (cache var) để refetch khi enroll đổi — chỉ bỏ khỏi ĐIỀU KIỆN gate (tránh unused var + vẫn revalidate đúng).
- **Caveat:** nếu service BE submit/grade còn giả định enrollment (scope/attempt) thì trial nộp có thể lỗi runtime → phải làm service enrollment-optional. Verify runtime cho guest, đừng dừng ở tsc.

## Liên quan
- [[premium-gate-is-enrollment-not-vip]] (trial = free-enroll đọc được) · [[opaque-global-id-must-decode-before-raw-id-mutation]] · [[envelope-response-data-must-be-nullable]] (cùng họ contract/lỗi ngầm FE↔BE) · [[fe-change-touching-backend-must-verify-backend-runtime]] (verify runtime cho guest).
