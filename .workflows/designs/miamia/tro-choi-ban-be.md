<!-- starci-workflow: v2 -->
# Trò chơi cùng bạn bè

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Thiết kế khu Trò chơi nhấn mạnh chơi cùng bạn bè, dựa trên đúng bốn game và capability backend thật |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tro-choi-ban-be\r1\index.html`; không sửa production source |

Research intake: đọc GraphQL/schema/runtime backend, shared FE contracts và reference trước khi append `## plan r1` cùng preview đã serve.

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Database / realtime | PostgreSQL + Colyseus |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Thiết kế khu Trò chơi ưu tiên chơi cùng bạn bè, chỉ dùng capability thật của bốn game MiaMia |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và một preview `r1/index.html`; không sửa production source |

### BACKEND EVIDENCE

| Evidence | Kết luận thiết kế |
|---|---|
| `GameServerService` đăng ký `vocab_race`, `match_pairs`, `couple_quiz`, `vocab_defense` và `team_matchmaking` | Catalogue phải có đúng bốn game; matchmaking là hạ tầng, không phải game thứ năm |
| `BaseGameRoom` có `SINGLE`, `COUPLE`, `TEAM2V2`; mọi room xác thực bằng Keycloak token | UI phải phân biệt chơi một mình, phòng bạn bè và 2v2; không hứa anonymous play |
| `COUPLE` là phòng riêng hai người, join bằng `roomId` | Luồng khả thi là chọn game → tạo phòng → copy/chia sẻ mã; người được mời nhập mã để join |
| `TEAM2V2` chỉ target `match_pairs` và `vocab_defense`; có nới RP và bot-fill theo thời gian chờ | Chỉ hai card này được gắn 2v2; Race và Quiz không được hứa 2v2 |
| Câu hỏi lấy từ personal review queue, có fallback; kết quả ghi `game_results` và cập nhật mastery bất đồng bộ | Có thể nói game dùng hàng ôn cá nhân; không hiện receipt mastery khi response chưa trả |
| Snapshot trả phase, gameType, mode, timer, round, question/options, player score/combo/hp/progress, winner và roomCode | Màn chơi/kết quả chỉ bind các field này; không tự dựng RP, Points hoặc contribution ratio |
| GraphQL runtime có `friendsLeaderboard`, `gameLeaderboard`, `rankLeaderboard`, `userFollowers`, `userFollowing` | Hướng so kè bạn bè và danh sách đang theo dõi là khả thi |
| Chưa có query danh sách bạn online, push invite hoặc party sống xuyên nhiều room | Không hiện chấm online, lời mời realtime hoặc party xuyên game trong proposal |
| FE chưa có `colyseus.js`; runtime Colyseus không lắng nghe ở các port đã kiểm tra | Apply sau này cần khóa client transport, port và runtime proof riêng; preview không được coi là runtime game |

### FOUR GAMES

| Game | Backend key | Loop thật | Chơi với bạn |
|---|---|---|---|
| Vocab Race | `vocab_race` | Trả lời đúng để tăng progress tới 100; score và combo nằm trong snapshot | Phòng `COUPLE`; không gắn 2v2 |
| Match Pairs | `match_pairs` | Ghép cặp Anh–Việt trên bàn 12 thẻ dùng chung | Phòng `COUPLE` và matchmaking `TEAM2V2` |
| Couple Quiz | `couple_quiz` | Đấu 12 vòng hoặc 60 giây | Phòng `COUPLE`; không gắn 2v2 |
| Vocab Defense | `vocab_defense` | Trả lời để bảo vệ HP/base | Phòng `COUPLE` và matchmaking `TEAM2V2` |

### DIRECTION BRIEF

| Direction | Quyết định sản phẩm | Reading order | CTA chính |
|---|---|---|---|
| A | Friend-first, đề xuất | Rủ bạn / nhập mã → bốn game → bảng bạn bè tuần | `Tạo mã để rủ bạn` |
| B | Game-first | Bộ lọc mood → bốn game → người đang theo dõi | CTA riêng theo từng game |
| C | Rivalry-first | Khoảng cách trên bảng bạn bè → trận thách đấu → bốn game | `Tạo trận để rủ An` |

### STATE COVERAGE

| State | Nội dung preview | Binding bắt buộc khi Apply |
|---|---|---|
| Sảnh game | Ba hướng product khác nhau, cùng đúng bốn game | Query bạn bè/bảng hạng thật; entitlement thật |
| Phòng bạn bè | Chủ phòng chọn game và lấy mã; người được mời nhập roomId | Colyseus create/join, auth token, reconnect seat 20 giây |
| Đang chơi | Match Pairs 2v2 với scoreboard và bàn thẻ | Snapshot server là source of truth |
| Kết quả | Winner, score, combo và replay | Chỉ field snapshot; không giả reward receipt |
| Responsive | Desktop sidebar, mobile footbar | Reuse shell MiaMia hiện có, không tạo navigation thứ hai |

### CONTRACT INVENTORY

| Classification | Owner / key | Quyết định |
|---|---|---|
| REUSE | `learn-shell-frame`, `learn-mobile-tab-bar`, `page-header-stack`, `scope-switch-row` | Giữ layout, navigation, page heading và tab pattern hiện có |
| REUSE | SurfaceCard, Button, Badge, Heading, Text; leaderboard standing/ranked rows | Dùng leaves/rows hiện có cho surface, CTA và bảng bạn bè |
| EXTEND | `MiaMiaAppLayout` connected navigation | Mở destination `/game`, giữ desktop sidebar → mobile footbar |
| NEW | game-hub stack + friend-room hero | Owner mới vì Study/Exam cards không biểu đạt create/join room |
| NEW | game catalogue/card | Một owner cho bốn game, capability tags và entitlement branch |
| NEW | friend-room lobby/roster | Một owner cho create, join, waiting, ready và reconnect states |
| NEW | arena scoreboard + game-specific board | Shell chung nhận branch riêng cho Race, Pairs, Quiz và Defense |
| NEW | game-result stack | Winner/score/combo/replay; tuyệt đối không nhận reward props chưa có receipt |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `tro-choi-ban-be-r1` | http://127.0.0.1:8087/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tro-choi-ban-be\r1\index.html` | `718c146e1c521cc9072b860b3c581e61145922b4ea0c536b91c8f4ee9139724e` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| A | `A · Rủ bạn trước` | đang chờ |
| B | `B · Chọn game trước` | đang chờ |
| C | `C · So kè bạn bè` | đang chờ |

| Runtime | Value |
|---|---|
| Preview root | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tro-choi-ban-be\r1` |
| PID | `51148` |
| Port | `8087` |
| Health | HTTP 200 sau revision cuối |

### OUTPUTS

| Concept | Result |
|---|---|
| Trò chơi cùng bạn bè | Một sảnh game dùng room code làm social loop thật, không giả online/push invite |
| Bốn game MiaMia | Race, Match Pairs, Couple Quiz và Vocab Defense với mode đúng backend |
| Ba hướng lựa chọn | A friend-first; B game-first; C rivalry-first |
| State concept | Sảnh, phòng bạn bè, đang chơi, kết quả và responsive shell trong cùng một URL |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | added — ghi research backend, ba hướng, contract inventory, preview và approval boundary bằng tiếng Việt |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tro-choi-ban-be\r1\index.html` | added — một HTML có tab A/B/C và tab trạng thái; không phải production source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt product direction tại một URL | Chọn A (đề xuất) để room-code friend-first; B để game-first; hoặc C để friends-leaderboard-first |
| Chuyển sang Review | Sau khi thầy chọn, mở `starci-fe-design-review` để khóa exact page/block/composite/branch/leaf tree và props trước Apply |

### WARNINGS

| Warning | Impact |
|---|---|
| Chơi `COUPLE` và `TEAM2V2` bị Pro gate server-side | UI phải giải thích entitlement trước create/join, không đợi tới lỗi room |
| Backend chưa có online-friends query hoặc push invite | CTA chỉ tạo room rồi copy/chia sẻ mã; không hiện online dot hay notification giả |
| Backend chưa có party xuyên game | Mỗi room thuộc một game; đổi game phải tạo/join room tương ứng |
| Snapshot chưa trả RP, Points, contribution ratio hoặc mastery receipt | Result không được hiển thị delta hoặc trạng thái đủ thưởng |
| FE chưa có Colyseus client và game server local đang offline | Review/Apply phải khóa transport, runtime port, auth token, network và terminal proof |
| `games/README.md` có đoạn integration gap cũ nhưng module hiện đã được wire | Review phải ưu tiên source/runtime hiện tại thay vì đoạn tài liệu stale |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có feedback chọn/bác hướng từ thầy |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A, B hoặc C và feedback chung | Phản hồi của thầy trên preview live |
| Khóa exact component/props tree | `starci-fe-design-review` sau khi có hướng đã chọn |
| Khóa Colyseus client, runtime và authenticated flow | Review FE và Backend Feature Plan riêng nếu contract còn thiếu |

## plan r2

Selected direction: `C · So kè bạn bè`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Database / realtime | PostgreSQL + Colyseus |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Ghi nhận hướng C đã được thầy chọn và bàn giao brief sang Design Review |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; preview r1 được giữ nguyên làm evidence, không sửa production source |

### SELECTED DIRECTION

| Decision | Value |
|---|---|
| Direction | `C · So kè bạn bè` |
| User feedback | `C đi` |
| Product hierarchy | Bảng xếp hạng bạn bè tuần → khoảng cách với bạn đứng trên → CTA tạo trận → chọn một trong bốn game → chia sẻ room code |
| Primary CTA | `Tạo trận để rủ An` |
| Secondary CTA | `Xem bảng bạn bè` |
| Social promise | Cạnh tranh với bạn bè bằng `friendsLeaderboard`; mời chơi bằng room code, không giả push invite hoặc trạng thái online |

