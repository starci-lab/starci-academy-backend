<!-- starci-workflow: v2 -->
# Colyseus local runtime readiness

## plan r1

Revision identity: `colyseus-local-runtime-readiness-plan-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia — Nest app `miamia-colyseus`; PostgreSQL primary `mia-mia` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`, HEAD `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Khóa repair để Colyseus lấy port từ metadata sau restart và hai session COUPLE đi qua RankSeason live không lỗi hoặc tạo trùng season |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa backend source trong Plan |

### LIVE EVIDENCE

| Evidence | Result |
|---|---|
| GraphQL schema dump | API `3071` sống; 37 mutation được đọc toàn bộ. Capability này không thêm GraphQL operation vì cửa production là Colyseus WebSocket |
| Nest application identity | `nest-cli.json` có app riêng `miamia-colyseus`, tách khỏi `api` |
| Database identity | `RankService` dùng `@InjectPrimaryPostgreSQLEntityManager()`; bảng live `rank_seasons` hiện rỗng |
| Port authority | `metadata.json` khai báo `ports.colyseus=2638`, base `2567`, offset `+71` |
| Generated env | `.env.override` có `CORE_PORT` nhưng thiếu `COLYSEUS_PORT` |
| Standard start | `npm run start:colyseus` không có `prestart:colyseus`; runtime rơi về default `2567` nếu không truyền env thủ công |
| Forced-offset start | `COLYSEUS_PORT=2638 npm run start:colyseus` boot thành công và log `ColyseusListening port: 2638` |
| Live room create | Token/member hợp lệ chạm server `2638`, nhưng room auth lỗi trước khi tạo room: TypeORM báo `You must provide selection conditions in order to find a single row` |
| Stack trace owner | `RankService.getOrCreateActiveSeason()` gọi `findOne(RankSeasonEntity,{order})`; TypeORM `0.3.28` không cho `findOne` thiếu `where` |
| Existing unit lane | `rank.service.spec.ts` PASS 14/14 vì EntityManager mock không thực thi semantics TypeORM |
| Existing room lane | `vocab-race.int-spec.ts` PASS 9/9 nhưng stub `RankService`, `LearnerProgressService`, JWKS nên không bắt lỗi database live |

### SIBLING AND LAW BINDING

| Decision | Binding evidence |
|---|---|
| Latest season read | `EntityManager.find(RankSeasonEntity,{order:{seasonNumber:'DESC'},take:1})`; không bịa `where` giả để chiều `findOne` |
| Concurrent first writer | Một primary-DB transaction lấy PostgreSQL transaction advisory lock theo stable subject `miamia:rank-season-rollover` trước read/create |
| Transaction seam | `softResetSeason` nhận transactional `EntityManager`; không chạm injected manager từ bên trong transaction theo DATA-4 |
| Port generation | `scripts/sync.mjs` tiếp tục là owner; thêm `COLYSEUS_PORT` vào derived section và `METADATA_OWNED_KEYS` |
| Standard start | `prestart:colyseus` chạy `scripts/sync.mjs --quiet`, cùng pattern với `prestart` và `prestart:dev` |
| Realtime proof | Hai actor được đặt tên, đi qua real socket; chỉ JWKS/identity provider ngoài hệ thống được stub trong E2E |

### PROPOSED FILE TREE

| Path | Action | Holds / shape authority |
|---|---|---|
| `apps/api/src/modules/bussiness/games/rank.service.ts` | MODIFY | Transactional latest-season read, advisory lock, create/rollover và transactional soft reset; mirrors existing EntityManager service and DATA-4 |
| `apps/api/src/modules/bussiness/games/rank.service.spec.ts` | MODIFY | Twin decision cases cho latest query, active/empty/expired branches và transactional manager propagation |
| `apps/api/src/modules/bussiness/games/rank.service.int-spec.ts` | ADD | Real PostgreSQL semantics: empty table, ordered latest read và two concurrent callers produce exactly one season |
| `scripts/sync.mjs` | MODIFY | Derive `COLYSEUS_PORT` from `metadata.ports.colyseus`; stale decrypted value cannot override metadata |
| `scripts/sync.spec.ts` | ADD | Twin generator cases cho emitted port, stale override rejection và absent metadata failure |
| `package.json` | MODIFY | Add `prestart:colyseus` using the same quiet sync prehook as other app starts |
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY | Mark `COLYSEUS_PORT` required in dev and document metadata ownership; preserve unrelated current edits |
| `test/e2e/colyseus-friends-room.e2e-spec.ts` | ADD | Production-boundary flow: two named actors, real primary DB/rank service/socket, create/join/answer/read persisted consequence |
| `test/e2e/helpers/create-colyseus-e2e-app.ts` | ADD | One e2e composition root that boots real Postgres + Colyseus on an ephemeral test port and stubs only external JWKS identity result |

### TEST MATRIX

| Layer | Case | Expected consequence |
|---|---|---|
| Rank unit | No season | Tạo season 1; không soft-reset |
| Rank unit | Latest season vẫn active | Trả đúng row; không create/save |
| Rank unit | Latest season hết hạn | Tạo season kế tiếp và soft-reset standings bằng cùng transactional manager |
| Rank unit | Nhiều season | Query `order seasonNumber DESC`, `take:1`; row mới nhất quyết định |
| Rank integration | Empty primary DB | Không còn TypeORM selection-condition error |
| Rank integration | Hai caller đồng thời trên empty DB | Cả hai resolve cùng một active season; DB chỉ có một row season 1 |
| Rank integration | Hai caller đồng thời tại rollover | Chỉ một season kế tiếp và soft reset không chạy hai lần |
| Sync unit | Metadata `2638` | Generated env chứa đúng một `COLYSEUS_PORT=2638` |
| Sync unit | Decrypted env chứa stale `COLYSEUS_PORT=2567` | Metadata thắng; output vẫn `2638` |
| Sync unit | Metadata thiếu `ports.colyseus` | Generator fail loud; không silently dùng default |
| Start proof | Chạy `npm run start:colyseus` không set env tay | Prehook sync và server log port `2638` |
| E2E step 1 | Actor A/B có identity khác nhau và active membership | Cả hai auth qua socket, không stub RankService |
| E2E step 2 | A tạo COUPLE room | Room WAITING, có room code |
| E2E step 3 | B join code | Cùng roomId, sessionId khác nhau, đúng hai human players, phase PLAYING |
| E2E step 4 | A và B trả lời cùng round | Cả hai nhận snapshot mới; question index tăng, không sleep |
| E2E step 5 | Chạy hết match | Result persistence tồn tại cho đúng hai actor; không chỉ assert response envelope |
| Negative | Actor không membership vào COUPLE | Socket join bị từ chối bằng membership domain failure |
| Negative | Room code không tồn tại | Join fail; không tạo room ngoài ý muốn |

### EXCLUSIONS

| Excluded | Reason |
|---|---|
| GraphQL resolver/mutation mới | Gameplay dùng Colyseus WebSocket service riêng |
| FE game source | Đã nằm trong `tro-choi-ban-be-review-r3`; capability này chỉ dọn backend runtime blocker |
| Port `2567` | Là base port, không phải canonical host port của project offset `+71` |
| Sửa 367 lint warnings hoặc OTP spec cast | Ngoài nguyên nhân live room và stack port |
| Checkout/Premium purchase | Chỉ seed active membership để kiểm chứng entitlement hiện có |

### OUTPUTS

| Concept | Result |
|---|---|
| Runtime readiness brief | Một boundary backend thống nhất cho season concurrency, canonical Colyseus port và two-actor socket proof |
| Service topology | GraphQL API và Colyseus tiếp tục là hai app/process/port riêng |
| Database safety | Season rollover là primary-DB transaction được serialize; không chữa crash bằng read-then-write dễ race |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md` | added — evidence, proposed boundary và test matrix Plan r1 |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt concurrency strategy | Khuyến nghị: PostgreSQL transaction advisory lock + transactional manager, không migration; phương án hẹp hơn chỉ `find(...take:1)` hết crash nhưng vẫn race |
| Chốt E2E identity boundary | Khuyến nghị: stub duy nhất JWKS verify result cho hai token giả, giữ User/Rank/Membership/Postgres/Colyseus real; phương án live Keycloak làm flow phụ thuộc credential local |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree đang có 6 thay đổi Keycloak/E2E của thầy | Apply phải baseline chúng trước và chỉ diff đúng boundary được duyệt; `.stacks/dev/runtime/env/KEYS.md` là path overlap cần preserve từng dòng |
| Migration runner hiện trỏ `src/modules/...` trong monorepo và migrations folder gần như trống | Không đưa schema migration vào repair này; advisory lock tránh mở thêm migration drift |
| Existing room integration stubs internal rank/progress | PASS hiện tại không chứng minh live DB path; phải có E2E real-service mới |
| Full backend watch còn lỗi cast lịch sử ở `otp-challenge.service.spec.ts:34` | Không được gán lỗi đó cho capability này nhưng live terminal vẫn chưa hoàn toàn sạch |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đổi FE hoặc backend về port `2567` | Sinh `2638` từ metadata | `2567` chỉ là base port và sẽ đụng registry offset |
| Chỉ dựa vào room integration 9/9 | Real primary DB + real socket flow | Stub đã che đúng lỗi vừa xuất hiện live |
| Thêm `where` giả vào TypeORM `findOne` | Ordered `find(...take:1)` | Latest season là ordered set lookup, không có predicate hợp lệ |
| Sửa source ngay trong Plan | Chuyển brief sang Review | Lifecycle bắt buộc Plan → Review → Apply |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact transaction/test composition và dirty-path overlap | `starci-be-feature-review` cho `colyseus-local-runtime-readiness-plan-r1` |
| Backend source implementation | Approval một review revision rồi `starci-be-feature-apply` |
| Resume FE Apply r3 two-session acceptance | Standard restart `2638` + E2E/live A/B PASS và append lại workflow design |

