<!-- starci-workflow: v2 -->

## plan

Revision: cv-evidence-contract-plan-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy; Nest application `core` |
| Database | Primary PostgreSQL (`cv_generations`, `user_milestone_task_attempts` và learning joins); MinIO/Qdrant chỉ được pipeline hiện tại đọc |
| Repo / branch | D:\Repositories\starci-academy-backend @ `mtp` (`7acd312a858be7ed58dc847c25ec86d801be17f8`) |
| Purpose | Khóa backend contract cho B1 Evidence-first: target role/level, capstone selection, immutable evidence snapshot và per-run trust exposure trước FE Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md |

### SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Live endpoint | `POST http://127.0.0.1:3001/graphql`; introspection thành công. |
| Unfiltered schema | Đã đọc toàn bộ 179 query names và 113 mutation names. CV family hiện có `templateCvs`, `cvGeneration`, `myCvGenerations`, `myPickableCvAchievements`, `myCvBlocks`; mutations `generateSubmitCvPresignUrl`, `generateCv`, `reviseCv`, `uploadCv`, block edit/render/tailor/extract. |
| Existing evidence query return | `myPickableCvAchievements → MyPickableCvAchievementsResponse → milestoneTaskAttempts`; mỗi item hiện có `id`, `taskTitle`, `milestoneTitle`, `courseTitle`, `score`. |
| Existing mutation input | `generateCv` và `reviseCv` có `courseId`, `targetRole`, `language` nhưng không có target level hoặc selected evidence IDs; `uploadCv` cũng thiếu target level. |
| Persisted run | `cv_generations` đã lưu course/role/language/source/score/feedback nhưng chưa lưu target-level bar hoặc evidence snapshot. |
| Async payload | `GenerateCvPayload` không mang course/role/language; `ScoreUploadedCvPayload` không mang target level. |

### BINDING PRODUCT RULES

| Rule | Evidence | Contract consequence |
|---|---|---|
| B1 hierarchy | Approved FE Plan `cv-edit-submit-rag-plan-r5-selected-b1` | Backend phải support Target → Evidence trước Draft; FE không được giả picker bằng local state. |
| Capstone-only | `myPickableCvAchievements` handler/response và legacy `CV-VERIFIED-TRUST-TIER-WORKFLOW.md` ghi teacher-approved: challenge/coding là practice, không đi vào CV | Selected verified evidence chỉ nhận passed milestone/capstone task attempts. Không thêm challenge/coding IDs. |
| Explicit evidence | B1 concept audit | Generate/revise chỉ dùng capstones user chọn; không tự gather toàn bộ activity mọi course. |
| Immutable run truth | `cv_generations` là history/version owner | Mỗi run persist snapshot của selected capstones; không chỉ giữ foreign IDs hoặc chỉ giữ queue payload. |
| Score ≠ trust | `CvScoringService` versus `CvVerificationService` | GraphQL trả `score` và `evidenceLevel` riêng. Per-run evidence level không suy từ AI score. |
| Target level ≠ seniority proof | Current `inferLevel` dùng XP/count nhưng Plan r4 đã bác | User-chosen `targetLevel` là rubric bar; compose/score bỏ XP/count inference. |
| Self-reported remains allowed | Legacy sells credibility, not tool access | Empty evidence creates a self-reported CV; không chặn generate/upload/revise. |
| No claim-level badge yet | Compose output không lưu source refs từng bullet | Contract này expose run-level snapshot/level; per-bullet provenance bị loại khỏi boundary. |

### ARCHITECTURE

| Owner | Decision | Why this shape |
|---|---|---|
| `CvEvidenceService` business capability | Một service primary-PostgreSQL resolve selected IDs thành validated snapshot, dùng chung query/generate/revise | Tránh ba bản SQL drift; selection validation là business rule dùng qua nhiều door. |
| `cv_generations.selected_evidence` | Nullable `jsonb` snapshot của capstone facts tại thời điểm enqueue | History không đổi khi source title/score đổi; worker retry deterministic; không cần join table chỉ để đọc snapshot. |
| `cv_generations.target_level` | Nullable `varchar` backed by GraphQL/TS `CvTargetLevel` enum | Tránh native-PG enum migration trap; vẫn có compile-time/runtime enum. |
| `myPickableCvAchievements` | Reuse query; thêm `courseId`, dùng shared service | Không tạo query gần trùng; FE có thể group/filter và cảnh báo cross-track. |
| `generateCv` / `reviseCv` | Thêm bounded unique `milestoneTaskAttemptIds` và `targetLevel` | Selection đi qua production GraphQL; invalid/foreign/failed IDs bị từ chối trước khi tạo row/job. |
| `uploadCv` | Thêm `targetLevel`; evidence snapshot luôn empty/self-reported | Uploaded source không tự trở thành StarCi-verified; nếu muốn attach capstone, user revise qua B1. |
| Generate worker | Payload mang `targetRole`, `language`, `targetLevel`, snapshot; gather không đọc challenge/coding/XP | Compose và score dùng đúng target/evidence frozen của run, không suy lại từ mutable DB activity. |
| Read APIs | Detail trả full snapshot + `evidenceLevel`; history trả target level, evidence level và count | FE reload/history render đúng trust state mà không phải reconstruct. |