### ACCEPTANCE STATES

| State | Acceptance |
|---|---|
| Sảnh có dữ liệu | Hiện bảng bạn bè tuần từ contract thật, vị trí người học, khoảng cách XP có thể tính từ hai hàng thật và CTA tạo trận |
| Sảnh rỗng | Không bịa đối thủ; giải thích chưa có bạn trong bảng và chuyển CTA sang theo dõi/rủ bạn bằng capability thật |
| Chưa đăng nhập | Giữ nguyên route, mở auth overlay; đăng nhập xong quay lại luồng Trò chơi MiaMia |
| Chọn game | Đủ bốn game; mode tags đúng: Match Pairs/Defense có 2v2, Race/Quiz không có 2v2 |
| Phòng bạn bè | Create/join bằng roomId; entitlement Pro được giải thích trước hành động bị gate |
| Đang chơi | Snapshot Colyseus là source of truth; branch riêng theo game nhưng dùng chung arena shell |
| Kết quả | Chỉ hiện winner, score, combo và replay khi snapshot trả; không hiện reward delta chưa có receipt |
| Responsive | Desktop giữ sidebar; mobile chuyển footbar hiện có; không tạo navigation song song |
| Runtime proof | Test account: đăng nhập → bảng bạn bè → tạo/join room → chơi → kết quả; kiểm tra terminal, console và network |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `tro-choi-ban-be-r1` | http://127.0.0.1:8087/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\tro-choi-ban-be\r1\index.html` | `718c146e1c521cc9072b860b3c581e61145922b4ea0c536b91c8f4ee9139724e` | đã chốt |

| Direction | Tab | Status |
|---|---|---|
| A | `A · Rủ bạn trước` | đã từ chối |
| B | `B · Chọn game trước` | đã từ chối |
| C | `C · So kè bạn bè` | đã chọn |

### OUTPUTS

| Concept | Result |
|---|---|
| Hướng đã chốt | C · So kè bạn bè |
| Trọng tâm trải nghiệm | Dùng vị trí trong nhóm bạn và khoảng cách XP để hút người học vào một trận thật |
| Bước kế tiếp | Design Review khóa component tree, props, states và production boundary trước Apply |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append lựa chọn C, acceptance states, trạng thái các direction và handoff sang Review |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| `friendsLeaderboard` chứng minh bảng bạn bè nhưng không chứng minh presence hay push invite | Review phải giữ CTA room-code và không thêm online indicator |
| Colyseus client/runtime FE chưa được khóa | Review phải chỉ rõ dependency, transport owner, env/port và proof trước Apply |
| Reward writes bất đồng bộ và snapshot thiếu receipt | Result không được nhận props RP/Points/contribution/mastery delta |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| A · Rủ bạn trước | C · So kè bạn bè | Thầy chọn `C đi` |
| B · Chọn game trước | C · So kè bạn bè | Thầy chọn `C đi` |

### OWED

| Owed | Cleared by |
|---|---|
| Exact page/layout/block/composite/branch/leaf/shell tree | `starci-fe-design-review` |
| Exact props delta và call-site migration | `starci-fe-design-review` |
| Exact production boundary và runtime proof | Review revision được thầy duyệt trước `starci-fe-design-apply` |

## review r1

