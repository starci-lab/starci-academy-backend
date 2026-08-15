<!-- starci-workflow: v2 -->
# topic-linked-practice-session

## plan r1

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
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`420b059`) |
| Purpose | Cho `recordPractice` ghi topic thật vào study session để `continueLearning.topic` resume đúng |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa product source |

App: Nest project `api` trong `nest-cli.json`; không chạm `miamia-colyseus`.

Database: Primary PostgreSQL qua `@InjectPrimaryPostgreSQLEntityManager()`; bảng `study_sessions` đã có nullable FK `topic_id`, nên không cần migration/entity change.

### OBJECTIVE

Nâng input `recordPractice` bằng `topicSlug`, xác thực topic publish và toàn bộ phrase trong batch thuộc topic đó, rồi cập nhật mastery, insert topic-linked study session và ghi XP/Points trong cùng transaction. `continueLearning` tiếp tục đọc live từ `study_sessions.topic_id`, không thêm projection hay cache.

### SCHEMA EVIDENCE

Schema live được dump không lọc tại `http://localhost:3071/graphql`.

| Kind | Every live name | Verdict |
|---|---|---|
| Query | `me`, `systemConfig`, `systemHealthStatus`, `checkEmailExists`, `mySessions`, `userProfile`, `suggestedUsers`, `userFollowers`, `userFollowing`, `myNotifications`, `myUnreadNotificationCount`, `papers`, `paperDetail`, `learnTopics`, `topicDetail`, `myAttempts`, `suggestStudy`, `onboarding`, `progressSummary`, `phrasePractice`, `gameLeaderboard`, `rankLeaderboard`, `examPrograms`, `friendsLeaderboard`, `continueLearning`, `wrapped`, `communityChatConversation`, `chatMessages`, `chatbotSessions`, `chatbotSessionMessages` | `phrasePractice` tạo set theo topic; `continueLearning` là read-back cần chứng minh |
| Mutation | `submitContact`, `gradePaper`, `saveOnboarding`, `recordPractice`, `recordAttemptEvents`, `connectGithubAccount`, `exchangeCodeForToken`, `refreshToken`, `signOut`, `revokeSession`, `signInInit`, `signInVerifyOtp`, `signInResendOtp`, `forgotPasswordInit`, `forgotPasswordResendOtp`, `forgotPasswordVerifyOtp`, `signUpInit`, `signUpVerifyOtp`, `signUpResendOtp`, `purchaseMembership`, `updateProfile`, `generateAvatarPresignUrl`, `verifyAvatarPresignUrl`, `setupTwoFactor`, `confirmTwoFactor`, `disableTwoFactor`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `setFollow`, `sendChatMessage`, `blockUser`, `unblockUser`, `reportContent`, `openDirectConversation`, `touchPresence`, `askChatbot`, `createChatbotSession`, `deleteChatbotSession`, `buyStreakFreeze`, `purchaseShopItem` | Sửa `recordPractice`; không tạo mutation trùng |

### SOURCE EVIDENCE

| Fact | Source | Consequence |
|---|---|---|
| `RecordPracticeRequest` hiện chỉ có `results` | `record-practice/graphql-types/request.ts` | Client chưa gửi topic identity |
| Resolver gọi thẳng `PracticeService.recordResults(user.id, results)` | `record-practice.resolver.ts` | Operation là odd-one-out, chưa theo CQRS canon |
| `recordResults` insert `StudySessionEntity` không có `topic` | `practice.service.ts` | `continueLearning.topic` không thấy phrase practice vừa hoàn thành |
| `ContinueLearningService` chỉ chọn session có `topic: Not(IsNull())` | `continue-learning.service.ts` | Chỉ cần ghi FK đúng; không đổi query/response |
| Entity đã có `topic: TopicEntity | null` và FK `topic_id` | `study-session.entity.ts` | Không migration |
| `connect-github-account` có command → handler `process` → thin service → resolver → module → twin spec | Sibling operation folder | Mirror family này thay vì nối logic vào resolver |
| Unknown phrase hiện bị bỏ qua nhưng `phrasesStudied` vẫn trả độ dài input | `practice.service.ts`; `verify-practice-e2e.ts` | Khi có topic identity phải khóa mixed/forged batch, nếu không session fact sai |

### PROPOSED CONTRACT

```graphql
input RecordPracticeRequest {
  topicSlug: String!
  results: [PracticeResultInput!]!
}
```

Output giữ nguyên `phrasesStudied` và `phrasesKnown`; `continueLearning` giữ nguyên shape. `topicSlug` là bắt buộc vì mutation này ghi một topic-scoped session; mixed review cần operation riêng thay vì gửi topic giả/null.