### PROPOSED FILE TREE

| Path | Change | What it holds / shape witness |
|---|---|---|
| `src/modules/databases/postgresql/primary/enums/cv-target-level.ts` | ADD | `Junior`, `Mid`, `Senior` plain enum + GraphQL registration; mirrors existing enum files, persisted as varchar. |
| `src/modules/databases/postgresql/primary/types/cv-evidence-snapshot.ts` | ADD | Named JSONB snapshot types: capstone attempt id, course id/title, milestone/task titles, score; satisfies TYPE-3. |
| `src/modules/databases/postgresql/primary/entities/user-cv-generation.entity.ts` | MODIFY | Add nullable `targetLevel` varchar and `selectedEvidence` jsonb; one run owns immutable target/evidence truth. |
| `src/modules/databases/postgresql/primary/migrations/1727100000000-AddCvEvidenceContract.ts` | ADD | Add/drop `target_level` varchar and `selected_evidence` jsonb for synchronize-disabled environments; mirrors latest idempotent migrations. |
| `src/modules/bussiness/cv-evidence/cv-evidence.module-definition.ts` | ADD | Configurable module definition matching sibling business capability modules. |
| `src/modules/bussiness/cv-evidence/cv-evidence.module.ts` | ADD | Provide/export `CvEvidenceService`; no sideways imports. |
| `src/modules/bussiness/cv-evidence/types/cv-evidence.ts` | ADD | Named params/results for listing and resolving selected capstones, including invalid-id metadata. |
| `src/modules/bussiness/cv-evidence/cv-evidence.service.ts` | ADD | Primary DB reads for owned passed capstones; order-preserving validation; evidence-level derivation from snapshot. |
| `src/modules/bussiness/cv-evidence/cv-evidence.service.spec.ts` | ADD | Twin unit spec for ownership/pass/empty/duplicate/order/boundary decisions. |
| `src/modules/bussiness/bussiness.module.ts` | MODIFY | Register/export `CvEvidenceModule` in the business aggregator composition root. |
| `src/modules/platform/exceptions/errors/cv/cv-evidence-selection-invalid.ts` | ADD | `AbstractException` with invalid attempt IDs and reason metadata; thrown before enqueue. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/graphql-types/response.ts` | MODIFY | Add `courseId`; retain capstone-only typed list. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.handler.ts` | MODIFY | Delegate source read to shared business service, map view data. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.handler.spec.ts` | ADD | Missing CQRS twin: auth context, empty, passed-only, other-user exclusion and course identity. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/graphql-types/request.ts` | MODIFY | Add validated target level and bounded/unique UUID capstone IDs; validate existing role/language lengths/domains touched by B1. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler.ts` | MODIFY | Resolve snapshot before enqueue and pass target/role/language/evidence explicitly. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler.spec.ts` | MODIFY | Twin branches for valid/empty/invalid evidence and every target level. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/graphql-types/request.ts` | MODIFY | Add optional replacement capstone IDs and target level with explicit inheritance semantics. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler.ts` | MODIFY | Validate source ownership; inherit or replace target/evidence; validate replacement before enqueue. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler.spec.ts` | MODIFY | Twin cases for source missing/foreign, inherit, replace, clear and invalid selection. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/graphql-types/request.ts` | MODIFY | Add target level and validation; upload remains empty-evidence/self-reported. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler.ts` | MODIFY | Persist target level and thread exact scoring bar to enqueue. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler.spec.ts` | MODIFY | Assert each level and uploaded evidence-level semantics. |
| `src/features/api/processors/ai/generate-cv/enqueue-generate-cv.service.ts` | MODIFY | Persist target/evidence snapshot and serialize all compose/score inputs into tracked job payload. |
| `src/features/api/processors/ai/generate-cv/enqueue-generate-cv.service.spec.ts` | ADD | Prove row + job payload agree, empty snapshot persists, broker failure closes both states. |
| `src/modules/integrations/bullmq/types/payloads/generate-cv.ts` | MODIFY | Add target role, target level, language and evidence snapshot; payload is retry-stable. |
| `src/features/api/processors/ai/generate-cv/types/execute.ts` | MODIFY | Replace all-activity gather shapes/inferred-level params with selected capstone snapshot + explicit target fields. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-gather-step.service.ts` | MODIFY | Gather profile/source CV and consume frozen selected capstones; remove challenge/coding/XP claim sources. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-gather-step.service.spec.ts` | ADD | Prove only selected snapshot enters result, source extraction modes and empty evidence. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-compose-step.service.ts` | MODIFY | Use payload target role/level/language; remove XP/count inference; RAG catalog query follows target, not practice volume. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-compose-step.service.spec.ts` | ADD | Prove all target levels, role/language threading, selected-only prompt, RAG degrade and no unsupported claim source. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-score-step.service.ts` | MODIFY | Pass explicit target level to `CvScoringService`; delete inferred template-level bands. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-score-step.service.spec.ts` | MODIFY | Replace XP/count cases with exact Junior/Mid/Senior bar and scoring-degrade cases. |
| `src/features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service.ts` | MODIFY | Carry target level into durable upload-scoring payload. |
| `src/features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service.spec.ts` | ADD | Prove payload bar and broker-failure terminal states. |
| `src/modules/integrations/bullmq/types/payloads/score-uploaded-cv.ts` | MODIFY | Add explicit target level. |
| `src/features/api/processors/ai/score-uploaded-cv/score-uploaded-cv.worker.ts` | MODIFY | Thread payload target level to shared scoring service. |
| `src/features/api/processors/ai/score-uploaded-cv/score-uploaded-cv.worker.spec.ts` | MODIFY | Assert exact bar reaches scorer for every enum member. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/graphql-types/response.ts` | MODIFY | Add target level, typed selected-evidence snapshot and per-run `evidenceLevel`; keep score separate. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/cv-generation.handler.ts` | MODIFY | Map stored snapshot defensively and derive run-level evidence level. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/cv-generation.handler.spec.ts` | MODIFY | Prove owned detail, legacy-null rows, malformed snapshot defense, score/trust separation. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/graphql-types/response.ts` | MODIFY | Add target level, evidence level and selected evidence count; do not add heavy snapshot to list. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.handler.ts` | MODIFY | Map lightweight evidence summary from persisted snapshot. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.handler.spec.ts` | ADD | Missing CQRS twin: pagination/ownership plus legacy-null and evidence summary cases. |
| `src/tests/e2e/cv-build.e2e-spec.ts` | MODIFY | Extend one real GraphQL → BullMQ → worker → PostgreSQL flow with pick → generate/revise/upload → read-back evidence/target proof. |