Revision identity: `tro-choi-ban-be-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Database / realtime | PostgreSQL + Colyseus |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Phản biện hướng C và khóa exact component tree, props delta, source boundary cùng runtime proof trước Apply |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và bằng chứng đọc; không sửa HTML preview, FE source hoặc BE source |

### REVIEW VERDICT

| Decision | Verdict | Lý do |
|---|---|---|
| Hướng C rivalry-first | KEEP | `friendsLeaderboard` là query auth-scoped, luôn gồm viewer và mutual follows, xếp theo XP tuần ICT |
| CTA `Tạo trận để rủ An` tại hero | REVISE | CTA này thiếu game/mode nên không thể tạo room xác định; đổi thành `Chọn game để rủ An`, rồi card game tạo room thật |
| Hiện khoảng cách XP | KEEP có điều kiện | Chỉ tính khi response có viewer và hàng ngay trên; viewer hạng 1 hoặc thiếu hàng trên thì bỏ meter, không đặt về 0 |
| Danh sách bạn online / push invite | REMOVE | Backend không có contract; chia sẻ/copy room code là social handoff duy nhất trong boundary |
| Party xuyên game | REMOVE | Mỗi Colyseus room thuộc một game; đổi game tạo session mới |
| 2v2 trên cả bốn game | REMOVE | `team_matchmaking` chỉ nhận `match_pairs` và `vocab_defense` |
| Result reward delta | REMOVE | Snapshot không trả RP, Points, contribution ratio hoặc mastery receipt |
| Parallel design CSS/component tree | REMOVE | Apply ghi trực tiếp final source; layout dùng contracts và MiaMia `globals.css` hiện có, không tạo CSS module mới |

### APPROVED READING ORDER CANDIDATE

| Order | Owner | Meaning |
|---|---|---|
| 1 | `GameFriendStanding` | Người học thấy vị trí trong nhóm bạn và khoảng cách thật trước |
| 2 | `GameCatalog` | CTA hero dẫn tới chọn game; mỗi card nói rõ mode thật và Pro gate |
| 3 | `GameRoomSession` | Session route tự giải quyết create, join-by-code hoặc team matchmaking |
| 4 | `GameResultCard` | Winner/score/combo trước replay/exit; không hứa reward receipt |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `GameHubRoute` | ADD | — | `src/app/[lang]/(app)/game/page.tsx` | Next app segment | — | Mount duy nhất `GameHubPage`; route không fetch hoặc vẽ |
| route | `GameSessionRoute` | ADD | — | `src/app/[lang]/(app)/game/session/page.tsx` | Next app segment | — | Mount duy nhất `GameSessionPage`; intent được page đọc từ URL |
| shell | `RouteShell` | REUSE | `src/components/shells/RouteShell/index.tsx` | same | `src/app/[lang]/(app)/layout.tsx` | framework conversion | Segment shell hiện có đã đưa routed page vào `MiaMiaAppLayout` |
| layout | `MiaMiaAppLayout` | MODIFY | `src/components/layouts/MiaMiaAppLayout/index.tsx` | same | `RouteShell`; toàn bộ `(app)` routes | `learn-shell-frame`; `learn-mobile-tab-bar` | Mở `/game`, nhận current state cho `/game` và bỏ locked flag của destination game |
| layout | `_MiaMiaAppLayout` | REUSE | `src/components/layouts/MiaMiaAppLayout/component.tsx` | same | `MiaMiaAppLayout` | `learn-shell-frame`; `learn-mobile-tab-bar` | Pure shell đã render desktop sidebar và mobile footbar từ nav data, không cần đổi |
| overlay | `SignInOverlay` | REUSE | `src/components/overlays/auth/SignInOverlay/index.tsx`; `component.tsx` | same | `GameHubPage`; `GameSessionPage` | auth modal contracts hiện có | Anonymous giữ route/intent và đăng nhập qua owner hiện có |
| page | `GameHubPage` / `_GameHubPage` | ADD | — | `src/components/pages/GameHubPage/index.tsx`; `component.tsx` | `GameHubRoute` | `game-hub-page` | Page giữ auth intent và reading order standing trước catalogue; blocks tự resolve dữ liệu |
| page | `GameSessionPage` / `_GameSessionPage` | ADD | — | `src/components/pages/GameSessionPage/index.tsx`; `component.tsx` | `GameSessionRoute` | `game-session-page` | Page đọc/validate URL intent, giữ auth overlay và mount một session block |
| block | `GameFriendStanding` / `_GameFriendStanding` | ADD | — | `src/components/blocks/games/GameFriendStanding/index.tsx`; `component.tsx` | `GameHubPage` | `standing-hero-card`; `centred-empty-notice` | Query `friendsLeaderboard`, tính rival/meter từ response và có guest/pending/failed/empty/ready độc lập |
| block | `GameCatalog` / `_GameCatalog` | ADD | — | `src/components/blocks/games/GameCatalog/index.tsx`; `component.tsx` | `GameHubPage` | `game-catalog-section`; `game-grid`; `game-code-join-row` | Nắm đúng bốn game, mode filter, validation mã và báo intent lên page; không kết nối transport |
| block | `GameRoomSession` / `_GameRoomSession` | ADD | — | `src/components/blocks/games/GameRoomSession/index.tsx`; `component.tsx` | `GameSessionPage` | `game-room-stack` | Block duy nhất sở hữu Colyseus lifecycle, snapshot, answer, restart, leave và transport errors |
| composite | `StandingHeroCard` | REUSE | `src/components/composites/StandingHeroCard/index.tsx` | same | `GameFriendStanding` | `standing-hero-card`; `standing-goal-meter` | Đã biểu đạt standing, optional progress và một CTA; không tạo hero trùng |
| composite | `RankedUserRow` | REUSE | `src/components/composites/RankedUserRow/index.tsx` | same | `GameFriendStanding` empty/list evidence khi cần | `ranked-user-row` | Đã biểu đạt rank, identity, XP và viewer; không thêm online/follow state |
| composite | `GameCatalogCard` | ADD | — | `src/components/composites/GameCatalogCard/index.tsx` | `GameCatalog` | `game-card`; `game-card-actions` | Một shape chung cho title, mô tả, capability tags và mode CTA của bốn game |
| composite | `GameLobbyPanel` | ADD | — | `src/components/composites/GameLobbyPanel/index.tsx` | `GameRoomSession` waiting state | `game-lobby-card`; `game-player-list`; `game-player-row` | Render room code, roster thật, waiting/reconnect copy và copy/exit actions |
| composite | `GameScoreboard` | ADD | — | `src/components/composites/GameScoreboard/index.tsx` | `GameRoomSession` playing state | `game-scoreboard`; `game-player-row` | Render timer, round và players từ snapshot; team grouping chỉ khi mode là TEAM2V2 |
| composite | `VocabRaceBoard` | ADD | — | `src/components/composites/games/VocabRaceBoard/index.tsx` | `GameRoomSession` branch `VOCAB_RACE` | `game-board-frame`; `vocab-race-board`; `game-option-grid` | Dùng progress 0–100, question/options và answer index từ snapshot |
| composite | `MatchPairsBoard` | ADD | — | `src/components/composites/games/MatchPairsBoard/index.tsx` | `GameRoomSession` branch `MATCH_PAIRS` | `game-board-frame`; `match-pairs-board`; `game-option-grid` | Render shared board extra fields và answer contract; không suy correct pair ở client |
| composite | `CoupleQuizBoard` | ADD | — | `src/components/composites/games/CoupleQuizBoard/index.tsx` | `GameRoomSession` branch `COUPLE_QUIZ` | `game-board-frame`; `couple-quiz-board`; `game-option-grid` | Render round/timer/question/options; không gắn 2v2 |
| composite | `VocabDefenseBoard` | ADD | — | `src/components/composites/games/VocabDefenseBoard/index.tsx` | `GameRoomSession` branch `VOCAB_DEFENSE` | `game-board-frame`; `vocab-defense-board`; `game-option-grid` | Render hp/base/team fields thật và answer index |
| composite | `GameResultCard` | ADD | — | `src/components/composites/GameResultCard/index.tsx` | `GameRoomSession` finished state | `game-result-card`; `game-player-list`; `game-player-row` | Winner, score, combo, replay và exit; không có reward props |
| branch | `Tree`; `SurfaceCard` | REUSE | `src/components/branches/Tree/index.tsx`; `src/components/branches/SurfaceCard/index.tsx` | same | Tất cả pure game owners | contract renderer; card ground | Giữ contract ownership và surface pattern StarCi FE hiện có |
| leaf | `Heading`; `Text`; `Button`; `Badge`; `Avatar`; `Progress`; `ChoiceTabs`; `TextInput` | REUSE | `src/components/leaves/Heading/index.tsx`; `Text/index.tsx`; `Button/index.tsx`; `Badge/index.tsx`; `Avatar/index.tsx`; `Progress/index.tsx`; `ChoiceTabs/index.tsx`; `TextInput/index.tsx` | same | Game blocks/composites | existing leaf APIs | Không thêm vendor import hoặc leaf theo tên game |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `MiaMiaAppLayout` | `MiaMiaAppLayoutProps` | KEEP | `{surface: ComponentType}` | same | `RouteShell` | Existing layout tests giữ surface API; diff chỉ đổi route/current/locked mapping |
| `_MiaMiaAppLayout` | `MiaMiaAppLayoutProps` | KEEP | `{props:{spine,mobileTabs}; on?:{openDestination}; surface}` | same | `MiaMiaAppLayout` | Pure component không nằm trong edit tree |
| `GameHubPage` | connected API | ADD | — | no public props; owns pending `GameSessionIntent` và `SignInOverlay` | `GameHubRoute` | Route test/mount proves zero props |
| `_GameHubPage` | page slots | ADD | — | `{standingSurface: ComponentType; catalogSurface: ComponentType}` | `GameHubPage` | Pure test proves standing precedes catalogue and slots render once |
| `GameSessionPage` | connected API | ADD | — | no public props; reads `game`, `mode`, `room` search params and session token | `GameSessionRoute` | Connected test covers invalid URL, auth resume và exit navigation |
| `_GameSessionPage` | page slot | ADD | — | `{sessionSurface: ComponentType}` | `GameSessionPage` | Pure test proves exactly one session owner |
| `GameFriendStanding` | connected actions | ADD | — | `{onChooseGame():void; onRequireSignIn():void}` | `GameHubPage` | Connected tests cover guest, query and hero CTA; CTA cannot carry fake invite target |
| `_GameFriendStanding` | state/data/actions | ADD | — | `BlockProps<'guest'|'pending'|'failed'|'empty'|'ready', GameFriendStandingData>` + `{chooseGame?, signIn?, retry?}` | `GameFriendStanding` | Pure tests cover viewer-first, no-rival, viewer-rank-1, failed và guest states |
| `GameCatalog` | connected actions | ADD | — | `{onStart(intent: GameSessionIntent):void; onRequireSignIn():void}` | `GameHubPage` | Test proves invalid room code never emits intent and valid intent preserves game/mode |
| `_GameCatalog` | catalogue API | ADD | — | `{props:{games,modes,selectedMode,joinCode,copy}; on?:{selectMode,start,changeCode,joinCode}}` | `GameCatalog` | Pure tests assert exactly four ids and 2v2 only on Pairs/Defense |
| `GameRoomSession` | connected API | ADD | — | `{intent: GameSessionIntent; onRequireSignIn():void; onExit():void}` | `GameSessionPage` | Hook/client tests prove create, join-by-id and matchmaking reservation branches |
| `_GameRoomSession` | state/data/actions | ADD | — | `BlockProps<'guest'|'connecting'|'waiting'|'playing'|'finished'|'failed'|'disconnected', GameRoomSessionData>` + `{answer?, copyCode?, restart?, retry?, exit?}` | `GameRoomSession` | Pure tests freeze every state and all four gameType branches |
| `GameCatalogCard` | composite API | ADD | — | `CompositeProps<GameCatalogCardData,{start?:(mode:GameMode)=>void}>` | `_GameCatalog` | Composite test checks only declared mode actions render |
| `GameLobbyPanel` | composite API | ADD | — | `CompositeProps<GameLobbyData,{copyCode?:()=>void; exit?:()=>void}>` | `_GameRoomSession` | Test binds roomCode/players/expected seats and omits fake presence |
| `GameScoreboard` | composite API | ADD | — | `CompositeProps<GameScoreboardData>` | `_GameRoomSession` | Test binds timer/round/player score/combo/team only from snapshot |
| `VocabRaceBoard` | game board API | ADD | — | `CompositeProps<GameBoardData,{answer?:(index:number)=>void}>` | `_GameRoomSession` | Test proves option index is emitted and progress is snapshot-backed |
| `MatchPairsBoard` | game board API | ADD | — | `CompositeProps<MatchPairsBoardData,{answer?:(index:number)=>void}>` | `_GameRoomSession` | Test uses extra snapshot board fields; no local answer key |
| `CoupleQuizBoard` | game board API | ADD | — | `CompositeProps<GameBoardData,{answer?:(index:number)=>void}>` | `_GameRoomSession` | Test proves no TEAM2V2 CTA/branch |
| `VocabDefenseBoard` | game board API | ADD | — | `CompositeProps<VocabDefenseBoardData,{answer?:(index:number)=>void}>` | `_GameRoomSession` | Test uses hp/base extra snapshot fields |
| `GameResultCard` | result API | ADD | — | `CompositeProps<GameResultData,{restart?:()=>void; exit?:()=>void}>` | `_GameRoomSession` | Type and test forbid RP/Points/contribution/mastery fields |
| `useGameSession` | transport hook | ADD | — | `(intent:GameSessionIntent, token?:string) => {state,data,error,answer,restart,retry,leave}` | `GameRoomSession` | Hook tests mock `GameClient`; cleanup must leave room exactly once |
| `GameClient` | transport API | ADD | — | `create(intent,token)`, `join(roomCode,token)`, `matchmake(game,token)` returning one `GameConnection` with `subscribe`, `answer`, `restart`, `leave` | `useGameSession` | Unit tests assert options/token, `consumeSeatReservation`, messages and cleanup |

### TRANSPORT TYPES

| Type | Frozen shape |
|---|---|
| `GameId` | `'vocab_race' | 'match_pairs' | 'couple_quiz' | 'vocab_defense'` |
| `GameMode` | `'SINGLE' | 'COUPLE' | 'TEAM2V2'` |
| `GameSessionIntent` | `{kind:'create'; game:GameId; mode:'SINGLE'|'COUPLE'} | {kind:'join'; roomCode:string} | {kind:'matchmake'; game:'match_pairs'|'vocab_defense'}` |
| `GamePlayerSnapshot` | `{id,name,character,team,score,combo,hp,progress,action,bot}` đúng `BaseGamePlayerState` |
| `GameSnapshot` | `{phase,gameType,mode,remainingMs,round,question,options,players,winner,roomCode}` + typed extras của Pairs/Defense |
| `GameAnswerResult` | `{correct:boolean; character:string}` |
| `GameTransportError` | `'auth' | 'membership' | 'room-not-found' | 'network' | 'invalid-intent' | 'unknown'` cùng message an toàn |

### OWNER STATES

| Owner | Binding behavior |
|---|---|
| `GameFriendStanding` | Không token → guest; unresolved → pending; GraphQL error/null → failed; chỉ viewer → empty/no rival; có hàng trên viewer → ready + meter; viewer hạng 1 → ready không meter |
| `GameCatalog` | Manifest có đúng bốn ids; filter mode không tạo capability mới; join code trim + validate non-empty; Pro là capability label, không phải client-side entitlement verdict |
| `GameSessionPage` | Intent URL sai → local failed state; anonymous giữ nguyên URL và mở SignIn; auth xong cùng intent được resume |
| `GameRoomSession` | `create` dùng `client.create`; `join` dùng `client.joinById`; `matchmake` join `team_matchmaking` rồi `consumeSeatReservation`; leave/unmount đóng connection đúng một lần |
| `_GameRoomSession` | WAITING → lobby; PLAYING → scoreboard + đúng game board; FINISHED → result; disconnect giữ retry/exit; không render previous snapshot như trạng thái thành công mới |
| `GameResultCard` | Chỉ winner, players score/combo và actions; không tính thưởng từ anti-free-rider private counters |

### SUPPORTING PRODUCTION BOUNDARY

| Kind | Exact paths |
|---|---|
| Routes | `src/app/[lang]/(app)/game/page.tsx`; `src/app/[lang]/(app)/game/session/page.tsx` |
| Pages | `src/components/pages/GameHubPage/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx`; `src/components/pages/GameSessionPage/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx` |
| Blocks | `src/components/blocks/games/GameFriendStanding/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx`; `GameCatalog/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx`; `GameRoomSession/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx` |
| Composites | `src/components/composites/GameCatalogCard/index.tsx`; `index.test.tsx`; `GameLobbyPanel/index.tsx`; `index.test.tsx`; `GameScoreboard/index.tsx`; `index.test.tsx`; `GameResultCard/index.tsx`; `index.test.tsx`; `src/components/composites/games/VocabRaceBoard/index.tsx`; `index.test.tsx`; `MatchPairsBoard/index.tsx`; `index.test.tsx`; `CoupleQuizBoard/index.tsx`; `index.test.tsx`; `VocabDefenseBoard/index.tsx`; `index.test.tsx` |
| Layout | `src/components/layouts/MiaMiaAppLayout/index.tsx`; `index.test.tsx`; `component.test.tsx` |
| Contracts | `src/components/contracts/index.ts` — thêm chính xác `game-hub-page`, `game-catalog-section`, `game-grid`, `game-card`, `game-card-actions`, `game-code-join-row`, `game-session-page`, `game-room-stack`, `game-lobby-card`, `game-player-list`, `game-player-row`, `game-scoreboard`, `game-board-frame`, `game-option-grid`, `vocab-race-board`, `match-pairs-board`, `couple-quiz-board`, `vocab-defense-board`, `game-result-card` |
| Friends GraphQL | `src/modules/api/graphql/queries/types/friends-leaderboard.ts`; `query-friends-leaderboard.ts`; `query-friends-leaderboard.test.ts`; `src/hooks/swr/useQueryFriendsLeaderboardSwr.ts`; `src/hooks/swr/useQueryFriendsLeaderboardSwr.test.tsx`; `src/hooks/index.ts` |
| Game manifest/types | `src/modules/games/catalog.ts`; `catalog.test.ts`; `src/modules/games/types.ts` |
| Colyseus transport | `src/modules/games/colyseus/client.ts`; `client.test.ts`; `src/hooks/games/useGameSession.ts`; `useGameSession.test.tsx` |
| Env / ports | `src/modules/games/env.ts`; `env.test.ts`; `scripts/sync-ports.mjs`; `scripts/run-dev.mjs`; `.env.example` — generate `NEXT_PUBLIC_COLYSEUS_URL=ws://localhost:2638` từ backend `metadata.json` offset `+71` |
| Dependencies | `package.json`; `package-lock.json` — thêm `colyseus.js`, không dùng `socket.io-client` cho Colyseus protocol |
| Messages | `src/messages/vi.json`; `src/messages/en.json` dưới `miamia.game.*`; tiếng Việt là copy chính |
| Styling | Không thêm CSS file và không sửa component-local style; reuse `src/app/globals.css` MiaMia hiện tại cùng utility classes trong contract registry |

