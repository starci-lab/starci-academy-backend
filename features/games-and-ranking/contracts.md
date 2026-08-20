# Contracts · Trò chơi, bảng xếp hạng và streak

## Entity · Trò chơi (`game-definition`)

Fields: `id`, `title`, `description`, `cover`, `modes`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Entity · Phòng game (`game-room`)

Fields: `roomId`, `mode`, `players`, `phase`, `sessionId`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Entity · Kết quả game (`game-result`)

Fields: `user`, `game`, `score`, `season`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Entity · Thứ hạng (`standing`)

Fields: `user`, `points`, `rank`, `isFollowing`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Operation · Colyseus joinOrCreate/joinById

- Kind/owner: `command` / `provider`
- Inputs: token, game id, mode, character, room code
- Outputs: roomId, sessionId, shared state
- Failures: Inactive membership, Unknown room
- Evidence: `EV-003`, `EV-004`, `EV-005`

## Operation · globalLeaderboard

- Kind/owner: `query` / `frontend`
- Inputs: authenticated learner
- Outputs: myRank, myPoints, entries
- Failures: GraphQL error
- Evidence: `EV-003`, `EV-004`, `EV-005`

No field, failure or operation may appear here without routed source evidence.