### TEST MATRIX

| Owner | Case | Observable consequence |
|---|---|---|
| Evidence service | Empty ID set | Returns empty frozen snapshot; evidence level is `SelfReported`. |
| Evidence service | One or max allowed owned passed capstones | Returns request-order snapshot with exact course/task/score fields and `CapstoneVerified`. |
| Evidence service | Duplicate ID | Request validation rejects; no DB/enqueue call. |
| Evidence service | Max−1 / max / max+1 | First two accepted, max+1 rejected at GraphQL validation boundary. |
| Evidence service | Missing, failed, foreign-user attempt | Throws `CvEvidenceSelectionInvalidException` naming invalid IDs; no partial snapshot. |
| Pickable query | No capstones / mixed attempts | Empty list; only caller-owned passed capstones returned, challenges/coding absent. |
| Pickable query | Multiple courses | Every item carries stable `courseId`; newest-first ordering retained. |
| Generate | Junior / Mid / Senior | Exact target level persists and reaches compose + score unchanged. |
| Generate | Empty selected evidence | Run succeeds as self-reported; prompt contains no StarCi achievement claims. |
| Generate | Valid selection | Row/job/gather contain same immutable snapshot; only selected capstones reach prompt. |
| Generate | Invalid selection | Mutation fails before `cv_generations`/`jobs` row creation. |
| Revise | Missing or foreign source | Existing `CvGenerationNotFoundException`; no row/job. |
| Revise | Evidence/level omitted | Inherits source snapshot/target under proposed default. |
| Revise | Explicit empty IDs | Clears inherited evidence and yields self-reported revision. |
| Revise | Explicit replacement | Validates new IDs and persists replacement snapshot; source run unchanged. |
| Upload | Every target level | Uploaded row stores exact target bar; worker scores with it; evidence remains empty/self-reported. |
| Compose | Role/language/level supplied | System/RAG prompts use request values, not `profile.roleTitle`, locale fallback, XP or capstone count. |
| Compose | RAG unavailable | Draft still composes from selected snapshot/source CV; no citation fields invented. |
| Scoring | Every target-level enum member | `CvScoringService` receives matching rubric level; generated and uploaded paths agree. |
| Read detail | Legacy null columns | Nullable target, empty snapshot and self-reported level map without failure. |
| Read detail | Malformed JSONB | Defensive mapping drops malformed members; never upgrades trust. |
| Read history | Mixed runs | Correct count/level per run; no full snapshot/S3 roundtrip in list. |
| Async failure | Broker enqueue rejection | Tracked job and CV run both terminal Failed; snapshot remains auditable. |
| Retry | Compose retry | Same persisted payload/snapshot reused; no duplicate run or evidence mutation. |

### E2E FLOW