### PROPOSED FILE TREE

| Action | Path | Responsibility / shape evidence |
|---|---|---|
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.types.ts` | `RecordPracticeResult` và normalized result types; tránh handler phụ thuộc GraphQL object |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.command.ts` | Message `{user, request}`; mirror `connect-github-account.command.ts` |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.ts` | Toàn bộ decision + primary PostgreSQL transaction; override `process`; set `topic:{id}` khi insert session |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.spec.ts` | Twin spec cho mọi branch/transaction consequence |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.service.ts` | Thin `CommandBus.execute(new RecordPracticeCommand(...))` |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/graphql-types/request.ts` | Thêm required `topicSlug` với string/slug validation; giữ max 100 results |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.ts` | Inject thin service và dispatch `{user, request}`; giữ auth/throttle/envelope/output |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.spec.ts` | Twin door spec cho mapping user/request và response passthrough |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.module.ts` | Register resolver, service, handler |
| MODIFY | `apps/api/src/modules/bussiness/exam/practice.service.ts` | Xóa `recordResults`/write imports; giữ duy nhất `buildSet` và option placement read behavior |
| MODIFY | `apps/api/src/modules/bussiness/exam/exam.module.ts` | Sửa owner comment: `XpLedgerService` được RecordPracticeHandler dùng; exports giữ nguyên |
| ADD | `apps/api/src/modules/exceptions/errors/exam/practice-phrase-outside-topic.ts` | Domain exception metadata `{topicSlug, phraseIds}` cho unknown/mixed-topic input |
| MODIFY | `apps/api/src/modules/exceptions/errors/exam/index.ts` | Export exception mới |
| MODIFY | `test/e2e/progress.e2e-spec.ts` | Migrate 5 call sites khỏi method bị xóa; giữ nguyên progress consequences |
| ADD | `test/e2e/practice-topic-resume.e2e-spec.ts` | Flow qua GraphQL transport thật trên PostgreSQL thật: phrasePractice → recordPractice → continueLearning → DB read-back |
| MODIFY | `scripts/verify-practice-e2e.ts` | Live runtime call gửi `topicSlug`; assert mutation và `continueLearning.topic.slug` |

Không đổi `StudySessionEntity`, `ContinueLearningService`, GraphQL output objects hoặc schema migration.

### HANDLER DECISIONS

| Step | Decision |
|---|---|
| Empty results | Trả `{phrasesStudied:0, phrasesKnown:<current total>}` hoặc giữ zero/zero theo approval; không tạo session/ledger |
| Topic lookup | Chỉ topic publish theo exact slug; thiếu/unpublished → `TopicNotFoundException` |
| Phrase scope | Load unique IDs scoped theo topic; bất kỳ unknown/out-of-topic ID → reject toàn batch trước transaction |
| Mastery | Đúng: streak +1, known tại 3; sai: streak 0, known false; mỗi phrase input được xử lý một lần |
| Atomicity | Mastery + topic-linked session + session XP/Points + topic-completion ledger cùng transaction |
| Response | `phrasesStudied` là số phrase hợp lệ đã ghi; `phrasesKnown` là total known sau commit |
| Resume | Không gọi/chỉnh `ContinueLearningService`; read-back từ FK vừa ghi |

### TEST MATRIX

| Lane | Case | Consequence asserted |
|---|---|---|
| Handler twin | Empty batch | Không transaction/session/ledger; response theo rule được duyệt |
| Handler twin | Topic không tồn tại hoặc unpublished | `TopicNotFoundException`; không write |
| Handler twin | Một phrase unknown | `PracticePhraseOutsideTopicException`; toàn batch rollback/no write |
| Handler twin | Một phrase thuộc topic khác | Cùng exception với offending IDs; không tạo session sai topic |
| Handler twin | Mixed valid + invalid | All-or-nothing; valid phrase cũng không tăng mastery |
| Handler twin | Correct với streak 0/1/2 | Sau lần 1/2 chưa known; lần 3 known |
| Handler twin | Incorrect sau known | Streak reset 0 và `isKnown=false` |
| Handler twin | Existing mastery / first mastery | Update đúng row cũ / insert đúng row mới |
| Handler twin | Topic vừa đạt 100% | Topic-completion ledger một lần trong transaction |
| Handler twin | Topic chưa đủ 100% | Không grant topic completion |
| Handler twin | Transaction collaborator fail | Không còn mastery/session/ledger commit một phần |
| Handler twin | Hai writer đồng thời cho cùng phrase | Không lost update; mỗi accepted request là một session riêng theo current contract |
| Resolver twin | Authenticated user + request | Forward nguyên `topicSlug/results`; return result unchanged |
| Validation | Malformed/missing slug, non-UUID phrase, >100 results | GraphQL validation rejects trước handler |
| Flow e2e | Fetch public practice set, authenticated record | GraphQL response đúng và DB có mastery + một session với exact `topic_id` |
| Flow e2e | Query `continueLearning` sau record | `data.topic.slug` bằng topic vừa học |
| Flow e2e negative | Batch chứa phrase topic khác | GraphQL stable exception code; DB không đổi |
| Live call | Test account trên runtime local | Network không GraphQL errors; mutation → continueLearning PASS |

### ACCEPTANCE COMMANDS

| Gate | Command / evidence |
|---|---|
| Focused unit | `npm test -- --runInBand record-practice` |
| Related unit | `npm test -- --runInBand practice` |
| Flow | `npm run test:e2e:docker -- --runInBand test/e2e/practice-topic-resume.e2e-spec.ts` |
| Type/build/lint | `npm run build`; `npm run lint:check` |
| Full unit | `npm test -- --runInBand` |
| Live | `npm run verify:practice` against app `api` + primary PostgreSQL + local test account; capture terminal/network result in workflow |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Boundary |
|---|---|
| Pause/save | Không có mutation; ngoài capability này |
| Grammar/mixed review | Không gắn topic giả; cần operation riêng khi backend owner tồn tại |
| XP response delta | Không thêm field; ledger vẫn ghi nhưng response contract giữ nguyên |
| Idempotency key | Chưa có request/session key; concurrent accepted calls vẫn là hai sessions |
| Frontend Apply | Chưa chạy; FE phải gửi `topicSlug` sau khi backend contract được Apply và live-proven |

### OUTPUTS

| Concept | Result |
|---|---|
| Topic-linked practice session r1 | `recordPractice` trở thành topic-scoped CQRS command và `continueLearning` đọc lại đúng topic vừa học |
| Architecture | GraphQL door → thin service → command/handler → một primary PostgreSQL transaction; không mutation/query trùng |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | added — schema evidence, exact file tree, decision/test matrix và acceptance gates tiếng Việt |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | modified — `hoc-on-tap-review-r1` chuyển từ Candidate sang Approved theo feedback của thầy |

### NEED APPROVALS

| Question | Options |
|---|---|
| Invalid/mixed phrase batch | Khuyến nghị: reject toàn batch bằng stable domain exception; hoặc giữ legacy ignore-invalid (session count/topic fact có thể sai) |
| Empty batch response | Khuyến nghị: giữ legacy `{0,0}` và không write; hoặc trả current total known dù không có practice |
| Concurrent duplicate submissions | Khuyến nghị trong scope này: khóa update để không lost streak nhưng coi hai request là hai sessions; hoặc mở rộng contract thêm idempotency key trước Review |

### WARNINGS

| Warning | Impact |
|---|---|
| `recordPractice` hiện là odd-one-out gọi business service trực tiếp | Plan có refactor CQRS trong đúng operation boundary, nên diff lớn hơn việc thêm một field |
| Backend worktree đang dở local OTP, stack env và exam import | Apply phải baseline commit nguyên trạng trước source write và preserve mọi thay đổi đó |
| Existing `progress.e2e-spec.ts` gọi internal service trực tiếp | Phải migrate call sites; flow mới riêng sẽ vào GraphQL transport thật |
| Không có idempotency key hiện tại | Retry/double-submit có thể tạo hai sessions và hai session-ledger grants dù FE khóa nút |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tạo mutation mới `recordTopicPractice` | Nâng existing `recordPractice` | Schema đã có đúng owner; mutation thứ hai làm hai write paths drift |
| Suy topic từ phrase đầu tiên | Required `topicSlug` + validate toàn batch | Mixed/forged batch có thể ghi sai history |
| Chỉ thêm `topic` vào insert trong `PracticeService` | Chuyển write operation sang CQRS sibling shape | Canon yêu cầu decision ở handler, resolver/service không làm work |
| Sửa `continueLearning` để đoán topic | Ghi FK đúng tại mutation source | Read path hiện đã đúng và không cần heuristic |

### OWED

| Owed | Cleared by |
|---|---|
| Chốt ba product rules trong NEED APPROVALS và challenge exact boundary | `starci-be-feature-review` |
| Approved revision trước backend source write | Explicit approval sau Review |
| Baseline commit trước Apply | `starci-be-feature-apply` sau approval |
| FE gửi `topicSlug` và runtime user-flow test | `starci-fe-design-apply` sau backend live proof |

## review r1

Approved revision: `topic-linked-practice-session-review-r1`

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
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`420b059`) |
| Purpose | Review và khóa revision triển khai topic-linked practice session |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ append workflow này; không sửa product source |

### LOCKED PRODUCT RULES

| Rule | Review verdict |
|---|---|
| Mixed/unknown phrase | Reject toàn batch bằng domain exception; không mastery/session/ledger write |
| Empty results | Validate topic identity, trả `{phrasesStudied:0, phrasesKnown:0}`, không session/ledger write |
| Idempotency | Không thêm key; hai accepted requests là hai sessions |
| Topic identity | `topicSlug` required; topic phải publish; không suy từ phrase đầu tiên |

### REVIEW FINDINGS

| Finding | Evidence | Revision |
|---|---|---|
| Plan chưa định nghĩa duplicate phrase trong cùng batch | Input là array và current loop tăng streak theo từng row | Reject duplicate IDs; không dedupe âm thầm vì hai row có thể mang hai giá trị `correct` khác nhau |
| Pessimistic lock mastery row không đủ cho first insert | `phrase_masteries` có unique `(user, phrase)` nhưng row chưa tồn tại thì không lock được | Với non-empty batch, lock `UserEntity` của learner bằng `pessimistic_write` trong transaction; mọi practice write của cùng learner được serialize |
| Topic/scope validation ngoài transaction có TOCTOU seam | Topic có thể unpublished/deleted giữa read và insert | Topic lookup, phrase-scope validation, mastery, session và ledger cùng transactional manager |
| `progress.e2e` đang gọi internal `PracticeService` | Năm `recordResults` call sites, trái transport/e2e canon | Xóa hai practice cases khỏi file progress và chuyển toàn bộ consequences sang GraphQL flow mới; không thay bằng một internal call khác |
| Plan flow command trộn `--maxWorkers=3` với `--runInBand` | `test:e2e:docker` đã đóng cứng maxWorkers | Focused flow dùng `npm run test:e2e:docker -- test/e2e/practice-topic-resume.e2e-spec.ts` |
| GraphQL e2e phải giữ auth policy thật | Guard hiện verify token, resolve user và assert session | Giữ `KeycloakAuthGraphQLGuard`; chỉ stub external JWKS verification và session store outcome, rồi gửi Bearer header thật qua HTTP |

### APPROVED PRODUCTION BOUNDARY CANDIDATE

| Action | Exact path | Final responsibility |
|---|---|---|
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.types.ts` | Result/normalized data types |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.command.ts` | Message carrying authenticated learner and request |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.ts` | All validation, learner lock, mastery/session/ledger transaction và result |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.spec.ts` | Twin decision specs |
| ADD | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.service.ts` | Thin CommandBus dispatch |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/graphql-types/request.ts` | Required validated `topicSlug`; existing results validation |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.ts` | Door dispatches through thin service; transport annotations unchanged |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.spec.ts` | Assert exact user/request forwarding and passthrough |
| MODIFY | `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.module.ts` | Register resolver, service, handler |
| MODIFY | `apps/api/src/modules/bussiness/exam/practice.service.ts` | Remove write path/types/imports; retain public practice-set read behavior |
| MODIFY | `apps/api/src/modules/bussiness/exam/exam.module.ts` | Correct XpLedger owner documentation; exports unchanged |
| ADD | `apps/api/src/modules/exceptions/errors/exam/practice-phrase-outside-topic.ts` | Stable exception for unknown/out-of-topic IDs |
| ADD | `apps/api/src/modules/exceptions/errors/exam/practice-phrase-repeated.ts` | Stable exception for duplicate IDs |
| MODIFY | `apps/api/src/modules/exceptions/errors/exam/index.ts` | Export both exceptions |
| MODIFY | `test/e2e/progress.e2e-spec.ts` | Remove `PracticeService` provider/import and two practice cases now owned by transport flow |
| ADD | `test/e2e/practice-topic-resume.e2e-spec.ts` | Real GraphQL + primary PostgreSQL flow and negative rollback case |
| MODIFY | `scripts/verify-practice-e2e.ts` | Send `topicSlug`; assert mutation, DB-facing result and `continueLearning.topic.slug` on live runtime |

Explicitly excluded: `StudySessionEntity`, `PhraseMasteryEntity`, `ContinueLearningService`, GraphQL output objects, migrations, app root, stack/env files, FE source and idempotency schema.

### HANDLER ALGORITHM

| Order | Exact behavior |
|---|---|
| 1 | Validate GraphQL shape: slug pattern, UUID phrase IDs, max 100 |
| 2 | Handler resolves published topic by exact slug; missing/unpublished throws `TopicNotFoundException`, kể cả empty batch |
| 3 | Empty results returns exact zero/zero with no transaction write |
| 4 | Reject duplicate phrase IDs before writes using `PracticePhraseRepeatedException` |
| 5 | Start primary PostgreSQL transaction; lock learner row `pessimistic_write` |
| 6 | Reload topic and all submitted phrases through transactional manager; any missing/out-of-topic ID throws `PracticePhraseOutsideTopicException` |
| 7 | Update or insert one mastery row per unique phrase, preserving threshold 3/reset semantics |
| 8 | Insert one `StudySessionEntity` with exact topic relation, accepted result count and learner |
| 9 | Session grant and any topic-completion grant use same transactional manager |
| 10 | Commit, then count total known and return unchanged output shape |

### TEST MATRIX R1

| Lane | Cases frozen |
|---|---|
| Handler twin | published/missing/unpublished topic; empty valid topic; duplicate same/split-correctness ID; unknown ID; other-topic ID; mixed valid-invalid rollback; first/update mastery; streak 1/2/3; miss reset; session exact topic; session/topic ledger grant/no-grant; collaborator failure rollback |
| Concurrency integration | Hai non-empty commands cùng learner chạy song song: learner lock prevents lost streak; two accepted calls produce two sessions; unique mastery row remains one |
| Resolver twin | Guarded request forwards full `user` + `topicSlug/results`; service error is not swallowed; response unchanged |
| GraphQL flow | Public `phrasePractice`; Bearer-authenticated `recordPractice`; DB mastery/session read-back; authenticated `continueLearning` returns exact topic |
| GraphQL negative | Other-topic phrase returns stable exception code and leaves mastery/session/ledger counts unchanged |
| Live runtime | Local test account: fetch set → record → continue query; capture HTTP status, GraphQL errors, response fields và terminal/network failures |

E2E auth keeps the production `KeycloakAuthGraphQLGuard`. The test replaces only `KeycloakJwksService.verifyAccessToken` with a realistic active claim and `SessionService.assertCurrent` with the external session-store outcome; HTTP still enters Apollo GraphQL with `Authorization: Bearer e2e-token`, the guard resolves the real seeded `UserEntity`, and resolvers receive it through `KeycloakGraphQLUser`.

### ACCEPTANCE GATES R1

| Gate | Exact command / pass meaning |
|---|---|
| Focused unit | `npm test -- --runInBand record-practice.handler.spec.ts record-practice.resolver.spec.ts practice.spec.ts` — every decision branch green |
| Flow | `npm run test:e2e:docker -- test/e2e/practice-topic-resume.e2e-spec.ts` — GraphQL transport + real PostgreSQL consequences green |
| Related flow | `npm run test:e2e:docker -- test/e2e/progress.e2e-spec.ts` — remaining progress flow green after owner split |
| Static | `npm run build`; `npm run lint:check` — zero error, no suppression |
| Full unit | `npm test -- --runInBand` — full unit project green |
| Live | `npm run verify:practice` against local `api`/primary PostgreSQL/test account — mutation and resume query pass with no network/GraphQL failure |

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate r1 | Existing `recordPractice` becomes one topic-scoped CQRS transaction; no duplicate mutation, heuristic resume hoặc migration |
| Concurrency meaning | No idempotency key; per-learner lock prevents lost mastery while two accepted requests remain two sessions |
| Proof meaning | Unit proves decisions, GraphQL e2e proves wiring/persistence, live test proves real local auth/runtime |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | modified — append Review r1 với exact boundary, algorithm, test/auth flow và acceptance gates; chưa sửa source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duplicate phrase ID trong một batch | Khuyến nghị: reject toàn batch bằng `PracticePhraseRepeatedException`; hoặc chấp nhận last-row-wins (làm mastery phụ thuộc thứ tự payload) |
| Chốt exact Review revision | Duyệt `topic-linked-practice-session-review-r1` cùng rule reject duplicate; hoặc feedback để tạo r2 |

### WARNINGS

| Warning | Impact |
|---|---|
| Required `topicSlug` là breaking input change | Existing FE và `verify-practice-e2e.ts` phải đổi cùng capability rollout; FE Apply chỉ chạy sau backend live proof |
| Không có idempotency key theo quyết định đã duyệt | Retry thật sự có thể nhận hai session grants; lock chỉ bảo vệ mastery consistency |
| Backend worktree có thay đổi dở ngoài boundary | Apply phải baseline commit trước write và track diff từ baseline; không được sửa/loại các thay đổi đó |
| Whole e2e suite có nhiều historical direct-internal flows | Revision chỉ sửa `progress.e2e` vì nó là consumer trực tiếp; không mở audit toàn suite |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Legacy ignore invalid/mixed phrase | Stable exception và rollback toàn batch | “reject mixed batch” |
| Empty trả current known | Exact zero/zero, no writes | “empty trả 0/0” |
| Thêm idempotency key | Per-learner transaction lock; accepted requests vẫn riêng | “chưa thêm idempotency key” |
| Migrate practice e2e sang một internal CQRS/service call khác | Chuyển practice consequences sang GraphQL transport flow | E2E phải vào production door |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho duplicate rule và exact revision | Feedback của thầy: `Duyệt topic-linked-practice-session-review-r1, reject duplicate` |
| Ghi `Approved revision` trước Apply | Cùng workflow sau explicit approval |
| Baseline commit và source implementation | `starci-be-feature-apply` sau approval |
| FE Study Apply | Backend live proof rồi `starci-fe-design-apply` |

## review r2

Approved revision: `topic-linked-practice-session-review-r2`

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
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`ee65e40`) |
| Purpose | Sửa acceptance identity theo production GraphQL envelope trước source write |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ append workflow này; production source vẫn chưa sửa |

Baseline commit đã được tạo đúng đầu Apply: `ee65e40b09cbef0bb5fc49274d14d5733de29420`. `git diff ee65e40` hiện rỗng.

### FINDING

`GraphQLTransformInterceptor` production bắt exception rồi trả GraphQL data envelope `{success:false, message, error:err.name}`. Vì vậy assertion “GraphQL `extensions.code`” của Review r1 không thể xảy ra nếu không sửa global interceptor ngoài boundary.

### REVISION DELTA

| Item | r1 | r2 |
|---|---|---|
| Internal handler identity | `PracticePhraseOutsideTopicException.code` và `PracticePhraseRepeatedException.code` | Giữ nguyên; twin specs assert exact exception class/code |
| GraphQL negative identity | Assert `extensions.code` | Assert production envelope `success:false`, `error:"PracticePhraseOutsideTopicException"` hoặc `error:"PracticePhraseRepeatedException"` |
| Persistence negative proof | DB unchanged | Giữ nguyên: mastery/session/ledger counts không đổi |
| Production files | 17 exact paths | Không đổi |
| Global interceptor | Không named | Explicitly excluded; không sửa |
| Duplicate rule | Candidate reject | Đã được thầy duyệt: reject duplicate |

Mọi algorithm, concurrency lock, CQRS tree, test matrix và command của Review r1 giữ nguyên. Apply sẽ cite r2 và vẫn track từ baseline `ee65e40`.

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate r2 | Giữ exact capability r1 nhưng chứng minh negative GraphQL theo envelope production thật, không mở rộng global transport |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | modified — append transport finding, unchanged source boundary và revised negative proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review r2 | Duyệt `topic-linked-practice-session-review-r2` để tiếp tục Apply từ baseline `ee65e40`; hoặc mở capability riêng để đổi global GraphQL error envelope |

### WARNINGS

| Warning | Impact |
|---|---|
| GraphQL envelope chỉ expose exception class name, không domain code | FE hiện branch theo envelope hiện tại; đổi global transport phải là feature/audit riêng |
| Baseline commit đã tạo trước finding | Không có source diff sau baseline; commit vẫn là checkpoint hợp lệ cho Apply tiếp tục |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự sửa `GraphQLTransformInterceptor` trong Apply | Assert envelope production hiện tại; route global transport concern riêng | Interceptor ngoài approved production boundary |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho r2 | Feedback của thầy |
| Source implementation và proof | Tiếp tục `starci-be-feature-apply` từ `ee65e40` sau approval |

## apply

Applied revision: `topic-linked-practice-session-review-r2`

Baseline commit: `ee65e40b09cbef0bb5fc49274d14d5733de29420`

Tracked diff: `ee65e40..worktree`

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
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`ee65e40`) |
| Purpose | Apply topic-linked practice session theo Review r2 và chứng minh runtime thật |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 17 product/test paths đã duyệt; append workflow này |

### PROOF

| Gate | Result |
|---|---|
| Baseline | PASS — checkpoint trước source write `ee65e40b09cbef0bb5fc49274d14d5733de29420` |
| Focused twin | PASS — `18/18` tests: handler, resolver và practice read service |
| Build | PASS — `npm run build`, webpack production compile xanh sau source cuối |
| Lint | PASS theo gate — `0 errors`; còn `367 warnings` lịch sử ngoài boundary, không suppression |
| Full unit | PASS — `110/110` suites, `531/531` tests |
| GraphQL flow + real PostgreSQL | PASS — `3/3`: public set → authenticated record → resume; mixed batch rollback; concurrent writes serialize |
| Related progress E2E | PASS — `5/5` sau khi bỏ internal practice write owner |
| Exact E2E command | BLOCKED ngoài boundary — `test/e2e/jest-e2e.json` map alias về `src/modules`/`src/features`; chạy cùng specs bằng config tạm chỉ sửa mapper sang `apps/api/src/...` thì xanh; config tạm đã xóa |
| Live runtime | PASS — final build tại `http://localhost:3071/graphql`, test account đi qua sign-in → OTP local → session cookie → practice → mastery → reject unknown → continue; `10/10` và chạy lặp lại hai lần đều xanh |
| Terminal/network | PASS — port `3071` listen trên final process; không có GraphQL/network failure; stderr chỉ còn warning deprecation `pg` có sẵn |
| Diff hygiene | PASS — `git diff --check ee65e40` không có whitespace error; đúng 17 paths trong boundary |
| Workflow validator | PASS cho record này — `0` task error; toàn root còn `382` lỗi lịch sử ngoài task |

