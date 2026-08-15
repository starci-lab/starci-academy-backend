<!-- starci-workflow: v2 -->

# course-review-public-author

## plan

Candidate revision: `course-review-public-author-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit StarCi Academy targets |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `starci-academy-api` |
| Repo / branch | `D:\Repositories\starci-academy-backend` @ `mtp` |
| Purpose | Let anonymous course-review readers render the learner’s public display identity without exposing storage ids or private user fields. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-review-public-author.md` |
| Language | `vi` |
| Phase | `plan` |
| Touching | Workflow only; no backend product source until Review approval. |

### SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Unfiltered live schema dump at `http://localhost:3001/graphql` | Query `courseReviews(request: CourseReviewsRequest!)` returns `CourseReviewsResponse`; page has `nodes`, `total`, `averageScore`. |
| Current node shape | `CourseReview` exposes scalar review fields including `userId`; it has no public author object. |
| Current handler | `findAndCount(CourseReviewEntity)` filters by `courseId`, orders newest first, and does not join `user`. |
| Entity evidence | `CourseReviewEntity.user` is the owner relation; `UserEntity.displayName` is nullable and documented to fall back to nullable `username`. |
| Privacy evidence | `UserEntity` GraphQL also exposes `email` and `keycloakId`; therefore returning `UserEntity` from this anonymous query would broaden data exposure. |
| Sibling evidence | `course-questions` joins author identity but returns full `UserEntity`; that shape is not safe to mirror for an anonymous review door. Mirror its single joined read, not its broad GraphQL object. |

### CAPABILITY BRIEF

| Rule | Decision |
|---|---|
| Public shape | Each review node gets `author: CourseReviewAuthorObject!` containing only nullable `displayName` and `username`. |
| Display fallback | FE resolves `displayName ?? username ?? localized learner label`; backend does not invent locale-specific copy. |
| Query cost | Load the `user` relation in the existing paginated `findAndCount` call; no per-review user query and no eager entity relation. |
| Existing contract | Preserve `id`, `score`, `body`, `createdAt`, `total`, `averageScore`, ordering and pagination. |
| Privacy | Do not expose `email`, `keycloakId`, `twoFactorSecret` or the full `UserEntity` from review nodes. |
| Transport/auth | Keep the query anonymous and GraphQL; reviews remain pre-purchase evidence. |

### PROPOSED FILE TREE

| Path | Action | Exact responsibility |
|---|---|---|
| `src/features/api/core/graphql/queries/courses/course-reviews/graphql-types/course-review-author.object.ts` | ADD | Narrow public identity object with only `displayName` and `username`. |
| `src/features/api/core/graphql/queries/courses/course-reviews/graphql-types/course-review-node.object.ts` | ADD | Review query node containing existing public review scalars plus the narrow author object. |
| `src/features/api/core/graphql/queries/courses/course-reviews/graphql-types/course-reviews-page.object.ts` | MODIFY | Change `nodes` from entity objects to `CourseReviewNodeObject[]`. |
| `src/features/api/core/graphql/queries/courses/course-reviews/course-reviews.handler.ts` | MODIFY | Join `user` at this call site and map rows to the narrow node shape. |
| `src/features/api/core/graphql/queries/courses/course-reviews/course-reviews.handler.spec.ts` | MODIFY | Twin specs for joined identity mapping, nullable fields, privacy shape, pagination/order preservation and empty page. |
| `src/features/api/core/graphql/schema-builds.int-spec.ts` | MODIFY | Prove `courseReviews.nodes.author` exposes only the two approved fields and does not expose private user fields. |
| `src/tests/e2e/course-review.e2e-spec.ts` | MODIFY | Extend the existing review flow’s learner fixture with display identity and prove source review ownership remains attached while CDC aggregate behavior stays unchanged. |

### TEST MATRIX

| Case | Expected consequence |
|---|---|
| User has both `displayName` and `username` | Node returns both; FE chooses `displayName`. |
| `displayName` is null and `username` exists | Node returns null + username; FE chooses username. |
| Both names are null | Node returns nullable fields without UUID fallback; FE shows localized learner label. |
| Anonymous schema selection | `author { displayName username }` succeeds. |
| Attempt to select `email` or `keycloakId` under review author | Schema rejects the field. |
| Two reviews in one page | One joined paginated read; no extra query per node. |
| Empty review page | Empty nodes, zero total/average behavior unchanged. |
| Existing ordering/window | Newest-first order and clamped skip/take remain unchanged. |
| Live call | `courseReviews` for seeded Fullstack Mastery returns names and no UUID-backed display path. |

### EXCLUSIONS

| Excluded | Reason |
|---|---|
| Database migration/entity change | Relation and both name columns already exist. |
| Full `UserEntity` author | Leaks selectable private identity fields from an anonymous query. |
| Avatar/profile link | User asked for name and card only; widening public identity is a separate decision. |
| FE N+1 lookup | Wrong ownership and avoidable latency. |
| Changing review write mutations or aggregate projection | Unrelated to display identity. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review author | One privacy-safe public author object per review. |
| Read path | Existing CQRS query remains the owner and performs one joined paginated read. |
| Client fallback | Display name, then username, then localized learner label; never UUID. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-review-public-author.md` | Added exact schema evidence, file boundary and test matrix for r1. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve backend revision `course-review-public-author-r1`? | Reply `duyệt course-review-public-author-r1` to run Feature Review and then Apply; until then backend production source remains unchanged. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree already contains unrelated stack/runtime edits | Apply must preserve them and touch only the approved tree. |
| Existing `course-questions` exposes full `UserEntity` | It is precedent for joining, not precedent for this anonymous public schema shape. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Return `UserEntity` relation | Narrow `CourseReviewAuthorObject` | Prevent selectable email/Keycloak identity exposure. |
| Backend returns one computed localized name string | Return nullable displayName/username fields | Locale fallback belongs to the client; source identity remains explicit. |
| FE queries user per UUID | Joined read in `courseReviews` | Avoid N+1 and storage-id UI. |

### OWED

| Owed | Cleared by |
|---|---|
| Review challenge and explicit approval | `starci-be-feature-review` for `course-review-public-author-r1`. |
| Backend source, twin tests, schema test and live call | `starci-be-feature-apply` after approval. |
| FE author query/type/mapping | Fidelity continuation after approved backend schema exists. |