| Step | Production boundary | Assertion |
|---|---|---|
| 1. Seed learner + passed and failed capstones across two courses | Primary PostgreSQL fixtures | Source world contains selectable, excluded and foreign evidence. |
| 2. Fetch picker | Authenticated GraphQL `myPickableCvAchievements` | Only owned passed capstones returned with course IDs. |
| 3. Generate B1 CV | GraphQL `generateCv` with target + selected IDs | Pending row and tracked job persist identical target/snapshot. |
| 4. Let real queue/worker settle | Real Redis/BullMQ; provider result stubbed with realistic strict JSON | Run becomes Done; compose/score use selected evidence and explicit target bar. |
| 5. Read detail/history | GraphQL `cvGeneration` + `myCvGenerations` | Score, target level, snapshot and evidence level survive reload and remain separate. |
| 6. Revise | GraphQL `reviseCv` omitting then replacing evidence | Inheritance/replacement semantics persist; source run unchanged. |
| 7. Upload and score | Existing presigned-key registration boundary via GraphQL `uploadCv` | Uploaded run is self-reported and scored against requested target level. |

### PROOF COMMANDS FOR APPLY

| Proof | Command / call |
|---|---|
| Twin units | `npm test -- --runInBand` plus focused paths for every modified/added `*.spec.ts`. |
| Flow e2e | `npm run test:e2e -- --runTestsByPath src/tests/e2e/cv-build.e2e-spec.ts` |
| Type/lint/build | `npm run lint:check`; `npm run typecheck`; `npm run build` |
| Schema | Introspect `GenerateCvRequest`, `ReviseCvRequest`, `UploadCvRequest`, `CvGenerationPayload`, `CvGenerationListItem`, `MyPickableCvAchievementsViewData` on `core`. |
| Live call | Authenticated local test account: picker → generate with one passed capstone → poll `cvGeneration` Done → verify exact target/snapshot/evidenceLevel; provider call may use configured test lane, never expose credentials. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Classification | Boundary |
|---|---|---|
| Challenge/coding evidence | Excluded | Legacy teacher-approved source says practice does not go on CV; no activity-backed picker in this capability. |
| Per-bullet provenance | Excluded | Requires structured output to carry source refs and editor to preserve them; route later through a separate BE Feature Plan if desired. |
| JD ingestion/ranking | Excluded | Belongs to B2 Role-first; B1 only uses target role and explicit capstone selection. |
| Contact confirmation | FE concern | Backend profile gather still lacks phone/email; FE asks user, this capability does not infer contact. |
| RAG citations | Excluded | Retrieval remains internal/best-effort; GraphQL exposes no chunks. |
| Existing AI score | Retained | Renamed/explained by FE as CV quality; backend field stays `score`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `cv-evidence-contract-plan-r1`: per-run target + capstone-only selection + immutable evidence snapshot + separate evidence trust level. |
| Architecture concept | Reuse `myPickableCvAchievements`; centralize capstone validation in a business service; persist snapshot on `cv_generations`; thread explicit target through both generate and upload scoring. |
| FE handoff | After backend Review/Apply, FE Design Review can freeze B1 against real GraphQL fields without mock picker/provenance. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/cv-evidence-contract.md` | added — schema evidence, exact production file tree, test matrix, flow proof, approvals and exclusions. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Maximum selected capstones per CV | **5 (recommended):** đủ cho CV 1–2 trang và bounded prompt; **3:** chặt hơn; **10:** linh hoạt nhưng dễ loãng/prompt lớn. |
| Generate target level | **Required Junior/Mid/Senior (recommended):** không còn hidden inference/default; **optional:** giữ compatibility nhưng null cần generic rubric mới. |
| Revise omission semantics | **Omitted = inherit source; explicit `[]` = clear (recommended):** revision giữ intent nhưng user vẫn gỡ trust evidence được; **omitted = clear:** đơn giản hơn nhưng dễ mất lineage ngoài ý muốn. |
| Cross-course selection | **Cho phép khi user chọn explicit (recommended):** `courseId` chỉ là target/organizer, picker trả courseId để FE cảnh báo; **bắt buộc cùng course:** chặt track nhưng cấm capstone liên quan từ track khác. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live schema đã có `myPickableCvAchievements` nhưng operation thiếu handler twin spec | Apply phải bổ sung spec trước khi mở rộng; không được coi schema presence là proof đủ. |
| Existing source comments gọi picker `Direction A`, trong khi product đã chọn B1 | Documentation/source comments phải cập nhật theo capability, không đổi operation name. |
| Existing gather gọi challenge/coding/XP là verified CV data, trái capstone-only legacy decision | Apply phải remove chúng khỏi claim prompt; nếu giữ để infer sẽ tái tạo lỗi concept. |
| `language` hiện là free text và compose dùng locale thay vì field này | Plan threads `language`; Review phải khóa validation domain `en|vi` hoặc quyết định một enum migration-safe shape. |
| Repository có unrelated dirty files/workflows | Review/Apply phải preserve `.stacks/dev/infra/compose/keycloak.yaml`, `metadata.json` và mọi workflow ngoài exact boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Thêm challenge/coding vào B1 evidence picker | Passed capstone-only selection | Legacy/source ghi teacher-approved: practice không đi vào CV. |
| Chỉ truyền evidence IDs trong BullMQ payload | Persist immutable evidence snapshot trên `cv_generations` và payload | Queue-only truth mất khi reload/history và mutable source có thể drift. |
| Tiếp tục infer seniority từ XP/count | Explicit user-chosen target level | Learning volume không chứng minh seniority nghề nghiệp. |
| Per-bullet `verified` badge trong capability này | Run-level snapshot + evidence level | Compose/editor chưa lưu claim source refs; badge từng bullet sẽ nói quá contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Owner decisions: max selection, target-level requiredness, revise inheritance, cross-course rule | User answers/approves one Plan revision. |
| Challenge exact architecture and production boundary | `$starci-be-feature-review` on approved Plan choices. |
| Backend implementation and live proof | `$starci-be-feature-apply` after explicit Review approval. |
| FE component/props freeze | `$starci-fe-design-review` only after backend contract Apply or approved schema freeze. |

## review

Candidate revision: cv-evidence-contract-review-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp` @ `7acd312a858be7ed58dc847c25ec86d801be17f8`; Frontend `D:\Repositories\starci-academy-fe` / `main` @ `85f4e6663dfdea68bb56eec4956cc681641afe35` |
| Purpose | Challenge Plan r1 và khóa contract, transaction, exception, test và exact production boundary cho B1 CV evidence trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ `D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md`; không chạm production source trong Review. |