### ACCEPTANCE EVIDENCE

| Gate | Proof |
|---|---|
| Port registry | `npm run sync:ports -- --check`; generated env phải có FE `3070`, API `3071`, Colyseus `2638` từ `metadata.json` |
| Static FE | `npm run typecheck`; `npm run lint`; `npm run test`; `npm run build` |
| Focused FE | Vitest cho toàn bộ exact page/block/composite/query/hook/client test files trong supporting boundary |
| Backend unchanged | `npm run build:colyseus`; `npm run lint:check`; `npm run test:int -- apps/miamia-colyseus/src/rooms/vocab-race.int-spec.ts` tại backend |
| Runtime services | FE `http://localhost:3070`; GraphQL `http://localhost:3071/graphql`; Colyseus/playground `http://localhost:2638/playground`; Keycloak `http://localhost:8151` |
| Anonymous/auth | Mở `/vi/game` anonymous → CTA giữ route và mở auth → test account đăng nhập → quay lại đúng `/vi/game` |
| Rivalry | `friendsLeaderboard` network 200/không GraphQL error; viewer/rival/XP trên UI khớp payload, empty và hạng 1 không bịa meter |
| Bốn game | Với test account, mở SINGLE của cả Race, Pairs, Quiz, Defense; mỗi game nhận snapshot, answer_result, chuyển state và restart/exit không lỗi |
| Chơi bạn bè | Hai tài khoản test có entitlement Pro: account A tạo Match Pairs COUPLE, copy code; account B join code; cả hai chơi đến FINISHED và thấy cùng winner/scores |
| 2v2 | Account Pro queue Match Pairs hoặc Defense qua `team_matchmaking`, nhận `matched.reservation`, consume vào room thật; bot fallback sau max wait vẫn vào trận |
| Failure UX | Invalid room, hết session, non-Pro multiplayer reject, Colyseus offline và reconnect đều có copy/CTA cụ thể; không trắng trang |
| Responsive | `390×844`: sidebar thành footbar; `1440×900`: sidebar; không overflow, source order standing → catalogue không đổi |
| Terminal/network | Ghi FE terminal, API terminal, Colyseus terminal, browser console và failed network requests vào workflow; không đóng Apply khi còn unexplained error |

### OUTPUTS

| Concept | Result |
|---|---|
| Hướng C đã phản biện | Giữ rivalry-first, nhưng hero CTA đổi thành chọn game trước khi tạo room để không tạo trận mơ hồ |
| Component architecture | Hai route, hai page, ba connected/pure blocks, các composites game-specific và shell/layout/leaves được reuse |
| Transport architecture | Một typed Colyseus client/hook xử lý create, join-by-code và matchmaking reservation; GraphQL chỉ sở hữu bảng bạn bè |
| Acceptance meaning | Chỉ hoàn tất khi bốn game, hai-account friend room, 2v2, auth return, responsive và terminal/network đều được chứng minh |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append Review r1, exact component/props delta, transport types, supporting boundary, states và proof gates; chưa sửa production source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review revision | Duyệt `tro-choi-ban-be-review-r1` để ghi Approved revision và mở Apply; hoặc feedback exact row cần sửa |
| Runtime friend proof | Đề xuất dùng hai tài khoản test Pro riêng để chứng minh COUPLE; nếu chưa có account thứ hai, Apply phải dừng ở OWED thay vì giả lập UI |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree còn toàn bộ Apply Học & ôn tập chưa commit tại HEAD `a662e37` | Khi vào Apply, baseline commit sẽ checkpoint nguyên trạng đó trước khi viết Game; không được đánh đồng Study diff với Game diff |
| Backend worktree có thay đổi `.stacks`, Keycloak provision và e2e drift chưa commit | FE Apply không được sửa hoặc commit backend worktree; chỉ đọc/chạy service và test |
| `friendsLeaderboard` chỉ gồm mutual follows và viewer | Account test không có mutual follow sẽ vào empty/no-rival state dù query thành công |
| Backend không expose membership verdict qua FE query | Card chỉ gắn nhãn Pro; server join rejection là authority và phải có UX cụ thể |
| Colyseus runtime hiện chưa chạy ở `2638` | Apply phải start `start:colyseus`, kiểm tra playground/terminal trước UI flow |
| Snapshot reward thiếu receipt | Không được thêm props hoặc copy RP/Points/mastery/contribution trong Apply |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hero CTA `Tạo trận để rủ An` | `Chọn game để rủ An` | Chưa có game/mode nên CTA cũ không thể tạo một room xác định |
| Online dot / push invite | Copy/chia sẻ room code | Backend không có presence list hoặc invite mutation/event |
| One party qua nhiều game | Session riêng theo game | Colyseus room được tạo theo một room type cụ thể |
| TEAM2V2 cho Race/Quiz | TEAM2V2 chỉ Pairs/Defense | `TARGET_ROOMS` backend khóa đúng hai game |
| Reward/contribution result | Winner, score, combo | Response không trả reward receipt hoặc private anti-free-rider counters |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho `tro-choi-ban-be-review-r1` | Feedback của thầy |
| Hai test accounts mutual-follow và Pro entitlement | Runtime fixture/provision trước friend flow Apply |
| Baseline commit trước production write | `starci-fe-design-apply` sau approval và xác nhận write boundary |
| Source/runtime implementation và proof | `starci-fe-design-apply` đúng revision được duyệt |

## review approval