### OUTPUTS

| Concept | Result |
|---|---|
| Topic-linked write | `recordPractice` nhận topic bắt buộc và ghi mastery, session, XP/Points atomically theo đúng topic |
| Strict batch | Empty trả `0/0`; duplicate và mixed/unknown phrase bị reject toàn batch |
| Resume | `continueLearning.topic` đọc lại đúng topic vừa học từ durable session |
| Concurrency | Per-learner pessimistic lock giữ một mastery row và không mất streak; không thêm idempotency key theo quyết định |
| Live usability | Test account đăng nhập qua local OTP và session thật; verifier repeatable trên dữ liệu bền |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.types.ts` | added — result/normalized operation types |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.command.ts` | added — command mang authenticated user và request |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.ts` | added — topic validation, duplicate/mixed reject, learner lock, mastery/session/ledger transaction |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.handler.spec.ts` | added — twin decision, rollback, lock, ledger và threshold cases |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.service.ts` | added — thin CommandBus dispatch |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/graphql-types/request.ts` | modified — required validated `topicSlug` |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.ts` | modified — forward full user/request qua operation service |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.resolver.spec.ts` | modified — forwarding, empty và failure twins |
| `apps/api/src/features/api/core/graphql/mutations/exam/record-practice/record-practice.module.ts` | modified — register CQRS, resolver, service và handler |
| `apps/api/src/modules/bussiness/exam/practice.service.ts` | modified — chỉ còn public read/build-set; bỏ write owner cũ |
| `apps/api/src/modules/bussiness/exam/exam.module.ts` | modified — sửa owner documentation của XP ledger |
| `apps/api/src/modules/exceptions/errors/exam/practice-phrase-outside-topic.ts` | added — stable mixed/unknown exception code |
| `apps/api/src/modules/exceptions/errors/exam/practice-phrase-repeated.ts` | added — stable duplicate exception code |
| `apps/api/src/modules/exceptions/errors/exam/index.ts` | modified — export hai exception mới |
| `test/e2e/progress.e2e-spec.ts` | modified — bỏ internal practice write cases, giữ progress owner |
| `test/e2e/practice-topic-resume.e2e-spec.ts` | added — Apollo HTTP + auth guard + real PostgreSQL flow/rollback/concurrency |
| `scripts/verify-practice-e2e.ts` | modified — app login/OTP/session thật, topicSlug, strict negative, resume và repeatable baseline |
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | modified — append Apply evidence, exact changes và owed items |