### REVIEW FINDINGS

| Finding | Evidence | Revision |
|---|---|---|
| Per-run evidence không cùng nghĩa với global recruiter trust | `CvVerificationLevel` hiện có `ActivityBacked` và được suy từ toàn bộ activity của user; B1 run chỉ tin capstone được chọn explicit | Thêm `CvEvidenceLevel = SelfReported | CapstoneVerified`; tuyệt đối không reuse `CvVerificationLevel` cho `cvGeneration`. |
| Plan chưa loại hidden score default tận owner | `CvScoringService` vẫn nhận optional `templateLevel` và fallback `DEFAULT_CV_TEMPLATE_LEVEL = "mid"` | `CvTargetLevel` trở thành required input của shared scorer; xóa default và string union cục bộ. |
| Upload có thể tạo orphan `Pending` row | `UploadCvHandler` save `cv_generations` trước, rồi enqueue service mới tạo `jobs`; lỗi DB ở bước hai không rollback row đầu | Enqueue upload sở hữu transaction tạo CV row + tracked job, giống generate; BullMQ enqueue chỉ chạy sau commit, broker failure đóng cả hai state. |
| Generate cũng chưa atomic ở DB boundary | `EnqueueGenerateCvJobService` save CV row và `JobActionService.createJob` bằng hai write độc lập, dù `createJob` đã support transactional `EntityManager` | Gói CV row + jobs row trong một primary PostgreSQL transaction và truyền manager vào `createJob`. |
| Revise legacy row có thể không có target | Migration phải nullable để đọc row cũ; rule omitted=inherits không tạo ra level nếu source null | Omitted chỉ inherit khi source có target; source null + request omitted ném `CvTargetLevelRequiredException`, không fallback `mid`. |
| `language` đang free text nhưng pipeline chỉ có `vi|en` | Request hiện là GraphQL `String`; `Locale` enum đã tồn tại | Giữ GraphQL `String` để không breaking client, thêm runtime validation `vi|en`, resolve/persist effective language; omitted Generate/Upload dùng request locale, omitted Revise inherit valid source rồi fallback request locale. |
| Plan thiếu owner type GraphQL dùng chung | Picker và detail cùng cần capstone snapshot fields nhưng import response type ngang operation sẽ vi phạm ownership | Thêm shared query-family GraphQL type `queries/cv-submissions/graphql-types/cv-evidence.ts`; picker và detail reuse type này. |
| Snapshot cần đủ identity để audit | Chỉ title/score không phân biệt được source task khi tên đổi/trùng | Mỗi item freeze `milestoneTaskAttemptId`, `milestoneTaskId`, `milestoneId`, `courseId`, ba title, `score`, `passedAt`; request order được giữ nguyên. |

### FROZEN CONTRACT

