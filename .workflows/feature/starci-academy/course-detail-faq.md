<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Xác định backend capability cần thiết để Course Detail hiển thị FAQ thật. |
| Database | primary PostgreSQL; payload đọc qua MinIO materialized course object |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |

### Schema evidence

| Evidence | Result |
|---|---|
| Unfiltered live query fields at `http://localhost:3001/graphql` | `course` already exists; no second FAQ query is needed. |
| Live `CourseEntity` introspection | Includes `qnas`. |
| Live `QnaEntity` introspection | Includes `id`, `question`, `answer`, ordering, locale, course ownership and translations. |
| Live call `course(displayId: "fullstack-mastery")` with locale `vi` | Returns two ordered Vietnamese FAQ rows. |
| Entity source | `CourseEntity.qnas` → `QnaEntity`; primary PostgreSQL owns authored rows. |
| Read path | `CourseHandler` reads localized materialized course JSON from MinIO; FAQ is already part of the returned course payload. |
| Seed path | `QnaIdFactoryService` and course seeding infrastructure already produce stable FAQ rows. |

### Operation-family verdict

| Candidate | Verdict | Reason |
|---|---|---|
| New `courseFaqs` query folder | REJECT | Duplicates `course.data.qnas`, creates a second cache/request owner and disagrees with the existing course-detail family. |
| Modify `course` handler/entity | REJECT | The live schema and live payload already prove the capability. |
| Reuse `course.data.qnas` | APPROVE CANDIDATE | Mirrors the current course query, locale and materialization boundary exactly. |

### Planned backend production tree

| Path | Action | Shape evidence |
|---|---|---|
| None | REUSE existing backend capability | No backend source file is missing; writing one would duplicate a live schema path. |

### Test matrix

| Case | Proof |
|---|---|
| Course with FAQ | Live GraphQL call returns non-empty ordered `qnas`. |
| Localized FAQ | `Accept-Language: vi` returns Vietnamese question and answer. |
| Empty FAQ | FE treats `qnas: []` as a real empty section; backend list remains non-null. |
| Course not found | Existing `CourseNotFoundException` path remains unchanged. |
| Schema shape | Existing schema-build integration plus introspection confirms `CourseEntity.qnas: [QnaEntity!]!`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Course Detail FAQ backend capability brief | Backend capability already exists and should be reused, not reimplemented. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-detail-faq.md` | added — schema evidence, reuse verdict and proof matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Backend production boundary | Recommended: zero BE source writes and reuse `course.data.qnas`; alternative: provide a missing backend behavior not present in the live payload. |

### WARNINGS

| Warning | Impact |
|---|---|
| Earlier FE design review assumed FAQ data did not exist. | That rejection is stale and must be superseded by live schema evidence. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| New FAQ entity/query/handler family | Existing `CourseEntity.qnas` path | Duplicate ownership would make two backend answers for one section. |

### OWED

| Owed | Cleared by |
|---|---|
| Owner approval of zero-BE-write reuse revision | Approve `course-detail-faq-reuse-r1`. |
| FE consumption and render | Approved FE design revision and Apply. |

## review revision-1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Review việc reuse backend FAQ đang chạy trước khi FE consumption bắt đầu. |
| Database | primary PostgreSQL; MinIO materialized course read |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |

Candidate revision: `course-detail-faq-reuse-r1`

Review status: awaiting explicit approval

### Review verdict

| Boundary | Exact revision |
|---|---|
| Transport | Keep public `course(request)` GraphQL query. |
| Payload | FE selects `data.qnas { id question answer orderIndex }`. |
| Persistence | Keep existing primary PostgreSQL entities and seeder. |
| Materialization | Keep existing locale-aware MinIO course object. |
| Backend files | No production source write. |
| Proof | Live schema, live Vietnamese call and FE integration query. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate `course-detail-faq-reuse-r1` | One existing backend truth feeds the new FE FAQ section. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-detail-faq.md` | modified — append reviewed zero-write backend boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `course-detail-faq-reuse-r1`? | Recommended: approve no BE source write because live BE already returns real FAQ; or identify an additional backend requirement. |

### WARNINGS

| Warning | Impact |
|---|---|
| No backend diff will appear. | This is intentional evidence of reuse, not omitted backend work. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add a second FAQ GraphQL operation | Select `qnas` from existing `course` | Avoid duplicate transport and cache ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | User approves exact reuse revision and production boundary. |

## review revision-2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Ghi explicit approval cho backend FAQ reuse boundary. |
| Database | primary PostgreSQL; MinIO materialized course read |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |

Approved revision: `course-detail-faq-reuse-r1`

Approval evidence: user trả lời `approve FAQ r2, apply`, xác nhận cả FE FAQ r2 và backend reuse revision đi kèm.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved backend reuse revision | `course-detail-faq-reuse-r1` được phép vào Apply với zero production source write. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-detail-faq.md` | modified — append explicit approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact backend revision and zero-write boundary are approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Live backend already owns the capability. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Duplicate backend operation | Existing `course.data.qnas` | Approved reuse boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply proof | Live schema and GraphQL call recorded under backend Apply. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / core |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Prove the approved existing backend FAQ capability before FE consumption. |
| Database | primary PostgreSQL; MinIO materialized course read |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-detail-faq.md |
| Language | vi |
| Phase | apply |
| Touching | workflow record only; zero backend production source paths |

Applied revision: `course-detail-faq-reuse-r1`

Baseline commit: `26e3bfd3209fd451915c55dc4ec1cc1cd223169f`

Tracked diff: `26e3bfd3209fd451915c55dc4ec1cc1cd223169f..worktree`, workflow evidence only; zero backend production source diff.

### Commands and results

| Proof | Result |
|---|---|
| Unfiltered schema query/mutation enumeration | PASS — `course` exists; no duplicate FAQ operation exists or is needed. |
| `CourseEntity` introspection | PASS — `qnas` field exists. |
| `QnaEntity` introspection | PASS — authored and localized FAQ shape exists. |
| Live GraphQL `course(fullstack-mastery)` with locale `vi` | PASS — 2 rows, ordered indexes 0 and 1, Vietnamese question/answer payload. |

### OUTPUTS

| Concept | Result |
|---|---|
| Implemented backend FAQ capability | Approved revision is fulfilled by the existing production path and proved live. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-detail-faq.md` | modified — append Apply proof. |
| Backend production source | unchanged — exact approved zero-write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Backend capability is live and ready for FE consumption. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Live schema and data agree with source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Duplicate backend implementation | Existing `course.data.qnas` | Approved reuse revision. |

### OWED

| Owed | Cleared by |
|---|---|
| FE integration proof | Course Detail FAQ r2 Apply. |