## review r1

Revision identity: `colyseus-local-runtime-readiness-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia — Nest app `miamia-colyseus`; PostgreSQL primary `mia-mia` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`, HEAD `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Challenge và freeze transaction, derived-port owner, E2E composition và dirty-path overlap trước Apply |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa backend source trong Review |

### REVIEW VERDICTS

| Plan item | Verdict | Revision |
|---|---|---|
| `find(...take:1)` | KEEP | Là ordered set lookup hợp lệ cho TypeORM 0.3; không bịa predicate |
| Advisory lock | KEEP | Lock nằm trong primary transaction; stable lock subject, không hardcode magic actor/season id |
| `softResetSeason` | REVISE | Nhận transactional `EntityManager` làm tham số và mọi find/update trong rollover dùng manager đó |
| `rank.service.int-spec.ts` | REMOVE | Real DB semantics được chứng minh mạnh hơn trong production-socket E2E; tránh thêm lane chỉ lặp cùng claim |
| `create-colyseus-e2e-app.ts` | REMOVE | Reuse `createE2eApp` cho real Postgres/providers và `@colyseus/testing.boot` cho real socket |
| `scripts/sync.spec.ts` import side-effect file | REMOVE | Không import `sync.mjs` vì file tự chạy `main`; tách derived-port logic thuần |
| Derived port module | ADD | `sync-derived.mjs` export pure sections/ownership; Node spec không cần decrypt hoặc ghi `.env.override` |
| Existing room integration | KEEP UNCHANGED | Giữ test protocol nhanh; E2E mới bù real Rank/DB path thay vì sửa stub lane |
| E2E Jest config | MODIFY | Mirror `useDefineForClassFields:false` để Colyseus schema encode giống production; preserve alias edits hiện có |

### FROZEN PRODUCTION TREE

| Path | Action | Exact change |
|---|---|---|
| `apps/api/src/modules/bussiness/games/rank.service.ts` | MODIFY | `getOrCreateActiveSeason` chạy primary transaction, lấy advisory xact lock, đọc latest bằng ordered `find(...take:1)`, create/rollover và soft reset bằng transactional manager |
| `apps/api/src/modules/bussiness/games/rank.service.spec.ts` | MODIFY | Twin cases cho transaction manager, lock-before-read, empty/active/expired/latest branches và no duplicate create decision |
| `scripts/sync-derived.mjs` | ADD | Pure builder cho metadata-derived runtime keys và metadata-owned key set, gồm `COLYSEUS_PORT` |
| `scripts/sync-derived.spec.mjs` | ADD | Node test cases cho `2638`, stale decrypted override bị từ chối và missing metadata fail loud |
| `scripts/sync.mjs` | MODIFY | Import pure derived builder/owned keys; bỏ local duplicate; output `.env.override` giữ behavior còn lại |
| `package.json` | MODIFY | Add `prestart:colyseus: node scripts/sync.mjs --quiet` và `test:sync: node --test scripts/sync-derived.spec.mjs` |
| `.stacks/dev/runtime/env/KEYS.md` | MODIFY | `COLYSEUS_PORT` required in dev, value owned by metadata; preserve toàn bộ unrelated edits hiện có |
| `test/e2e/jest-e2e.json` | MODIFY | Giữ alias `apps/api/src/...`; thêm `useDefineForClassFields:false` trong ts-jest config cho Colyseus schema |
| `test/e2e/colyseus-friends-room.e2e-spec.ts` | ADD | Named two-actor flow qua real socket, real primary DB/User/Membership/Rank/Progress/Mastery/ReviewQueue; chỉ stub external JWKS result |

### FROZEN E2E COMPOSITION

| Layer | Real / stub | Proof |
|---|---|---|
| Colyseus transport, rooms, snapshots | REAL | `@colyseus/testing.boot`, clients create/join/send qua WebSocket |
| PostgreSQL and entities | REAL | Existing E2E Testcontainers global setup + `createE2eApp` primary module |
| `LearnerProgressService`, `RankService`, `GameMasteryService`, `ReviewQueueService` | REAL | Register real providers against primary manager; no hand-written internal stubs |
| Membership gate | REAL | Seed two named users + active memberships, then negative actor without membership |
| Keycloak/JWKS network | STUB EXTERNAL RESULT ONLY | Token A/B maps to two distinct verified claims; no real local credential dependency |
| Time waits | POLL | `until`/next patch with deadline; no fixed sleep assertion |
| Consequence | REAL DB READBACK | One season under concurrent first entry; finished match rows/results belong to both actors |

### FROZEN TEST MATRIX

| Gate | Cases |
|---|---|
| Rank unit | Lock runs before latest read; empty creates #1; active returns unchanged; expired creates #N+1; soft reset uses transactional manager; transaction failure does not write outside transaction |
| Sync pure spec | Metadata `2638` emits once; stale `2567` cannot override; missing/non-number colyseus port throws; other derived keys remain unchanged |
| Standard start | Remove generated `.env.override` only in isolated proof copy or regenerate safely; `npm run start:colyseus` prehook writes port and server listens `2638` without manual env |
| Two-actor E2E | A/B concurrently enter first game path and DB contains one season; clean rooms; A creates COUPLE; B joins code; same room/different session IDs/two humans/PLAYING; both answer; round advances; finish persists both results |
| Negative E2E | No-membership actor rejected; unknown room code rejected without creating room |
| Regression | Existing 14 Rank tests, 9 room integration tests, backend lint/build/unit/E2E remain green |

### APPLY BOUNDARY SAFETY

| Existing dirty path | Apply handling |
|---|---|
| `.stacks/dev/runtime/env/KEYS.md` | Baseline commit captures current user edits; Apply changes only COLYSEUS row/note and verifies hunk |
| `test/e2e/jest-e2e.json` | Baseline commit captures alias correction; Apply adds only Colyseus compiler option and preserves aliases |
| `.stacks/dev/runtime/env/services.env.enc`; Keycloak encrypted files; `scripts/provision-keycloak.ts` | Baseline-only, no Apply diff |
| Generated `.env.override` | Ignored runtime proof artifact; never commit hoặc log secret values |

### OUTPUTS

| Concept | Result |
|---|---|
| Review r1 | Boundary gọn: transactional season repair, pure derived-port owner và one real-socket two-actor E2E |
| Concurrency policy | Không chấp nhận minimal crash-only fix; first writer và rollover được serialize ở primary DB transaction |
| External boundary | Chỉ JWKS provider response được stub; game/rank/membership/persistence giữ thật |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md` | modified — append Review r1 verdicts, frozen tree, E2E composition và overlap safety |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review | Duyệt `colyseus-local-runtime-readiness-review-r1` để Apply đúng 9 paths; hoặc phản hồi transaction/E2E/boundary cần đổi |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply baseline sẽ chứa 6 thay đổi đang dở của thầy | Commit baseline không đồng nghĩa các file đó thuộc implementation; tracked Apply diff phải bắt đầu sau baseline |
| `KEYS.md` và `jest-e2e.json` overlap worktree | Hunk ngoài exact reviewed change bị từ chối và phải giữ nguyên |
| Advisory lock là PostgreSQL-specific | Phù hợp primary datasource hiện tại; test unit không đủ, real-Postgres E2E bắt buộc |
| Full E2E boot có thể phát hiện dependency mới ngoài frozen tree | Không tự thêm file; quay lại Review nếu composition thật cần owner/path khác |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| New `rank.service.int-spec.ts` | Rank twin unit + real-socket E2E trên Testcontainers | Tránh hai test cùng chứng minh một DB claim |
| New `create-colyseus-e2e-app.ts` | Reuse `createE2eApp` + inline Colyseus boot | Existing composition root đã sở hữu primary DB lifecycle |
| Import `sync.mjs` vào Jest | Pure `sync-derived.mjs` + Node spec | `sync.mjs` chạy main và có decrypt/write side effects khi import |
| Live Keycloak trong deterministic E2E | Stub JWKS external result cho token A/B | E2E phải ổn định, không lệ thuộc local credential/IdP |
| Minimal `find(...take:1)` không lock | Serialized transaction | Hai first writers vẫn có thể tạo trùng season |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval Review r1 | Feedback của thầy |
| Baseline commit và exact implementation | `starci-be-feature-apply` sau approval |
| FE design Apply r3 live acceptance | Backend Apply PASS rồi rerun `/vi/game` authenticated A/B và append design workflow |