| Boundary | Exact contract |
|---|---|
| `CvTargetLevel` | GraphQL/TS enum `Junior="junior"`, `Mid="mid"`, `Senior="senior"`; persisted nullable varchar only for legacy compatibility. Required on new Generate and Upload. |
| `CvEvidenceLevel` | GraphQL/TS enum `SelfReported="self_reported"`, `CapstoneVerified="capstone_verified"`; derived, not persisted. Non-empty defensively valid snapshot is verified; otherwise self-reported. |
| Generate | `targetLevel` required; `milestoneTaskAttemptIds: [ID!]!` required but may be `[]`; max 5, unique UUIDs. `targetRole` remains optional and uses generic `Software Engineer` when absent, never mutable `profile.roleTitle`. |
| Revise | `targetLevel` and `milestoneTaskAttemptIds` optional. Omitted inherits source; explicit `[]` clears evidence. A legacy source with null target requires explicit target. Target role/language/course/label retain existing request semantics; omitted target role composes from source target role then generic fallback. |
| Upload | `targetLevel` required; snapshot always `[]`; evidence level is always self-reported. User can attach verified capstones only by creating a Revise run. |
| Evidence validation | Only caller-owned `passed=true` milestone-task attempts. All-or-nothing; missing, failed or foreign IDs are returned as invalid metadata. Cross-course is allowed only through explicit IDs. |
| Snapshot | Resolve authoritative rows before enqueue, freeze request order into JSONB, and copy the identical value into durable BullMQ payload. New empty runs persist `[]`; legacy null reads as `[]`. |
| Compose | Uses payload target role/effective language/target level and selected snapshot only. It may read profile contact/source CV, but cannot add challenge, coding, XP or unselected capstone claims. RAG remains best-effort and internal. |
| Score | Generated and uploaded paths must pass exact required `CvTargetLevel`; scorer has no default or seniority inference. AI `score` remains separate from `evidenceLevel`. |
| Read APIs | Picker adds `courseId`. Detail returns `targetLevel`, full typed `selectedEvidence`, `evidenceLevel`. History returns nullable `targetLevel`, `selectedEvidenceCount`, `evidenceLevel`, never heavy snapshot. |
| Persistence/queue | CV row and tracked job row commit atomically. BullMQ enqueue happens after commit. Broker rejection marks both durable state machines Failed while preserving target/snapshot audit data. |
| Excluded | JD ingestion/ranking, activity-backed evidence, claim-level provenance/badges, RAG citations, FE source changes. |

### EXACT PRODUCTION TOUCHING BOUNDARY