### NEED APPROVALS

| Question | Options |
|---|---|
| Sửa harness alias ngoài boundary r2 | Mở Backend Audit/Feature Plan riêng cho `test/e2e/jest-e2e.json`; hoặc giữ Apply mở với proof bằng mapper tạm |
| Sửa nguồn `.stack` Keycloak drift | Mở stack/config task để đổi generated source từ `academy-web` + stale secret sang client/secret MiaMia đã provision; runtime hiện đang chạy bằng process override |

### WARNINGS

| Warning | Impact |
|---|---|
| `test/e2e/jest-e2e.json` còn alias monorepo cũ | Exact npm E2E command dừng trước test; capability specs bản thân xanh khi mapper đúng |
| Generated `.env.override` ghép `academy-web` và secret khác secret đã provision | App login trả `AxiosError` nếu restart không mang override; current final process dùng `miamia-web` và đúng secret file, không sửa secret/log value |
| Không có idempotency key | Retry accepted vẫn tạo session mới; learner lock chỉ bảo vệ mastery consistency như đã duyệt |
| Lint có 367 warning lịch sử | Gate không có error; warning cleanup cần audit boundary riêng |
| `pg` phát deprecation warning khi boot | Không gây request/network failure trong proof nhưng cần dependency/data-access audit riêng |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng r2 để sửa global GraphQL interceptor | Giữ envelope production; assert stable exception code thực tế | Ngoài boundary và không cần cho capability |
| Sửa `test/e2e/jest-e2e.json` ngay trong Apply | Dùng config tạm cho proof, xóa sau run và ghi owed | Exact 17-path boundary không chứa harness config |
| Sửa `.env.override` generated bằng tay | Runtime-only override và ghi drift | File sẽ bị `sync.mjs` ghi đè; nguồn stack cần task riêng |
| Bỏ session guard trong live verifier | Login qua app OTP và gửi session cookie thật | Live proof phải giữ auth policy production |

