# Flow · Chơi game và xem thứ hạng

> ID: `play-and-rank` · Trigger: Học viên mở Game hoặc League.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `learner` | `game-hub` | Chọn game, mode và phòng. | Game runner mở hoặc lỗi quyền/room được báo. |
| 2 | `learner` | `global-league` | Mở league. | Standing của viewer và leaderboard được hiển thị. |

## Outcomes

- Kết quả của mỗi player được lưu
- Multiplayer yêu cầu membership hoạt động
- Freeze chỉ mua khi đủ Coin và chưa chạm trần

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
