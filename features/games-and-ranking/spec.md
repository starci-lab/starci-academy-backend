# Trò chơi, bảng xếp hạng và streak

> Business head: `f7e3f0e86a9da6dd42a03b860cd99bae2b3f29ec20e62ce017f7543e6ec0c379`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên chọn một trong bốn trò chơi, chơi solo/couple/team theo mode được hỗ trợ, xem standing global/friends và dùng Coin mua streak freeze theo giới hạn.

Included:
- Game hub
- Bốn game catalog
- Solo/couple/team modes
- Private friends room
- Global/league standing
- Streak freeze purchase

Excluded:
- Course leaderboard
- Shop catalog ngoài streak freeze

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Chọn game/mode
- Tạo hoặc vào room bạn bè
- Xem leaderboard
- Mua streak freeze

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 4. Entry points and surfaces

### Game hub

- ID: `game-hub`
- Route: `/[lang]/game`
- Purpose: Chọn game và mode hỗ trợ.
- Regions: `game-hub-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`

### Bảng xếp hạng

- ID: `global-league`
- Route: `/[lang]/league`
- Purpose: Xem standing toàn cục và vị trí của viewer.
- Regions: `global-league-content`
- Navigation: none

Evidence: `EV-001`, `EV-005`

## 5. Business flows

### Chơi game và xem thứ hạng

Trigger: Học viên mở Game hoặc League.

1. **learner** — Chọn game, mode và phòng. → Game runner mở hoặc lỗi quyền/room được báo.
2. **learner** — Mở league. → Standing của viewer và leaderboard được hiển thị.

Outcomes:
- Kết quả của mỗi player được lưu
- Multiplayer yêu cầu membership hoạt động
- Freeze chỉ mua khi đủ Coin và chưa chạm trần

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 6. Business rules

### BR-01

Catalog hiện có vocab_defense, vocab_race, match_pairs và couple_quiz với mode riêng cho từng game.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Bạn bè có membership hoạt động có thể vào cùng private room; kết quả của cả hai được lưu, còn member không hoạt động bị từ chối.

Strength: **confirmed** · Evidence: `EV-003`

### BR-03

Mua streak freeze ghi nợ Coin và tăng inventory nguyên tử; chạm trần hoặc thiếu Coin không được ghi nợ.

Strength: **confirmed** · Evidence: `EV-004`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`, `EV-002`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 8. Entities and data

- **Trò chơi**: id, title, description, cover, modes — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Phòng game**: roomId, mode, players, phase, sessionId — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Kết quả game**: user, game, score, season — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Thứ hạng**: user, points, rank, isFollowing — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 9. Operations and APIs

- **Colyseus joinOrCreate/joinById** (command, provider) — input: token, game id, mode, character, room code; output: roomId, sessionId, shared state; failures: Inactive membership, Unknown room — `EV-003`, `EV-004`, `EV-005`
- **globalLeaderboard** (query, frontend) — input: authenticated learner; output: myRank, myPoints, entries; failures: GraphQL error — `EV-003`, `EV-004`, `EV-005`

## 10. Acceptance conditions

- **AC-01** Chỉ hiển thị mode được khai báo cho từng game; multiplayer từ chối membership không hoạt động. — `EV-001`, `EV-002`, `EV-003`
- **AC-02** League phải phân biệt pending/ready/empty/failed. — `EV-001`, `EV-005`

## 11. Explicit unknowns

- **Surface game sẽ diễn đạt và bán membership khi multiplayer bị khóa như thế nào?** — Không tự thêm upsell hoặc giá vào game hub ngoài quyền từ chối đã được backend chứng minh.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:7` | route | Frontend khai báo Game và Pricing routes. |
| EV-002 | fe | `src/modules/games/catalog.ts:3` | ui | Frontend khai báo bốn game và các mode được hỗ trợ với nội dung Vietnamese hiện tại. |
| EV-003 | be | `test/e2e/colyseus-friends-room.e2e-spec.ts:248` | test | Hai friend có quyền vào cùng room, hoàn tất và lưu hai result; inactive membership bị từ chối. |
| EV-004 | be | `test/e2e/streak.e2e-spec.ts:112` | test | Mua streak freeze debit Coin và credit inventory; cap/insufficient Coin không tạo thay đổi một phần. |
| EV-005 | fe | `src/modules/api/graphql/queries/query-global-leaderboard.ts:6` | api | Frontend đọc standing của viewer và các entries global với rank, points và follow state. |