Approved revision: `tro-choi-ban-be-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Ghi nhận approval Review r1 và bắt buộc proof chơi bạn bè bằng hai browser session cách ly |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; production source chưa được sửa trước baseline commit Apply |

### RUNTIME APPROVAL ADDENDUM

| Proof | Requirement |
|---|---|
| Browser session A | Test account A đăng nhập độc lập, tạo Match Pairs `COUPLE`, copy room code và giữ kết nối |
| Browser session B | Test account B đăng nhập trong session cách ly cookie/localStorage, join đúng room code |
| Shared finish | Hai client trả lời tới `FINISHED`; winner, player scores và room identity phải nhất quán ở cả hai session |
| Observability | Chụp Network, Console, FE terminal, API terminal và Colyseus terminal trong cùng cửa sổ thời gian; unexplained error là FAIL |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| shell | `tro-choi-ban-be-review-r1` | REUSE | Review r1 | Review r1 | Toàn bộ tree Review r1 | Không đổi component contract | Approval này chỉ bổ sung proof runtime hai session |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `tro-choi-ban-be-review-r1` | Toàn bộ public props | KEEP | Review r1 | Review r1 | Toàn bộ producers/call sites Review r1 | Không đổi public props |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `tro-choi-ban-be-review-r1` |
| Friend-flow proof | Bắt buộc hai browser session và hai test accounts thật; không thay bằng fixture UI |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append Approved revision và two-session runtime addendum |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Account B hoặc Pro entitlement có thể chưa tồn tại trong local fixture | Apply phải provision test-only account/entitlement trước proof hoặc ghi blocker thật; không được giả pass |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một tab hoặc hai tab dùng chung session | Hai browser session cách ly | Thầy yêu cầu test kỹ luồng hai người |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline commit và implementation | `starci-fe-design-apply` |
| Two-session runtime evidence | Hai account hoàn thành cùng một COUPLE room trên runtime thật |

## apply

Applied revision: `tro-choi-ban-be-review-r1`

Baseline commit: `d08338572527829b059ec0b11012c56566394cce`

Tracked diff: `d083385..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Implement hướng C trực tiếp vào source và chứng minh bốn game cùng friend flow hai session |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | apply |
| Touching | Exact routes/pages/blocks/composites/contracts/query/hooks/game transport/env/dependencies/messages/layout/tests đã duyệt; backend chỉ đọc/chạy |

### BASELINE

| Field | Value |
|---|---|
| Baseline commit | `d08338572527829b059ec0b11012c56566394cce` |
| Baseline meaning | Checkpoint toàn bộ Study worktree trước Game; không có Game source edit trước commit này |
| Tracked diff | `d083385..worktree` |

### OUTPUTS

| Concept | Result |
|---|---|
| Game direction C | Đang triển khai rivalry-first theo Review r1 |
| Two-session proof | Bắt buộc trước khi đóng Apply |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\miamia-fe` | baseline commit đã tạo; Game production diff bắt đầu sau `d083385` |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append approval, baseline và Apply identity |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree vẫn có thay đổi dở ngoài Game FE boundary | Không commit/sửa backend trong Apply này |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có implementation feedback mới |

### OWED

| Owed | Cleared by |
|---|---|
| Implementation, static gates và live runtime proof | Các bước Apply tiếp theo |

## review r2

Revision identity: `tro-choi-ban-be-review-r2`

Continuation of approved r1: sửa đúng một source-owner mismatch được phát hiện trước Game production write; mọi row và runtime gate khác của r1 giữ nguyên.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Sửa owner nhập room code từ tên không tồn tại sang leaf `Input` hiện có |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow; chưa có Game production diff sau baseline |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| leaf | `TextInput` | REMOVE | Không tồn tại | — | Row r1 sai identity, chưa có call site | — | Source search chứng minh không có owner này |
| leaf | `Input` | REUSE | `src/components/leaves/Input/index.tsx` | same | `GameCatalog` qua `game-code-join-row` | existing `InputData` với `kind:'text'` | Leaf thật đã có `id`, `name`, placeholder/defaultValue và `on.change`; không cần tạo input mới |

Tất cả COMPONENT DELTA rows khác của `tro-choi-ban-be-review-r1` giữ nguyên chính xác.

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `Input` | `InputProps` | KEEP | `{props:{id,name,kind?,placeholder?,defaultValue?,disabled?,isInvalid?,describedBy?}; on?:{change?}}` | same | `_GameCatalog` | Existing leaf source và test; Game chỉ consume `kind:'text'`, không sửa public API |

Tất cả PROPS DELTA rows khác của `tro-choi-ban-be-review-r1` giữ nguyên chính xác.

### SUPPORTING BOUNDARY CORRECTION

| Before | After |
|---|---|
| `src/components/leaves/TextInput/index.tsx` REUSE | `src/components/leaves/Input/index.tsx` REUSE |

### OUTPUTS

| Concept | Result |
|---|---|
| Review r2 | Hướng C, architecture và two-session gate không đổi; room code dùng đúng leaf `Input` đã tồn tại |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append source-owner correction r2; không sửa FE source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt source-owner correction | Duyệt `tro-choi-ban-be-review-r2` để Apply tiếp tục từ baseline hiện tại |

### WARNINGS

| Warning | Impact |
|---|---|
| R1 gọi nhầm một owner không tồn tại | Apply r1 không được tiếp tục vì diff không thể reconcile với COMPONENT DELTA |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `TextInput` REUSE | `Input` REUSE | Source thật chỉ có `Input`; không được invent owner trong Apply |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval r2 | Feedback của thầy |
| Resume Apply từ baseline `d083385` | Approval r2; không cần baseline mới vì chưa có Game source edit |

## review approval r2

Approved revision: `tro-choi-ban-be-review-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Ghi nhận approval source-owner correction và resume Apply |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow trước khi resume Apply |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| shell | `tro-choi-ban-be-review-r2` | REUSE | Review r2 | Review r2 | Toàn bộ tree Review r2 | Không đổi component contract | Approval không thêm owner mới |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `tro-choi-ban-be-review-r2` | Toàn bộ public props | KEEP | Review r2 | Review r2 | Toàn bộ producers/call sites Review r2 | Không đổi public props |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `tro-choi-ban-be-review-r2` |
| Baseline | Tiếp tục dùng `d083385`; không có Game edit cần checkpoint lại |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append approval r2 |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| None | None |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có feedback mới ngoài approval |

### OWED

| Owed | Cleared by |
|---|---|
| Resume implementation và proof | Apply r2 continuation |

## apply r2

Applied revision: `tro-choi-ban-be-review-r2`

Baseline commit: `d08338572527829b059ec0b11012c56566394cce`

Tracked diff: `d083385..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Resume Apply với leaf `Input` đúng source và giữ two-session runtime gate |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | apply |
| Touching | Exact r1 boundary với correction r2 `Input`; backend chỉ đọc/chạy |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply r2 | Đang triển khai từ baseline sạch |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\miamia-fe` | Chưa có Game diff tại thời điểm resume |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append Apply r2 identity |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| None | None |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `TextInput` owner | `Input` owner | Approved r2 source correction |

### OWED

| Owed | Cleared by |
|---|---|
| Source, gates và live two-session proof | Apply continuation |

## apply feedback 1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Ghi nhận feedback bắt buộc đọc legacy friend-game và tách Colyseus thành service riêng |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow và provisional Game transport diff; dừng thêm source cho tới Review r3 |

### FEEDBACK EVIDENCE