| Path | Frozen change |
|---|---|
| `src/modules/databases/postgresql/primary/enums/cv-target-level.ts` | ADD target rubric enum + GraphQL registration. |
| `src/modules/databases/postgresql/primary/enums/cv-evidence-level.ts` | ADD dedicated two-state per-run evidence enum + GraphQL registration. |
| `src/modules/databases/postgresql/primary/types/cv-evidence-snapshot.ts` | ADD named immutable JSONB item/snapshot types. |
| `src/modules/databases/postgresql/primary/entities/user-cv-generation.entity.ts` | MODIFY nullable `targetLevel`, nullable `selectedEvidence`, corrected language/evidence documentation. |
| `src/modules/databases/postgresql/primary/migrations/1727100000000-AddCvEvidenceContract.ts` | ADD reversible nullable varchar/jsonb columns; no native PG enum. |
| `src/modules/bussiness/cv-evidence/cv-evidence.module-definition.ts` | ADD configurable module definition. |
| `src/modules/bussiness/cv-evidence/cv-evidence.module.ts` | ADD provider/export wiring. |
| `src/modules/bussiness/cv-evidence/types/cv-evidence.ts` | ADD list/resolve params, snapshot result and invalid-reason types. |
| `src/modules/bussiness/cv-evidence/cv-evidence.service.ts` | ADD single SQL owner for picker, all-or-nothing selection resolution, defensive snapshot parsing and evidence-level derivation. |
| `src/modules/bussiness/cv-evidence/cv-evidence.service.spec.ts` | ADD twin unit matrix. |
| `src/modules/bussiness/bussiness.module.ts` | MODIFY register/export global `CvEvidenceModule`. |
| `src/modules/platform/exceptions/errors/cv/cv-evidence-selection-invalid.ts` | ADD stable invalid-selection exception with per-ID reasons. |
| `src/modules/platform/exceptions/errors/cv/cv-target-level-required.ts` | ADD stable exception for revise of legacy null-target source. |
| `src/features/api/core/graphql/queries/cv-submissions/graphql-types/cv-evidence.ts` | ADD reusable typed evidence item object. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/graphql-types/response.ts` | MODIFY add `courseId`, reuse shared item shape where semantics match. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.handler.ts` | MODIFY delegate SQL/read mapping to `CvEvidenceService`. |
| `src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.handler.spec.ts` | ADD CQRS twin. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/graphql-types/request.ts` | MODIFY required level/list plus UUID/unique/max validators and bounded existing strings. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler.ts` | MODIFY resolve exact snapshot/effective locale before enqueue. |
| `src/features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler.spec.ts` | MODIFY target/evidence/locale/no-write branches. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/graphql-types/request.ts` | MODIFY optional level/list and bounded existing strings. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler.ts` | MODIFY ownership, inherit/replace/clear and legacy-null target rules. |
| `src/features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler.spec.ts` | MODIFY full inheritance/replacement/invalid matrix. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/graphql-types/request.ts` | MODIFY required level and bounded language/role/label validation. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler.ts` | MODIFY delegate atomic row+job creation with exact target/effective locale. |
| `src/features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler.spec.ts` | MODIFY required level, self-reported evidence and atomic enqueue assertions. |
| `src/features/api/processors/ai/generate-cv/enqueue-generate-cv.service.ts` | MODIFY transactionally persist run+job and exact retry-stable payload. |
| `src/features/api/processors/ai/generate-cv/enqueue-generate-cv.service.spec.ts` | ADD transaction, payload identity, DB failure and broker failure proof. |
| `src/modules/integrations/bullmq/types/payloads/generate-cv.ts` | MODIFY required target/effective language/snapshot payload. |
| `src/features/api/processors/ai/generate-cv/types/execute.ts` | MODIFY selected-only gather/compose/score types. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-gather-step.service.ts` | MODIFY consume frozen snapshot; remove challenge/coding/XP gather. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-gather-step.service.spec.ts` | ADD selected-only, empty and source extraction cases. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-compose-step.service.ts` | MODIFY exact target/locale/snapshot prompt and generic role fallback. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-compose-step.service.spec.ts` | ADD target threading, selected-only, unsupported-claim and RAG-degrade cases. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-score-step.service.ts` | MODIFY pass required target directly; delete inference. |
| `src/features/api/processors/ai/generate-cv/steps/generate-cv-score-step.service.spec.ts` | MODIFY exact three-level matrix and degrade cases. |
| `src/features/api/processors/ai/shared/cv-scoring/types.ts` | MODIFY use required `CvTargetLevel`; remove local optional `CvTemplateLevel` contract. |
| `src/features/api/processors/ai/shared/cv-scoring/constants.ts` | MODIFY key expectations by `CvTargetLevel`; remove default. |
| `src/features/api/processors/ai/shared/cv-scoring/cv-scoring.service.ts` | MODIFY require exact target; no `mid` fallback. |
| `src/features/api/processors/ai/shared/cv-scoring/cv-scoring.service.spec.ts` | MODIFY prove omission is impossible at typed owner and all levels map correctly. |
| `src/features/api/processors/ai/shared/cv-scoring/utils/parse-cv-score.ts` | MODIFY output typing to `CvTargetLevel`. |
| `src/features/api/processors/ai/shared/cv-scoring/score-uploaded-cv.service.ts` | MODIFY require/pass exact target level. |
| `src/features/api/processors/ai/shared/cv-scoring/score-uploaded-cv.service.spec.ts` | MODIFY exact target propagation. |
| `src/features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service.ts` | MODIFY own atomic uploaded row+job creation and terminal broker failure. |
| `src/features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service.spec.ts` | ADD transaction/payload/failure proof. |
| `src/modules/integrations/bullmq/types/payloads/score-uploaded-cv.ts` | MODIFY required target level. |
| `src/features/api/processors/ai/score-uploaded-cv/score-uploaded-cv.worker.ts` | MODIFY pass payload target to scorer. |
| `src/features/api/processors/ai/score-uploaded-cv/score-uploaded-cv.worker.spec.ts` | MODIFY exact three-level matrix. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/graphql-types/response.ts` | MODIFY typed target/snapshot/evidence level. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/cv-generation.handler.ts` | MODIFY defensive snapshot mapping and per-run level. |
| `src/features/api/core/graphql/queries/cv-submissions/cv-generation/cv-generation.handler.spec.ts` | MODIFY legacy-null/malformed/owned detail matrix. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/graphql-types/response.ts` | MODIFY lightweight target/count/evidence level. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.handler.ts` | MODIFY defensive summary mapping. |
| `src/features/api/core/graphql/queries/cv-submissions/my-cv-generations/my-cv-generations.handler.spec.ts` | ADD pagination/ownership/legacy/evidence twin. |
| `src/tests/e2e/cv-build.e2e-spec.ts` | MODIFY one GraphQL → PostgreSQL transaction → BullMQ → worker → read-back flow covering picker/generate/revise/upload. |

### ACCEPTANCE GATES

| Gate | Frozen proof |
|---|---|
| Validation | Generate/Upload reject omitted target; Generate accepts 0..5 unique UUIDs; Revise distinguishes omitted from `[]`; language only `vi|en`. |
| Ownership | Missing/failed/foreign attempt IDs fail all-or-nothing before any run/job write; foreign source revise remains not-found. |
| Atomic DB state | Unit tests prove run+job commit together and roll back together for generate/upload. |
| Durable retry | DB run snapshot equals serialized job snapshot; worker never re-queries learner activity for evidence. |
| Scoring | Every generated/uploaded call provides exact Junior/Mid/Senior; no default or XP/count inference remains. |
| Read contract | Picker, detail and history expose only frozen fields; malformed/legacy JSON never upgrades evidence. |
| E2E | Authenticated picker → generate → poll/read → revise inherit/replace/clear → upload, with real PostgreSQL/BullMQ and provider stub. |
| Repository gates | `npm run lint:check`; `npm run typecheck`; `npm run build`; focused twins; full `npm test -- --runInBand`; CV e2e; live authenticated call and schema introspection. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate capability | `cv-evidence-contract-review-r1`: B1 CV runs carry an explicit target bar and only the capstones selected for that immutable run. |
| Trust semantics | Per-run `CvEvidenceLevel` is separate from global recruiter `CvVerificationLevel`; challenge/coding cannot upgrade a CV run. |
| Consistency model | CV run and tracked job are one PostgreSQL commit; queue dispatch is post-commit and broker failure closes both durable states. |
| Compatibility | Legacy rows remain readable with nullable target/null snapshot; no silent `mid` fallback is allowed when revising them. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/cv-evidence-contract.md` | modified — appended Review findings, frozen candidate contract, exact production boundary and acceptance gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review revision và production boundary | **Approve `cv-evidence-contract-review-r1` (recommended):** gồm dedicated per-run evidence enum, required target cho Generate+Upload, legacy Revise fail-explicit, scorer không default và atomic run+job; **revise:** nêu rule/path cần đổi trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| `targetLevel` required trên Generate/Upload là additive field nhưng breaking với caller cũ không gửi field | FE Design Review/Apply phải migrate toàn bộ call sites trước khi production schema được dùng; live schema proof phải xác nhận non-null. |
| Migration giữ columns nullable cho historical rows | Null chỉ hợp lệ khi đọc legacy; mọi new run phải được test là non-null target và snapshot array. |
| Repository đang có dirty/untracked work ngoài capability | Apply phải baseline/preserve `.stacks/dev/infra/compose/keycloak.yaml`, `metadata.json`, preview và workflow khác; không được đưa chúng vào tracked feature diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Reuse global `CvVerificationLevel` cho một CV run | Dedicated `CvEvidenceLevel` hai trạng thái | Global enum có `ActivityBacked` từ challenge/coding và phản ánh user-wide trust, trái explicit selected capstone contract. |
| Giữ fallback `mid` trong shared scorer | Required `CvTargetLevel` end-to-end | Hidden default làm target bar trên UI không còn là source of truth. |
| Hai DB write độc lập cho run và job | Một primary PostgreSQL transaction | DB failure giữa hai write tạo orphan `Pending` run hoặc job không có owner. |
| Import GraphQL response type ngang operation | Shared query-family evidence object | Giữ operation ownership và tránh response folder phụ thuộc lẫn nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit Review approval | User approves exact `cv-evidence-contract-review-r1`. |
| Production implementation | `$starci-be-feature-apply` with only the approved boundary. |
| Backend runtime evidence | Apply executes all frozen unit/e2e/schema/live-call gates. |
| FE B1 component/props freeze | `$starci-fe-design-review` after backend Apply proves the live contract. |

