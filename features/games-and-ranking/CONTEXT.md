# Trò chơi, bảng xếp hạng và streak

> Business identity: `miamia/games-and-ranking@f7e3f0e86a9da6dd42a03b860cd99bae2b3f29ec20e62ce017f7543e6ec0c379`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên chọn một trong bốn trò chơi, chơi solo/couple/team theo mode được hỗ trợ, xem standing global/friends và dùng Coin mua streak freeze theo giới hạn.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Kết quả của mỗi player được lưu

**Never does.** Course leaderboard

## Invariants

- `BR-01` — Catalog hiện có vocab_defense, vocab_race, match_pairs và couple_quiz với mode riêng cho từng game.
- `BR-02` — Bạn bè có membership hoạt động có thể vào cùng private room; kết quả của cả hai được lưu, còn member không hoạt động bị từ chối.
- `BR-03` — Mua streak freeze ghi nợ Coin và tăng inventory nguyên tử; chạm trần hoặc thiếu Coin không được ghi nợ.

## Primary flow

```text
pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `game-hub` | `/[lang]/game` | Chọn game và mode hỗ trợ. | [surface](surfaces/game-hub.md) |
| `global-league` | `/[lang]/league` | Xem standing toàn cục và vị trí của viewer. | [surface](surfaces/global-league.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Colyseus joinOrCreate/joinById` | provider | token, game id, mode, character, room code | roomId, sessionId, shared state |
| `globalLeaderboard` | frontend | authenticated learner | myRank, myPoints, entries |

## Explicit unknowns

- `game-membership-copy` — Surface game sẽ diễn đạt và bán membership khi multiplayer bị khóa như thế nào? Impact: Không tự thêm upsell hoặc giá vào game hub ngoài quyền từ chối đã được backend chứng minh.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