| Evidence | Result |
|---|---|
| User feedback | `đọc kĩ legacy có trò chơi bạn bè rồi mà? với server colyseus là server khác` |
| Legacy root | `D:\Repositories\mia-mia\apps\app` |
| Legacy flow | `PlayLobby` → `GameSetupModal` → character → create/join room code → `GameRunner` → result/rematch |
| Legacy visual runtime | Phaser `BaseGameScene` + bốn scenes riêng; canvas 16:9; 28 Mia/Max sprite sheets/previews + manifest |
| Service topology | GraphQL API `3071`; Colyseus microservice riêng `2638` từ backend `metadata.json`; Keycloak token truyền trực tiếp vào Colyseus join options |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply status | Tạm dừng vì legacy evidence làm thay đổi approved component tree |
| Required correction | Giữ rivalry-first hierarchy nhưng phục hồi legacy setup/character/Phaser/friend-room flow bằng StarCi component patterns |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/games/`; `src/hooks/games/`; friends GraphQL/hook; `package.json`; `package-lock.json` | provisional — transport/query groundwork đã viết sau baseline, chưa commit và chưa được coi là accepted implementation |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — record feedback và route về Review |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| R2 bỏ qua legacy Phaser/assets và dùng React board composites | Apply tiếp sẽ làm mất gameplay identity đã có |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Card-only React game boards và session route riêng | Legacy setup + character + Phaser runner trong game hub | `đọc kĩ legacy có trò chơi bạn bè rồi mà?` |
| Hiểu Colyseus như phần của GraphQL API | Public Colyseus endpoint/service riêng | `server colyseus là server khác` |

### OWED

| Owed | Cleared by |
|---|---|
| Re-freeze legacy-backed tree/props/assets/service boundary | `tro-choi-ban-be-review-r3` |

## review r3

Revision identity: `tro-choi-ban-be-review-r3`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Khóa lại direction C với legacy friend-game/Phaser parity và Colyseus service boundary riêng |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow và legacy evidence; không thêm production source cho tới approval r3 |

### LEGACY BINDING EVIDENCE

| Identity | Path | SHA-256 | Binding decision |
|---|---|---|---|
| Lobby | `D:\Repositories\mia-mia\apps\app\src\components\features\play\PlayLobby\index.tsx` | `f359f1e3953d9241cf6271ccd37bad3d2d713711f102a72cea441eb0028af5d3` | Giữ bốn cover cards, solo/couple chips và game-first setup bên dưới rivalry hero |
| Setup | `D:\Repositories\mia-mia\apps\app\src\components\features\play\GameSetupModal\index.tsx` | `25d0278c1a44dfb80485a7b86c71ec765057773dfee1ab6e741e1b693f371b0c` | Giữ mode → create/join code → character decision flow |
| Runner | `D:\Repositories\mia-mia\apps\app\src\components\features\play\GameRunner\index.tsx` | `60a486dfd42f2df97aae45dd3b19eab17d79157f6b412268702723c2e2d337a0` | Giữ 16:9 canvas, waiting/code overlay, result và rematch |
| Network | `D:\Repositories\mia-mia\apps\app\src\modules\colyseus\gameNetwork.ts` | `317f10a0c02f52d4bcfdeb26a8202a055b2b1d8816cd1264ea0b5ed89b312f4bc` | Adapt sang token auth, uppercase modes, 2v2 reservation và port offset; không copy stale no-token/lowercase API |
| Sprite manifest | `D:\Repositories\mia-mia\apps\app\public\game-assets\sprites-manifest.json` | `152e9ed7758492b4398c8da7c1c23405f706590a0aee14bfa287e37f9f54d2cf` | Copy manifest + 28 owned sprite sheets/previews vào MiaMia FE public assets |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | `GameHubRoute` | ADD | — | `src/app/[lang]/(app)/game/page.tsx` | Next app segment | — | Một route mount Game hub; gameplay thay state trong cùng route như legacy |
| route | `GameSessionRoute` | REMOVE | Candidate r2, chưa có source | — | None | — | Legacy runner không điều hướng sang route session riêng |
| shell | `RouteShell` | REUSE | `src/components/shells/RouteShell/index.tsx` | same | `(app)` layout | framework conversion | Giữ shell hiện tại |
| layout | `MiaMiaAppLayout` | MODIFY | `src/components/layouts/MiaMiaAppLayout/index.tsx` | same | `RouteShell` | `learn-shell-frame`; `learn-mobile-tab-bar` | Mở `/game`, active nav, desktop sidebar/mobile footbar |
| layout | `_MiaMiaAppLayout` | REUSE | `src/components/layouts/MiaMiaAppLayout/component.tsx` | same | connected layout | existing shell contracts | Pure layout đã đủ |
| page | `GameHubPage` / `_GameHubPage` | ADD | — | `src/components/pages/GameHubPage/index.tsx`; `component.tsx` | `GameHubRoute` | `game-hub-page`; `game-active-session-page` | Page owns screen-level lobby/setup/playing switch và auth return; blocks vẫn tự bind |
| page | `GameSessionPage` / `_GameSessionPage` | REMOVE | Candidate r2, chưa có source | — | None | — | Tránh tạo route/page song song với legacy in-place runner |
| overlay | `SignInOverlay` | REUSE | `src/components/overlays/auth/SignInOverlay/index.tsx`; `component.tsx` | same | `GameHubPage` | existing auth contracts | Giữ pending game config qua auth |
| overlay | `GameSetupOverlay` / `_GameSetupOverlay` | ADD | legacy `GameSetupModal` | `src/components/overlays/games/GameSetupOverlay/index.tsx`; `component.tsx` | `GameHubPage` sau game-card press | `game-setup-panel`; `game-mode-grid`; `game-character-grid`; `game-code-join-row` | Rebuild legacy setup bằng ModalShell/contract/leaves; chọn mode, create/join, character |
| shell | `ModalShell` | REUSE | `src/components/shells/ModalShell/index.tsx` | same | `GameSetupOverlay` | vendor modal mechanics | Setup không import HeroUI modal trực tiếp |
| block | `GameFriendStanding` / `_GameFriendStanding` | ADD | — | `src/components/blocks/games/GameFriendStanding/index.tsx`; `component.tsx` | `GameHubPage` lobby | `standing-hero-card`; empty notice | Direction C addition trước legacy lobby |
| block | `GameCatalog` / `_GameCatalog` | ADD | legacy `PlayLobby` menu | `src/components/blocks/games/GameCatalog/index.tsx`; `component.tsx` | `GameHubPage` lobby | `game-catalog-section`; `game-grid` | Preserve four covers/copy/mode capabilities trong StarCi owners |
| block | `GameRunner` / `_GameRunner` | ADD | legacy `GameRunner` | `src/components/blocks/games/GameRunner/index.tsx`; `component.tsx` | `GameHubPage` playing state | `game-runner-stack`; `game-canvas-frame`; `game-lobby-card`; `game-result-card` | Own separate Colyseus connection, Phaser canvas, waiting/code, finish/rematch/error |
| block | `GameRoomSession` / `_GameRoomSession` | REMOVE | Candidate r2, chưa có source | — | None | — | Replaced by legacy-backed `GameRunner` owner |
| composite | `StandingHeroCard` | REUSE | `src/components/composites/StandingHeroCard/index.tsx` | same | `GameFriendStanding` | existing standing contracts | No duplicate rivalry hero |
| composite | `GameCatalogCard` | ADD | legacy PressableCard game item | `src/components/composites/GameCatalogCard/index.tsx` | `GameCatalog` | `game-card`; `game-card-actions` | Cover, description, mode chips, one setup action |
| composite | `GameLobbyPanel` | ADD | legacy waiting/code chrome | `src/components/composites/GameLobbyPanel/index.tsx` | `GameRunner` WAITING | `game-lobby-card`; `game-player-list` | Room code, real roster, copy and exit |
| composite | `GameResultCard` | ADD | legacy result card | `src/components/composites/GameResultCard/index.tsx` | `GameRunner` FINISHED | `game-result-card`; `game-player-list` | Winner/scores/combo, rematch/lobby; no reward receipt |
| composite | `GameScoreboard`; four React board composites | REMOVE | Candidate r2, chưa có source | — | None | — | Phaser scenes already own HUD/board/fighter composition; avoid duplicate gameplay UI |
| leaf | `GameCanvas` | ADD | legacy Phaser runner/scenes | `src/components/leaves/GameCanvas/index.tsx` | `GameRunner` | intrinsic 16:9 vendor canvas | Own Phaser mechanics and dynamic scene loading; data/action API only, no page logic |
| leaf | `Input` | REUSE | `src/components/leaves/Input/index.tsx` | same | `GameSetupOverlay` room-code step | existing leaf API | Correct r2 owner |
| branch | `Tree`; `SurfaceCard` | REUSE | existing branch paths | same | pure owners | contract renderer/ground | No parallel design code |
| leaf | `Heading`; `Text`; `Button`; `Badge`; `Avatar`; `Progress`; `ChoiceTabs`; `Image` | REUSE | existing leaf paths | same | Game owners | existing leaf APIs | Catalog and overlay use established vocabulary |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `GameHubPage` | connected API | ADD | — | no props; owns selected game, setup intent, active config, auth overlay và exit/reset | `GameHubRoute` | Connected test covers lobby → setup → auth → runner → lobby |
| `_GameHubPage` | screen slots | ADD | — | `{standingSurface:ComponentType; catalogSurface:ComponentType; runnerSurface?:ComponentType}` | `GameHubPage` | Pure tests prove standing precedes catalog and runner replaces lobby without route change |
| `GameSetupOverlay` | connected outcome API | ADD | — | `{game?:GameId; isOpen:boolean; onResolved(config:GameLaunchConfig):void; onCancelled():void}` | `GameHubPage` | Test covers dismiss/reset and exact resolved config |
| `_GameSetupOverlay` | finite setup state | ADD | — | `{state:'mode'|'room'|'character'; props:GameSetupData; on?:{back,chooseMode,createRoom,changeCode,joinRoom,chooseCharacter}}` | connected overlay | Pure tests cover legacy flow and room-code validation |
| `GameFriendStanding` | actions | ADD | — | `{onChooseGame():void; onRequireSignIn():void}` | `GameHubPage` | Same r2 binding |
| `GameCatalog` | actions | RETYPE | r2 `{onStart(intent);onRequireSignIn}` | `{onPickGame(game:GameId):void}` | `GameHubPage` | Catalog only chooses a game; setup overlay resolves mode/room/character |
| `GameRunner` | connected API | ADD | — | `{config:GameLaunchConfig; token:string; onExit():void}` | `GameHubPage` | Test proves create/join/matchmake and cleanup |
| `_GameRunner` | runtime state | ADD | — | `BlockProps<'connecting'|'waiting'|'playing'|'finished'|'failed'|'disconnected',GameRunnerData>` + `{copyCode,restart,retry,exit,answer}` | connected runner | Pure tests freeze all chrome states; canvas only on playing/finished |
| `GameCanvas` | Phaser API | ADD | — | `{props:{gameType,character,snapshot?,answerResult?}; on?:{answer(index)}}` | `_GameRunner` | Leaf test mocks Phaser loader; scenes receive only snapshot/action, never auth/token |
| `GameLaunchConfig` | domain API | ADD | — | `{game:GameId; mode:'SINGLE'|'COUPLE'; character:'MIA'|'MAX'; roomCode?:string} | {game:TeamGameId; mode:'TEAM2V2'; character:'MIA'|'MAX'}` | Setup overlay → page → runner | Type tests reject roomCode on create and TEAM2V2 on Race/Quiz |
| `GameClient` | service API | RETYPE | provisional create/join/matchmake lacks character | Every operation receives token + character; endpoint comes only from `NEXT_PUBLIC_COLYSEUS_URL` | `useGameSession` | Unit tests assert direct Colyseus URL and no GraphQL/API URL reuse |
| `useGameSession` | hook API | RETYPE | provisional intent API | `(config:GameLaunchConfig,token:string)=>{state,snapshot,answerResult,error,answer,restart,retry,leave}` | `GameRunner` | Hook tests cover separate service, matched reservation and one-time leave |

### SUPPORTING PRODUCTION BOUNDARY

| Kind | Exact paths |
|---|---|
| Keep from r2 | Friends GraphQL/query/hook; game catalog/types/env; Colyseus client/hook; dependencies/env-port scripts/messages/contracts/layout tests, revised by r3 APIs |
| Routes/pages | `src/app/[lang]/(app)/game/page.tsx`; `src/components/pages/GameHubPage/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx` |
| Overlay | `src/components/overlays/games/GameSetupOverlay/index.tsx`; `component.tsx`; `index.test.tsx`; `component.test.tsx` |
| Blocks | `src/components/blocks/games/GameFriendStanding/`; `GameCatalog/`; `GameRunner/`, each exact `index.tsx`, `component.tsx`, `index.test.tsx`, `component.test.tsx` |
| Composites/leaf | `src/components/composites/GameCatalogCard/index.tsx`; `index.test.tsx`; `GameLobbyPanel/index.tsx`; `index.test.tsx`; `GameResultCard/index.tsx`; `index.test.tsx`; `src/components/leaves/GameCanvas/index.tsx`; `index.test.tsx` |
| Phaser modules | `src/modules/games/phaser/scenes/BaseGameScene.ts`; `VocabRaceScene.ts`; `MatchPairsScene.ts`; `CoupleQuizScene.ts`; `VocabDefenseScene.ts` |
| Assets | `public/game-assets/sprites-manifest.json`; `public/game-assets/sprites/mia/` và `public/game-assets/sprites/max/`, mỗi character có `idle`, `run`, `attack`, `shield`, `think`, `hurt`, `celebrate` dưới dạng `.png` sheet + `-preview.webp` |
| Dependencies | `package.json`; `package-lock.json` — `colyseus.js ^0.16.22`, `phaser ^3.90.0` |
| Separate service env | `src/modules/games/env.ts`; `env.test.ts`; `scripts/sync-ports.mjs`; `scripts/run-dev.mjs`; `.env.example` — GraphQL `http://localhost:3071/graphql`, Colyseus `ws://localhost:2638` là hai biến/endpoint độc lập |