## review approval

Approved revision: cv-evidence-contract-review-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp` @ `7acd312a858be7ed58dc847c25ec86d801be17f8`; Frontend `D:\Repositories\starci-academy-fe` / `main` @ `85f4e6663dfdea68bb56eec4956cc681641afe35` |
| Purpose | Ghi nhận explicit approval cho exact contract và production Touching boundary của `cv-evidence-contract-review-r1`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ `D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\cv-evidence-contract.md`; không chạm production source trong Review. |

### APPROVAL

| Item | Approved value |
|---|---|
| User approval | `approve cv-evidence-contract-review-r1` |
| Contract | Toàn bộ `FROZEN CONTRACT` trong candidate `cv-evidence-contract-review-r1`, không đổi. |
| Production Touching | Toàn bộ từng path trong `EXACT PRODUCTION TOUCHING BOUNDARY` của candidate `cv-evidence-contract-review-r1`, không thêm wildcard hoặc path ngoài bảng. |
| Acceptance | Toàn bộ `ACCEPTANCE GATES` của candidate `cv-evidence-contract-review-r1`. |
| Apply routing | `$starci-be-feature-apply`; Apply phải baseline target trước production write và quay lại Review nếu cần path ngoài boundary. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | `cv-evidence-contract-review-r1`: explicit target bar, selected capstone-only immutable evidence, per-run evidence level, atomic run/job persistence và no hidden scorer default. |
| Approved architecture | `CvEvidenceService` owns evidence resolution; `cv_generations` owns immutable run truth; durable payload carries identical target/snapshot; read APIs expose score và evidence trust riêng. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/cv-evidence-contract.md` | modified — appended explicit user approval and Apply handoff for `cv-evidence-contract-review-r1`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Review đã được user approve; production writes vẫn thuộc `$starci-be-feature-apply`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Root workflow validator vẫn có debt ở unrelated records | Apply không được sửa các workflow đó trong capability này; target record không xuất hiện trong validator error list. |
| Backend worktree có dirty/untracked work ngoài capability | Apply phải preserve và baseline đúng target state trước khi viết production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Candidate `cv-evidence-contract-review-r1` được approve nguyên trạng | User không yêu cầu revision thêm. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement approved backend boundary | `$starci-be-feature-apply` cites `Applied revision: cv-evidence-contract-review-r1`. |
| Prove unit/e2e/schema/live call | Apply chạy toàn bộ approved `ACCEPTANCE GATES`. |
| Freeze FE B1 component/props | `$starci-fe-design-review` sau backend Apply. |