### OWED

| Owed | Cleared by |
|---|---|
| Canonical E2E mapper về `apps/api/src/modules` và `apps/api/src/features` | Backend audit/feature Plan → Review → Apply riêng |
| Generated MiaMia Keycloak client ID/secret source đồng nhất | Stack/config task riêng, regenerate `.env.override`, restart rồi rerun auth |
| FE gửi required `topicSlug` trong Học & ôn tập | Approved MiaMia FE Design Apply sau backend handoff |
| Apply closure | Xóa hai blocker ngoài boundary hoặc thầy chấp nhận giữ chúng thành linked continuation; hiện chưa tuyên bố clean/closed |

## apply closure r2

Applied revision: `topic-linked-practice-session-review-r2`

Baseline commit: `ee65e40b09cbef0bb5fc49274d14d5733de29420`

Implemented commit: `a486a58856206d1dc8e9d36a562cc371670763d2`

Tracked diff: `ee65e40..a486a58`

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
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`a486a58`) |
| Purpose | Đóng Apply topic-linked practice sau linked config repair và normal-restart live proof |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ append linked closure; không sửa thêm production source của feature |

### LINKED CLOSURE PROOF

| Blocker cũ | Kết quả cuối |
|---|---|
| Canonical Jest aliases | CLEARED — `test/e2e/jest-e2e.json` đã map `apps/api/src/...`; topic E2E `3/3`, progress E2E `5/5` bằng exact commands |
| Generated Keycloak drift | CLEARED — encrypted stack authority dùng `miamia-web`; API restart không override và live verifier đạt `10/10` hai lần |
| Static/unit | PASS — build xanh, lint `0 errors`, unit `110/110` suites và `531/531` tests |
| Runtime/network | PASS — port `3071` listen; không auth/session/GraphQL/network failure; stderr chỉ có warning `pg` lịch sử |
| Linked record | `lint/miamia/local-runtime-and-e2e-drift.md`, applied revision `local-runtime-and-e2e-drift-review-r1` |