### LEGACY PARITY ACCEPTANCE

| State | Required parity + approved evolution |
|---|---|
| Lobby | Legacy four illustrated cards/mode chips; direction C adds friends-weekly hero above, sidebar/footbar remains current MiaMia shell |
| Setup | Pick game → mode → create/join code → character; Pro/TEAM2V2 rules reflect current backend, not stale legacy lowercase/no-token contract |
| Waiting | 16:9 canvas frame, room code visible/copyable, friend waiting copy and real roster |
| Playing | Phaser Mia/Max sprites and game-specific scenes react only to snapshots/answer_result from separate Colyseus service |
| Result | Legacy winner/ranked scores/rematch/lobby; no fabricated reward delta |
| Two sessions | Isolated A creates COUPLE, B joins room code; both canvases receive same room snapshots through `ws://localhost:2638` |

### OUTPUTS

| Concept | Result |
|---|---|
| Review r3 | Hướng C giữ friends rivalry hero nhưng gameplay quay về legacy game setup, characters, Phaser scenes và friend room |
| Service topology | GraphQL và Colyseus là hai server/env/terminal/network streams riêng |
| Migration rule | Reuse concept/assets, không copy stale lowercase modes, missing token hoặc vendor-layer code |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | modified — append user feedback, legacy hashes, revised component/props/service/assets boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt legacy-backed Review | Duyệt `tro-choi-ban-be-review-r3` để reconcile provisional diff và Apply tiếp từ baseline `d083385` |

### WARNINGS

| Warning | Impact |
|---|---|
| Legacy network dùng lowercase `single/couple`, không token và default port 2567 | Chỉ dùng legacy làm UX/visual evidence; transport phải theo backend hiện tại uppercase/token/2638 |
| Legacy assets khoảng nhiều MB và Phaser là dependency mới của target FE | Build/mobile load phải dùng dynamic import; asset loading/network phải được kiểm tra |
| Provisional r2 source đang nằm trong worktree | Sau approval r3 phải reconcile/replace, không commit như implementation hoàn tất |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| React-only game boards | Legacy Phaser scenes + Mia/Max assets trong GameCanvas leaf | User yêu cầu đọc kỹ legacy đã có game bạn bè |
| Separate GameSession route/page | In-place GameRunner trong `/game` | Legacy giữ lobby/setup/game/result trong cùng feature flow |
| Colyseus dùng API endpoint | `NEXT_PUBLIC_COLYSEUS_URL` riêng, port 2638 local | Colyseus là server khác |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval r3 | Feedback của thầy |
| Reconcile provisional diff với r3 | Resume `starci-fe-design-apply` sau approval |

## apply r3

Applied revision: `tro-choi-ban-be-review-r3`

Baseline commit: `d08338572527829b059ec0b11012c56566394cce`

Tracked diff: `d08338572527829b059ec0b11012c56566394cce..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ baseline `d08338572527829b059ec0b11012c56566394cce`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Apply hướng C với legacy Phaser parity và Colyseus service tách riêng |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng supporting production boundary của `tro-choi-ban-be-review-r3` và workflow này |

Approval evidence: thầy duyệt chính xác `tro-choi-ban-be-review-r3`.
| Two-session Phaser/runtime proof | Hai isolated browser sessions và hai Colyseus connections cùng room |

### OUTPUTS

| Concept | Result |
|---|---|
| Game hub hướng C | `/vi/game` hiển thị friends-rivalry hero trước catalog 4 game legacy: Thủ thành từ vựng, Đua từ vựng, Ghép cặp, Đấu đôi |
| Luồng thiết lập | Chọn game → chọn SINGLE/COUPLE/TEAM2V2 theo capability → tạo/nhập mã phòng → chọn Mia/Max → giữ pending config qua cổng đăng nhập |
| Gameplay | Runner nằm trong cùng `/game`, dùng Phaser canvas, snapshot/answer result từ Colyseus riêng và các trạng thái connecting/waiting/playing/finished/failed/disconnected |
| Responsive | Desktop dùng sidebar; mobile `390×844` ẩn sidebar và hiện footbar sticky 5 mục, không tràn ngang |

### CHANGES

| Tree | Details |
|---|---|
| `.env.example`; `scripts/run-dev.mjs`; `scripts/sync-ports.mjs` | Tách rõ web `3070`, GraphQL `3071`, Colyseus `2638`; check offset trả PASS |
| `package.json`; `package-lock.json` | Thêm `colyseus.js ^0.16.22` và `phaser ^3.90.0` |
| `src/app/[lang]/(app)/game/page.tsx` | Thêm route `/[lang]/game` duy nhất; không tạo session route song song |
| `src/components/layouts/MiaMiaAppLayout/index.tsx`; `index.test.tsx` | Mở game navigation; sidebar desktop và footbar mobile dùng cùng route identity |
| `src/components/pages/GameHubPage/` | Thêm connected/pure page điều phối lobby, setup, auth continuation và in-place runner |
| `src/components/blocks/games/GameFriendStanding/`; `GameCatalog/`; `GameRunner/` | Thêm hero bạn bè, catalog 4 game và Colyseus/Phaser runner |
| `src/components/overlays/games/GameSetupOverlay/` | Thêm setup state machine; heading luôn hiển thị tên game đang chọn |
| `src/components/composites/GameCatalogCard/`; `GameLobbyPanel/`; `GameResultCard/`; `src/components/leaves/GameCanvas/` | Thêm card catalog, waiting room, kết quả và vendor canvas leaf |
| `src/modules/games/`; `src/hooks/games/` | Thêm typed catalog/config, endpoint resolver, Colyseus client, session hook và 4 Phaser scenes |
| `src/modules/api/graphql/queries/query-friends-leaderboard.ts`; `types/friends-leaderboard.ts`; `src/hooks/swr/useQueryFriendsLeaderboardSwr.ts` | Thêm friends leaderboard binding cho rivalry hero |
| `src/components/contracts/index.ts` | Thêm exact game hub/setup/catalog/runner/lobby/result contracts đã duyệt |
| `public/game-assets/` | Copy manifest và 28 Mia/Max legacy sprite/preview assets; không tạo artwork thay thế |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md` | Ghi baseline, diff, proof, runtime blocker và khoản nợ của Apply r3 |

### CROSS-REPOSITORY LINT PROOF

| Gate | Kết quả |
|---|---|
| FE focused ESLint game boundary | PASS, 0 error; còn warning cấu hình React version |
| FE full direct ESLint | PASS, 0 error |
| FE repo-owned `npm run lint` | FAIL trước ESLint vì `plugins/eslint-canon` lệch mirror so với Trust; không chạy `--write` vì generated lint tree ngoài boundary r3 |
| BE `npm run lint:check` | PASS exit 0, 0 error; 367 warning lịch sử |

### LIVE FLOW PROOF

| Proof | Kết quả |
|---|---|
| Runtime topology | FE `3070`, GraphQL `3071`, Keycloak `8151`, Colyseus được khởi động riêng và log `ColyseusListening port: 2638` |
| Guest browser | PASS catalog 4 game, mode capabilities, create/join code, character step và SignInOverlay |
| Mobile browser | PASS `390×844`; sidebar `display:none`, footbar `display:flex; position:sticky; bottom:0`, `scrollWidth 375 <= innerWidth 390` |
| Browser console | 0 error; còn warning `PressResponder was rendered without a pressable child` từ shell chung và Fast Refresh khi source đổi |
| Hai Colyseus client live | FAIL trước khi room được tạo: `RankService.getOrCreateActiveSeason()` gọi TypeORM `findOne(RankSeasonEntity,{order})` không có selection conditions |
| Colyseus integration spec | PASS 1 suite, 9/9; spec stub app-context nên không bắt lỗi TypeORM live ở rank service |

### PROOF