Approved revision: `colyseus-local-runtime-readiness-review-r1`

## apply r1

Applied revision: `colyseus-local-runtime-readiness-review-r1`

Baseline commit: `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead`

Tracked diff: `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia — Nest app `miamia-colyseus`; PostgreSQL primary `mia-mia` |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main`; baseline `a2896be8672c68c5ced9e2ce26a50fb5ccea0ead` |
| Purpose | Apply exact transactional season, derived Colyseus port và two-actor real-socket E2E boundary đã duyệt |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\colyseus-local-runtime-readiness.md |
| Language | vi |
| Phase | apply |
| Touching | 9 frozen backend paths + workflow record |

### OUTPUTS

| Concept | Result |
|---|---|
| Season safety | Latest season lookup hợp lệ với TypeORM và được serialize bằng PostgreSQL transaction advisory lock |
| Canonical runtime port | Colyseus port do `metadata.json` sở hữu; standard start tự sync rồi listen `2638` |
| Friends-room proof | Hai identity trong E2E và hai live client session cùng đi qua socket thật, room thật và persistence thật |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/bussiness/games/rank.service.ts` | modified — transaction + advisory xact lock; ordered `find(...take:1)`; create/rollover/soft-reset dùng cùng transactional manager |
| `apps/api/src/modules/bussiness/games/rank.service.spec.ts` | modified — 16 twin cases; thêm lock order, transaction propagation và failure không ghi ngoài transaction |
| `scripts/sync-derived.mjs` | added — pure metadata-derived sections, `COLYSEUS_PORT` validation và metadata-owned resolution |
| `scripts/sync-derived.spec.mjs` | added — 4 Node tests cho `2638`, stale override, invalid metadata và regression keys |
| `scripts/sync.mjs` | modified — import pure derived owner; bỏ local duplicate; giữ nguyên decrypt/write lifecycle |
| `package.json` | modified — thêm `test:sync` và `prestart:colyseus` |
| `.stacks/dev/runtime/env/KEYS.md` | modified — tách `COLYSEUS_PORT` thành required metadata-owned key; giữ `COLYSEUS_REDIS` optional |
| `test/e2e/jest-e2e.json` | modified — giữ alias `apps/api/src/...`; thêm `useDefineForClassFields:false` |
| `test/e2e/colyseus-friends-room.e2e-spec.ts` | added — real Postgres + real socket, two named actors, membership gate, unknown room và DB result readback |

### VERIFICATION

| Gate | Result |
|---|---|
| Pure sync | PASS `4/4` |
| Rank focused unit | PASS `16/16` |
| Existing room integration | PASS `9/9` |
| New friends-room E2E | PASS `4/4`; Postgres Testcontainer + Colyseus transport thật |
| Full unit | PASS `110/110` suites, `533/533` tests |
| Focused lint | PASS `0 errors, 0 warnings` trên ba TS path Apply |
| Full lint check | PASS error gate: `0 errors`; còn `367` warning lịch sử |
| API build | PASS |
| Colyseus standard start | PASS prehook; listen `2638`; bootstrap ready |
| Live socket | PASS: cùng room, hai session khác nhau, đủ hai người; test token/secret không xuất log |
| Colyseus frozen build | FAIL bởi lỗi ngoài boundary có trước: `apps/api/src/modules/code/otp-challenge.service.spec.ts:34` cast `redis as Redis` (`TS2352`) |

### NEED APPROVALS

| Question | Options |
|---|---|
| Exact implementation boundary | Đã được duyệt bằng `colyseus-local-runtime-readiness-review-r1` |
| Lỗi OTP ngoài frozen tree | Cần một Review/Apply riêng nếu thầy muốn dọn để `build:colyseus` xanh tuyệt đối; Apply này không tự mở rộng path |

### WARNINGS

| Warning | Impact |
|---|---|
| Watch type-checker vẫn báo `otp-challenge.service.spec.ts:34` | Runtime vẫn bootstrap/listen và live socket PASS, nhưng không được tuyên bố frozen build sạch |
| `npm run sync -- --quiet` cảnh báo 13 required key name thiếu trong generated override và một `GOOGLE_CLIENT_ID` không được config đọc | Không lộ value; `COLYSEUS_PORT=2638` vẫn generated đúng. Manifest drift này ngoài boundary r1 |
| Negative membership E2E ghi domain exception vào console | Expected rejection; suite PASS và không phải transport/network failure |
| Existing room integration ghi message-handler warning và open-handle notice | Suite `9/9` PASS; warning thuộc test cũ, E2E mới không dựa vào lane stub này để chứng minh DB |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa OTP cast trong Apply này | Ghi blocker và route workflow riêng | Path không nằm trong frozen 9-file boundary |
| Đặt tay `COLYSEUS_PORT` trước start | Chạy đúng `npm run start:colyseus` | Phải chứng minh standard prehook sinh port từ metadata |
| Chỉ dùng cùng một fake actor trong E2E | Seed An/Bình thành hai user + membership khác nhau | Chứng minh persistence và identity boundary thật |
| Log token hoặc secret để debug | Chỉ log verdict không nhạy cảm | Credential không được xuất terminal/workflow |

### OWED

| Owed | Cleared by |
|---|---|
| Colyseus build xanh tuyệt đối | Review/Apply riêng cho historical OTP spec cast, hoặc approval mở rộng boundary |
| Resume FE `tro-choi-ban-be-review-r3` acceptance | Dùng backend standard runtime `2638` vừa chứng minh để rerun UI hai session và append design workflow |
| Final Apply closure | Re-run frozen build sau khi blocker ngoài boundary được xử lý; hiện source/runtime readiness đã PASS nhưng build gate chưa đóng |

### CLOSURE UPDATE — OTP BUILD BLOCKER CLEARED

| Evidence | Result |
|---|---|
| Owning workflow | `lint/miamia/colyseus-build-otp-cast.md`, approved revision `colyseus-build-otp-cast-review-r1` |
| Backend baseline | `72a8f7ff4e5bba25a0736b7e7687e1d57efcb840` |
| `npm run build:colyseus` | PASS, webpack compile thành công; không còn `TS2352` |
| `npm run build` | PASS |
| `npm run test:unit -- --runInBand` | PASS `110/110` suites, `533/533` tests |
| `npm run lint:check` | PASS error gate: `0 errors`, `367 warnings` đúng baseline |
| Readiness verdict | CLOSED — transaction, port sync, real-socket E2E, standard runtime và frozen build đều đã PASS |