### OUTPUTS

| Concept | Result |
|---|---|
| Feature status | Topic-linked practice backend Apply đã đóng; không còn blocker mapper hoặc restart-auth |
| Runtime confidence | Sign-in → OTP local → session → practice → mastery → continue-learning chạy lặp lại trên runtime thật |
| Handoff | FE có thể dùng required `topicSlug` theo contract đã implement |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | modified — append linked closure, implementation commit và final proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Backend feature closure | Không cần approval kỹ thuật thêm; Review r2 và linked repair r1 đều đã được thầy duyệt |

### WARNINGS

| Warning | Impact |
|---|---|
| Không có idempotency key theo quyết định đã duyệt | Retry accepted vẫn có thể tạo session mới; learner lock chỉ bảo vệ mastery consistency |
| FE phải gửi required `topicSlug` | Consumer cũ thiếu field sẽ bị validation reject; cần giữ contract khi Apply Học & ôn tập |
| Lint/`pg` còn warning lịch sử | Không chặn feature; cần audit riêng nếu muốn zero-warning hoặc sửa deprecation |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đóng feature chỉ bằng config tạm/process override | Exact E2E config và normal restart từ encrypted stack authority | Closure phải tồn tại qua restart thường |
| Mở lại source feature trong linked repair | Giữ commit `a486a58` nguyên vẹn | Repair chỉ sở hữu harness/runtime drift |

### OWED

| Owed | Cleared by |
|---|---|
| Backend Apply closure | Exact E2E + normal-restart live proof trong linked audit Apply |
| FE gửi required `topicSlug` | MiaMia FE Học & ôn tập Apply theo design đã duyệt; không còn backend blocker |