| Command / evidence | Kết quả |
|---|---|
| Focused Vitest game tree | PASS 17 files, 17/17 tests |
| `npm run typecheck` | PASS |
| Focused game ESLint `--max-warnings=0` | PASS |
| `npm run build` | PASS; route manifest có `/[lang]/game` |
| `git diff --check` | PASS |
| `npm run sync:ports -- --check` | PASS: web `3070`, API `3071`, Colyseus `2638`, offset `+71` |
| Full FE test suite | FAIL lịch sử: 555 tests pass, 15 fail trong 11 suites ngoài game boundary (next/navigation mock, stale hooks barrel, ResizeObserver, dashboard markers, Apollo chain, query-courses expectations) |

### NEED APPROVALS

| Question | Options |
|---|---|
| Sửa blocker live Colyseus | Mở Backend Feature Plan riêng cho `RankService.getOrCreateActiveSeason()`; không đưa backend source vào FE Apply r3 |
| Sửa stack restart drift | Mở Backend Feature Plan riêng để `scripts/sync.mjs` sinh và sở hữu `COLYSEUS_PORT=metadata.ports.colyseus` |
| Làm sạch full FE gates | Mở FE lint-sync/audit boundary riêng cho canonical mirror drift và 15 test lỗi lịch sử |

### WARNINGS

| Warning | Impact |
|---|---|
| `scripts/sync.mjs` backend chưa emit `COLYSEUS_PORT` dù `metadata.json` là `2638` | Restart thường rơi về default `2567`; lượt test này phải truyền env `COLYSEUS_PORT=2638` |
| Colyseus watch typecheck báo cast lỗi lịch sử tại `otp-challenge.service.spec.ts:34` | Service vẫn boot nhưng backend watch không sạch |
| `npm audit` báo 3 high vulnerabilities sau khi cài dependency | Cần audit dependency riêng; không tự nâng ngoài boundary |
| Next build cảnh báo middleware convention deprecated | Không chặn build, nhưng cần migration riêng |
| Apply chưa đạt live two-session acceptance | Không được đóng Apply hoặc báo game multiplayer hoạt động hoàn chỉnh |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa trực tiếp `RankService` trong FE Apply | Ghi blocker và route sang Backend Feature Plan | File backend không thuộc exact boundary `tro-choi-ban-be-review-r3` |
| Đổi FE về Colyseus default `2567` | Giữ canonical offset `2638` | `metadata.json` và `.stack` đã chốt offset `+71` |
| Báo hai session PASS dựa trên integration test stub | Giữ live proof là FAIL | Stub không chạy TypeORM rank path thật |
| Chèn token thủ công để giả authenticated UI | Chỉ dùng login/session thật ở proof sau | Không được biến UI test thành trạng thái giả |

### OWED

| Owed | Cleared by |
|---|---|
| Live A tạo COUPLE room, B join cùng room, hai sessionId khác nhau, cả hai nhận PLAYING snapshot và round advance | Backend rank fix Apply + chạy lại browser/client proof trên `2638` |
| Restart Colyseus thường vẫn giữ `2638` không cần env tạm | Backend stack sync fix + restart proof |
| Full FE repo lint và full test suite xanh | Boundary cleanup được Plan/Review/Apply riêng; không nhập vào r3 |

### APPLY R3 CLOSURE

Final FE commit: `cf33a18` (`feat: add MiaMia friends game hub`)

Backend runtime commits used by this proof: `72a8f7f` (Colyseus local readiness) và `4542cbd` (OTP Redis test contract).

#### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `cf33a18`; BE `main` @ `4542cbd` |
| Purpose | Đóng Apply hướng C bằng runtime authenticated hai phiên thật |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\tro-choi-ban-be.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng production boundary của `tro-choi-ban-be-review-r3`; hai sửa lỗi nằm trong `GameCanvas`, Phaser base scene và `useGameSession` đã duyệt |

#### OUTPUTS

| Concept | Result |
|---|---|
| Trò chơi bạn bè | PASS luồng chọn một trong 4 trò, tạo mã phòng, bạn vào phòng và hai người chơi đồng bộ |
| Gameplay | PASS canvas Phaser riêng cho Mia/Max, kết quả chung và chơi lại đồng bộ |
| Runtime topology | PASS FE `3070`, API `3071`, Colyseus `2638`; không dùng chung endpoint |
| Auth test | PASS email, password và OTP bypass chỉ của tài khoản test local |

#### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/GameCanvas/index.tsx`; `src/modules/games/phaser/scenes/BaseGameScene.ts` | Bỏ đọc `Scene.events` trước bootstrap; scene gọi callback ready sau khi `create()` dựng xong HUD/sprites, rồi mới nhận snapshot/answer result |
| `src/components/leaves/GameCanvas/index.test.tsx` | Mock đúng lifecycle `setReady` mới |
| `src/hooks/games/useGameSession.ts` | Giữ một pending Colyseus reservation qua React StrictMode probe; generation owner ngăn phiên join giả chiếm ghế thứ hai và khóa room; cleanup thật vẫn unsubscribe + leave đúng một lần |
| `src/hooks/games/useGameSession.test.ts` | Thêm regression proof StrictMode chỉ gọi `connect` một lần và unmount chỉ `leave` một lần |
| Toàn bộ approved FE boundary | Commit `cf33a18`, 82 files, 987 additions, 11 deletions từ baseline `d083385` |

#### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Guest catalog | Khách chưa đăng nhập | Mở `/vi/game` | 4 trò, mode chips, CTA đăng nhập và setup modal hiển thị đúng | FE GET `/vi/game` 200 | 0 error | FE render 200 | PASS | DOM runtime trước auth |
| Local test auth | `learner@miamia.test` | Email/password → OTP local bypass → quay về `/vi/game` | Hero đổi sang hạng bạn bè và 530 XP; không rơi về dashboard legacy | API/Keycloak local trả session dùng được | 0 error | API tiếp tục healthy | PASS | Authenticated DOM runtime |
| A tạo phòng | Phiên A, nhân vật Mia | Thủ thành từ vựng → Chơi cùng bạn → Tạo phòng → Chọn Mia | Waiting panel có mã phòng và roster `learner` | WebSocket Colyseus `2638` giữ trạng thái WAITING | 0 error | Colyseus process không crash/fail | PASS | Room code runtime được lấy từ UI, không hard-code |
| B vào phòng | Phiên B, nhân vật Max | Nhập mã của A → Vào phòng → Chọn Max | Hai tab chuyển sang `Màn chơi MIA` và `Màn chơi MAX` | Hai connection vào cùng room; cả hai nhận PLAYING snapshots | 0 error | Không còn `room is locked`; service vẫn healthy | PASS | Hai DOM snapshots cùng thời điểm |
| Chơi đến kết quả | Hai phiên | Mỗi phiên trả lời từng vòng đến FINISHED | Cả hai cùng hiện `Ván đấu hòa`, hai dòng score/combo | Snapshot/answer_result tiếp tục đến cả hai client | 0 error | Không có network/terminal failure | PASS | Hai result DOM snapshots |
| Chơi lại | Phiên A phát lệnh, A+B nhận | Nhấn `Chơi lại` ở A | Cả hai cùng quay về canvas MIA/MAX | Restart message và PLAYING snapshot đồng bộ | 0 error | Colyseus tiếp tục chạy | PASS | Hai DOM snapshots sau restart |

#### PROOF

| Command / evidence | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| Focused canonical ESLint cho runtime fixes | PASS, 0 error |
| Focused game Vitest | PASS 17 files, 18/18 tests |
| `npm run build` | PASS, manifest có `/[lang]/game` |
| Backend `npm run build:colyseus` | PASS |
| Backend `npm run lint:check` | PASS exit 0, 0 error; 367 warning lịch sử |
| `git diff --check` trước commit | PASS |
| Browser console hai phiên | 0 error; chỉ có `PressResponder` warning lịch sử từ shell chung |
| FE commit | PASS `cf33a18` |

#### NEED APPROVALS

| Question | Options |
|---|---|
| Canonical lint mirror và full-test debt ngoài r3 | Mở workflow riêng qua FE lint-sync/cleanup; không sửa lẫn vào commit game đã chứng minh |

#### WARNINGS

| Warning | Impact |
|---|---|
| `npm run lint` còn dừng ở canonical mirror drift | Repo-owned full lint chưa xanh; focused canonical lint của mọi runtime fix đã xanh |
| Full FE suite còn 15 lỗi/11 suites lịch sử, 555 tests pass | Không thuộc game boundary; game suite 18/18 xanh |
| Console còn `PressResponder` warning từ shell chung | Không làm hỏng luồng game, nhưng cần cleanup shell riêng |
| Next cảnh báo middleware convention deprecated | Build vẫn PASS; migration riêng |

#### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Bỏ qua lỗi canvas/room lock vì unit tests xanh | Sửa lifecycle thật và thêm StrictMode regression test | Runtime hai phiên là acceptance bắt buộc |
| Tắt React StrictMode | Deduplicate pending reservation trong hook | Giữ framework safety và sửa đúng ownership của connection |
| Giả lập room/session trong UI | Đăng nhập test local và chạy hai browser tabs trên Colyseus thật | Proof phải phản ánh network/runtime thật |

#### OWED

| Owed | Cleared by |
|---|---|
| Live two-session acceptance của Apply r3 | CLEARED — A/B cùng room, PLAYING, FINISHED và restart PASS |
| Canvas bootstrap crash | CLEARED — ready callback sau Phaser `create()` |
| StrictMode khóa ghế thứ hai | CLEARED — pending reservation reuse + regression test |
| Canonical mirror/full historical suite | Chuyển sang workflow cleanup riêng sau approval; không chặn acceptance của feature game |
