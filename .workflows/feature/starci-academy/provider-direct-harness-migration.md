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
| App | starci-academy; executable Nest app `core` from `nest-cli.json` |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend`, branch `mtp`, HEAD `9ac76a8d15d35377b2e308a4d6d94958c5daa1fc`; Frontend `D:\Repositories\starci-academy-fe`, branch `main`, HEAD `3f44dd7b681dc5ed27bf9787c6cf53af900298e9` |
| Purpose | Khóa exact source tree để sáu model-quality harness gọi DeepSeek API trực tiếp bằng provider API key, dùng đúng production prompt/parser và không impersonate `AiInvokeService`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa product source, harness, dependency, CI, script hay lint mirror. |

### Objective and frozen boundary

Harness quality boundary sau migration:

```text
production prompt builder
  -> OpenAI SDK configured directly for https://api.deepseek.com
  -> HARNESS_DEEPSEEK_API_KEY + exact model in each harness
  -> production parser
  -> bounded quality assertions
```

Production vẫn đi qua `AiInvokeService`, balancer, key pools, entitlement, billing và retry policy hiện tại. E2E vẫn giữ production orchestration thật và chỉ stub external provider response. Không harness nào được `provide`, `override`, wrap hoặc impersonate `AiInvokeService`.

### Schema and application evidence

| Evidence | Result |
|---|---|
| Live schema dump | `POST http://127.0.0.1:3001/graphql query{__schema{mutationType{fields{name}}}}` bị connection refused; API local không chạy tại default `CORE_PORT=3001`. |
| Full operation fallback | Đã enumerate unfiltered toàn bộ resolver operation folders dưới `src/features/api/core/graphql/mutations` và `queries`; migration không thêm operation/schema. Hai production doors liên quan là `contents/ask-content-ai` và `interview/grade-mock-interview-session`; challenge/CV/milestone grading tiếp tục qua worker/processor hiện hữu. |
| Executable app | `nest-cli.json` xác định `core` là app được `build`, `start` và CI compile; không áp dụng thay đổi vào `mock`, CLI hoặc playground agents. |
| Database | Primary PostgreSQL connection `primary` (`POSTGRESQL_PRIMARY`); migration không thêm entity/table/migration và không đổi connection. Harness content/mock-interview chỉ dùng existing primary fixtures để dựng prompt. |

### Governing and sibling evidence

| Evidence | Consequence |
|---|---|
| `TESTING-9` / `FLOW-12` | E2E không gọi model live; internal AI policy vẫn thật, external SDK result mới là seam được stub. |
| `TESTING-10` | Harness import/call provider SDK trực tiếp, explicit server API key/model/endpoint, 1–2 cases/capability; cấm fake `AiInvokeService`, OAuth/session token/tier/router/key pool. |
| `module-layering.md` | Mọi import gọi đúng declaring file; shared prompt/parser nằm trong capability đang sở hữu nó, không thêm barrel. |
| `naming.md` | Tên seam nói subject (`*PromptService`, `*ParseService`), không nói tier/provider mechanism. |
| Existing prompt sibling | `grade-mock-interview-session-prompt.service.ts` đã chứng minh production service có thể build messages qua public service rồi invoke riêng. |
| Existing parser siblings | `ChallengeEvaluationParseService`, `ProjectEvaluationParseService`, `parseCvScore` là production parser phải reuse nguyên contract. |
| DeepSeek official API | DeepSeek docs chỉ dẫn Node dùng package `openai`, `baseURL: https://api.deepseek.com`, provider API key và chat completions; JSON mode yêu cầu explicit JSON instruction vốn đã có trong grading prompts. |

### Current six-suite inventory

| Suite | Current Jest cases | Current prompt/parser seam | Defect |
|---|---:|---|---|
| `ai-tutor.harness-spec.ts` | 2 | Inline `TUTOR_SYSTEM`; `askModel`; LLM judge | Anthropic-only helper; không dùng production StarCi AI prompt. |
| `challenge-grading.harness-spec.ts` | 9 = Git 5 + Google Docs 4 | Prompt inline trong hai grade-step services; `ChallengeEvaluationParseService` | Hai `HarnessInvokeService.create()` fake `AiInvokeService`; prompt duplicate giữa services. |
| `content-ai.harness-spec.ts` | 7 = 5 scope rows + premium guard + forced failure | Public `ContentAiService.prepareMessages`; no structured parser | Hand-built fake `AiInvokeService.run`; trộn GraphQL/error/entitlement flow vào model-quality lane. |
| `cv-scoring.harness-spec.ts` | 3 | Private `buildCvContent` + `buildSystemPrompt`; `parseCvScore` called inside `CvScoringService` | Nest provider replacement cho `AiInvokeService`; guard case không phải model quality. |
| `milestone-grading.harness-spec.ts` | 6 = task A 4 + schema task B 2 | V2/legacy prompts inline trong grade-step; `ProjectEvaluationParseService` | `HarnessInvokeService` fake gateway; matrix vượt 1–2 cases/capability. |
| `mock-interview-grading.harness-spec.ts` | 5 | Public `MockInterviewGradePromptService`; parser/normalizers private trong `MockInterviewGradingService` | Fake gateway; harness phải boot business persistence để lấy parser; guard case sai lane. |
| Total | 32 Jest cases | 6 files | 5/6 suites impersonate `AiInvokeService`; toàn bộ live transport/judge bị khóa vào Claude/OAuth helper. |

### Exact prompt-builder/parser seams

| Capability | Reuse | Extract | Production owner after extraction |
|---|---|---|---|
| Global tutor | `ContentAiService.prepareMessages` with global scope | None | `src/modules/bussiness/content-ai/content-ai.service.ts` remains the sole StarCi AI persona/history builder. |
| Challenge Git + Google Docs | `ChallengeEvaluationParseService.parse` | The two inline system/human prompt branches into one `ChallengeEvaluationPromptService.build`, discriminated by `code` vs `document` | `shared/challenge-evaluation`; both grade-step services inject and use it before production `AiInvokeService.run`. |
| Content AI | `ContentAiService.prepareMessages` | None | Existing public seam already returns ordered LangChain messages. |
| CV | `parseCvScore` and existing level constants | `buildCvContent` + `buildSystemPrompt` into `CvScoringPromptService.build` | `shared/cv-scoring`; `CvScoringService` retains input guard, rubric RAG, production invoke and parse call. |
| Milestone | `ProjectEvaluationParseService.parse`, existing criteria collectors/renderers | Inline V2/legacy prompt branches into `ProjectEvaluationPromptService.build` with a discriminated V2/legacy input | `shared/project-evaluation`; grade-step retains repo/RAG/quota/job persistence. |
| Mock interview | Existing `MockInterviewGradePromptService.build` | Raw JSON parse + normalization helpers into `MockInterviewGradeParseService.parse` | Existing mutation operation folder; grading service retains trusted identity, guards, RAG, charging, checkpoint rescoring, question reviews and persistence. |

### Proposed exact product file tree

| Action | Path | Exact responsibility |
|---|---|---|
| ADD | `src/tests/helpers/harness-credentials.ts` | Read only required `HARNESS_DEEPSEEK_API_KEY`; no OAuth/profile/file/key-pool fallback and never log the value. |
| ADD | `src/tests/helpers/harness-credentials.spec.ts` | Twin cases: present trimmed key; missing/blank fails before network. |
| DELETE | `src/tests/helpers/models.ts` | Remove Anthropic client, Claude OAuth/token file, model-call helper and nested retry wall. |
| DELETE | `src/tests/helpers/harness-invoke.ts` | Remove `Pick<AiInvokeService, "run">`, message flattener and invented usage metadata. |
| DELETE | `src/tests/helpers/harness-invoke.service.ts` | Remove Nest facade that constructs fake production gateways. |
| DELETE | `src/tests/helpers/judge.ts` | Remove second Anthropic call and shared hidden model tuple; new cases use bounded observable assertions/discrimination. |
| DELETE | `src/tests/helpers/judge.service.ts` | Remove judge Nest facade. |
| MODIFY | `src/tests/helpers/test-helpers.module.ts` | Remove deleted invoke/judge providers and exports; keep Git mount, DB reset and existing test infrastructure. |
| DELETE | `scripts/set-claude-code-token.ps1` | Remove Claude Code OAuth provisioning path. |
| MODIFY | `.github/workflows/ci.yml` | Replace stale Anthropic/`ant auth login` local-harness instructions with isolated DeepSeek API-key instructions; CI remains unit-only. |
| MODIFY | `package.json` | Add direct `openai` dev dependency used by harness imports; do not change production LangChain providers. |
| MODIFY | `package-lock.json` | Lock the explicit top-level harness SDK dependency without unrelated refresh. |
| MODIFY | `src/tests/harness/ai-tutor.harness-spec.ts` | Build global StarCi AI messages through `ContentAiService.prepareMessages`; call `new OpenAI({ baseURL, apiKey }).chat.completions.create` in-spec with exact model; retain 2 cases and remove judge/Claude. |
| MODIFY | `src/tests/harness/challenge-grading.harness-spec.ts` | Instantiate production prompt builder/parser, call DeepSeek directly, reduce to 1 discrimination case for Git and 1 for Google Docs; no grade-step/AiInvoke override. |
| MODIFY | `src/tests/harness/content-ai.harness-spec.ts` | Use `prepareMessages` then direct SDK; retain lesson quote/context and global-scope quality cases; remove GraphQL fake gateway, premium guard and forced-failure cases from this lane. |
| MODIFY | `src/tests/harness/cv-scoring.harness-spec.ts` | Use `CvScoringPromptService` + `parseCvScore` around direct SDK; retain senior-vs-junior discrimination and Vietnamese feedback; drop no-input guard from harness. |
| MODIFY | `src/tests/harness/milestone-grading.harness-spec.ts` | Use `ProjectEvaluationPromptService` + `ProjectEvaluationParseService`; retain V2 discrimination and one legacy-schema quality case; remove worker/gateway impersonation. |
| MODIFY | `src/tests/harness/mock-interview-grading.harness-spec.ts` | Use existing prompt service + new parse service around direct SDK; retain strong-vs-weak discrimination and Vietnamese feedback; drop too-short guard from harness. |
| ADD | `src/features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-prompt.service.ts` | Public code/document-discriminated builder returning exact ordered system/human messages and max score. |
| ADD | `src/features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-prompt.service.spec.ts` | Byte/role parity for code vs document, locale, critical criteria, template, empty excerpt and cache-prefix invariant. |
| MODIFY | `src/features/api/processors/ai/process-git-submission/steps/process-git-submission-grade-step.service.ts` | Replace inline prompt assembly only; preserve repo/RAG/quota/charge/cache/job behavior. |
| MODIFY | `src/features/api/processors/ai/process-git-submission/steps/process-git-submission-grade-step.service.spec.ts` | Inject builder and assert outcome/usage, not private string construction; preserve current branch coverage. |
| MODIFY | `src/features/api/processors/ai/process-git-submission/process-git-submission.module.ts` | Register shared prompt service beside parser. |
| MODIFY | `src/features/api/processors/ai/process-google-docs-submission/steps/process-google-docs-submission-grade-step.service.ts` | Replace inline document prompt assembly only; preserve fetch/RAG/quota/charge/cache/job behavior. |
| MODIFY | `src/features/api/processors/ai/process-google-docs-submission/steps/process-google-docs-submission-grade-step.service.spec.ts` | Inject builder; preserve behavior assertions. |
| MODIFY | `src/features/api/processors/ai/process-google-docs-submission/process-google-docs-submission.module.ts` | Register shared prompt service beside parser. |
| ADD | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service.ts` | Build CV content/system/human messages from structured/text input, target level/language and advisory rubric. |
| ADD | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service.spec.ts` | Exact structured/text/both/empty, level, locale, rubric-present/absent and output-template parity. |
| MODIFY | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring.service.ts` | Delegate prompt construction; retain missing-input guard, RAG failure fallback, production invoke and `parseCvScore`. Preserve current CV worktree changes. |
| MODIFY | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring.service.spec.ts` | Add prompt service dependency and prove unchanged scoring/RAG/parser outcomes. |
| MODIFY | `src/features/api/processors/ai/shared/cv-scoring/types.ts` | Move/rename builder parameter types to the new public prompt seam without changing `ScoreCvParams`/result contracts. |
| MODIFY | `src/features/api/processors/ai/generate-cv/generate-cv.module.ts` | Register `CvScoringPromptService` beside `CvScoringService`. |
| ADD | `src/features/api/processors/ai/shared/project-evaluation/project-evaluation-prompt.service.ts` | Build discriminated V2 yes/no-critical or legacy rubric messages and return grade max score. |
| ADD | `src/features/api/processors/ai/shared/project-evaluation/project-evaluation-prompt.service.spec.ts` | V2/legacy, locale, ordering, critical rules, empty excerpt and exact output-template parity. |
| MODIFY | `src/features/api/processors/ai/review-milestone-task/steps/review-milestone-task-grade-step.service.ts` | Delegate prompt only; preserve repo errors, RAG, quota, invoke, pass threshold and job persistence. |
| MODIFY | `src/features/api/processors/ai/review-milestone-task/steps/review-milestone-task-grade-step.service.spec.ts` | Inject prompt service and preserve V2/legacy/business branch assertions. |
| MODIFY | `src/features/api/processors/ai/review-milestone-task/review-milestone-task.module.ts` | Register project prompt service beside parser. |
| ADD | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-parse.service.ts` | Parse raw model JSON and normalize score/verdict/phase/attribute/string/question-feedback/checkpoint fields; no persistence or rescoring. |
| ADD | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-parse.service.spec.ts` | Valid JSON, fenced JSON, malformed JSON, score clamp, verdict fallback and malformed optional arrays. |
| MODIFY | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service.ts` | Inject/use parse service; retain private checkpoint rescoring, question-review construction, charging, lock and persistence. |
| MODIFY | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service.spec.ts` | Add parser dependency and prove replay/guard/charge/persistence/checkpoint behavior unchanged. |
| MODIFY | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session.module.ts` | Register parse service beside existing prompt/grading services. |
| MODIFY | `plugins/eslint-canon/testing.mjs` | Mirror approved `harness-calls-provider-directly` rule after source findings are zero. |
| MODIFY | `plugins/eslint-canon/testing.test.mjs` | Mirror rule twin fixtures. |
| MODIFY | `eslint.config.mjs` | Enable `starci-be/harness-calls-provider-directly: error` only after migration. |

### Planned model-quality cases

| Capability | Final cases | Live SUT calls | Why these survive |
|---|---:|---:|---|
| Global tutor | 2 | 2 | ASI diagnosis and Vietnamese instruction-following expose correctness/language regression using production global persona. |
| Challenge Git | 1 | 2 | Same real challenge: passing submission must strictly outscore failing submission; parser/feedback shape asserted. |
| Challenge Google Docs | 1 | 2 | Same real challenge: complete write-up must strictly outscore vague write-up. |
| Content AI | 2 | 2 | Lesson quote/context grounding and anchorless global chat cover the two product disclosure extremes. |
| CV scoring | 2 | 3 | Senior-vs-junior discrimination plus Vietnamese feedback. |
| Milestone grading | 2 | 3 | V2 discrimination plus one legacy-schema compatibility response. |
| Mock interview | 2 | 3 | Strong-vs-weak discrimination plus Vietnamese feedback. |
| Total | 12 Jest cases across 7 measured capabilities | 17 | Down from 32 Jest cases plus judge calls; every capability stays within 1–2 cases. |

### Unit and migration test matrix

| Seam | Cases frozen before implementation |
|---|---|
| Credential | Present key is trimmed; missing/blank throws before client construction; error names env only, never value. |
| Challenge prompt | Code/document role wording differs only where intended; exact criteria order/scores/critical flags; English/Vietnamese; empty excerpt marker; JSON template; submission content stays HumanMessage so system cache prefix is stable. |
| CV prompt | Structured only, text only, both in stable order, neither empty; all levels; EN/VI; optional RAG; exact output contract. Existing `CvScoringService` still throws no-input and tolerates RAG failure. |
| Project prompt | V2 and legacy discriminants; criteria order; critical-zero rule only V2; explicit max; EN/VI; empty excerpt; JSON template. |
| Mock parser | Raw/fenced valid JSON; malformed throws domain exception; score clamp; verdict fallback; optional arrays normalize; checkpoint data preserved for grading service rescoring. |
| Direct provider | Every harness imports `openai`, sets DeepSeek base URL, reads only `HARNESS_DEEPSEEK_API_KEY`, pins exact model, checks non-empty content and response model identity where returned. |
| Negative scans | Zero `HarnessInvokeService`, `createHarnessInvoke`, `Pick<AiInvokeService`, `provide: AiInvokeService`, `overrideProvider(AiInvokeService)`, Claude OAuth/token-file matches under harness/helpers/scripts. |
| Lane separation | Existing content premium guard, model-failure response, CV missing input and mock-interview too-short guard remain proved by focused unit/E2E, not live model calls. |

### Acceptance evidence

| Gate | Command / expected result |
|---|---|
| Exact negative scan | `rg -n "HarnessInvokeService|createHarnessInvoke|Pick<AiInvokeService|provide:\\s*AiInvokeService|overrideProvider\\(AiInvokeService" src/tests/harness src/tests/helpers` -> no matches. |
| Credential scan | `rg -n "CLAUDE_CODE_OAUTH_TOKEN|claude-code-token|sk-ant-oat|OAUTH_BETA|ant auth login" src/tests scripts .github` -> no harness-related matches. |
| Focused unit | Run new prompt/parser/credential twins plus modified production service specs; all green. |
| Full unit | `npm test` green without harness lane. |
| Type/lint | `npm run typecheck`; exact changed-file ESLint; then strict provider-direct rule reports zero. Existing unrelated lint debt must be reported separately. |
| Build | `npm run build`; distinguish webpack success from ForkTsChecker OOM if the existing 2 GB child limit recurs. |
| Harness discovery | `npm run harness -- --listTests` returns exactly six suite files. |
| Live proof | `HARNESS_DEEPSEEK_API_KEY` present only in process environment; run each suite and then full `npm run harness`; record model id/case verdicts/timing, never key. |
| E2E regression | Focused `content-ai-session`, challenge submission, personal-project review, CV build and mock-interview flows remain deterministic with external provider stubs. |
| Workflow | Validate full `.workflows`; classify pre-existing failures separately from this record. |

### Assumptions and exclusions

| Item | Decision |
|---|---|
| SUT provider tuple | Default for Review: DeepSeek direct via `openai` SDK, `https://api.deepseek.com`, `HARNESS_DEEPSEEK_API_KEY`, model `deepseek-v4-pro`; no fallback. |
| Judge | Remove LLM-as-judge. Discrimination, parser shape, language and bounded semantic assertions avoid a second hidden provider tuple and reduce cost. |
| Production routing | Excluded: no change to provider catalog, `AiInvokeService`, key rotation, billing, quota or model selection. |
| Schema/data | Excluded: no GraphQL field, entity, migration or seed change. |
| Frontend | Excluded. |
| Existing CV work | Preserve current uncommitted CV evidence/scoring changes; extraction must be byte-parity over their current source, not HEAD assumptions. |
| Existing dirty worktree | Preserve unrelated course-pricing/review/enrollment and workflow edits; Apply cannot broad-format or broad-fix. |

### Parity risks

| Risk | Required control |
|---|---|
| Prompt extraction changes one byte in cached system prefix | Snapshot exact pre-extraction messages in prompt twin specs before moving code; compare role/order/content including blank lines and JSON indentation. |
| OpenAI-compatible mapping drops LangChain history or swaps roles | Each harness maps every ordered `SystemMessage`/`HumanMessage`/`AIMessage` explicitly and tests role sequence before the live call. |
| DeepSeek JSON mode makes harness unlike production | Do not force `response_format` for SUT calls unless production prompt contract already depends on it; production parser must consume the raw provider text. |
| Case reduction hides guard/flow regression | Prove each removed non-quality case in existing unit/E2E; add a focused unit only if evidence is absent, then return to Review if that requires an unlisted path. |
| Mock-interview parser extraction absorbs business rescoring | Keep checkpoint rescoring and question-review construction in `MockInterviewGradingService`; parse service only normalizes raw model fields. |
| CV source overlaps active uncommitted implementation | Apply baseline must capture current source and reconcile only approved prompt-extraction hunks; never reset or overwrite current CV changes. |
| SDK/model alias drifts | Harness asserts returned provider model identity and Review freezes exact requested model; a provider alias change becomes visible evidence, not silent fallback. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `provider-direct-harness-migration-plan-r1`: six harness files become direct DeepSeek API-key quality tests around production prompt/parser seams. |
| Architecture | Production prompt builder -> direct provider SDK -> production parser; production gateway remains solely production/E2E orchestration. |
| Scope reduction | 32 current Jest cases become 12 bounded quality cases across seven measured capabilities; non-quality guards stay unit/E2E. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `added` — evidence-backed Plan, exact source tree, case matrix, proof and risks. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Khóa live provider tuple nào cho Review? | Default: DeepSeek direct (`openai` SDK, `https://api.deepseek.com`, `HARNESS_DEEPSEEK_API_KEY`, `deepseek-v4-pro`, no fallback). Alternative: OpenAI Platform tuple nếu owner muốn đổi provider. |
| Có bỏ LLM judge không? | Default: bỏ; dùng discrimination + parser/language/semantic assertions để giảm call/cost và tránh judge tự chọn model. Alternative: giữ một judge tuple riêng, phải thêm API key/model/endpoint explicit. |

### WARNINGS

| Warning | Impact |
|---|---|
| API local port 3001 đang tắt nên schema introspection không chạy. | Không ảnh hưởng contract vì migration không thêm door/schema; full resolver-folder fallback đã được enumerate. |
| Backend worktree đang dirty và chứa current CV changes. | Apply phải baseline current state, chạm đúng approved hunks và không reset/broad-format. |
| DeepSeek model alias/API có thể đổi theo provider. | Review phải khóa exact tuple và live proof phải record returned model identity. |
| Full trust/workflow gates có known unrelated failures từ trước. | Không được báo global green; focused migration proof và unrelated debt phải tách riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Fake live provider behind `AiInvokeService` | Direct SDK call in each harness | Fake gateway invents provider/token/cost metadata and violates approved TESTING-10 boundary. |
| Claude Code OAuth/token-file authority | Isolated provider-issued harness API key | Consumer/CLI credential không phải deployed server API authority. |
| Keep 32 harness cases plus LLM judge | 12 selected cases, no judge | Live matrix is expensive, slow and exceeds 1–2 cases/capability; most removed branches belong in unit/E2E. |
| Move quota/guards/GraphQL persistence into live provider harness | Keep them deterministic in unit/E2E | Those tests prove business plumbing, not model answer quality. |
| Share a new house model-call wrapper | Only share credential loading; each harness imports/calls SDK directly | A shared transport wrapper recreates the indirection just removed. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact tree, tuple and case reduction | `$starci-be-feature-review` revision and explicit user approval. |
| Product/harness source edits | `$starci-be-feature-apply` after approved Review and Apply baseline commit. |
| Strict lint adoption | Mirror and enable approved provider-direct rule only after source findings reach zero. |
| Live API evidence | Six focused suite runs + full harness using `HARNESS_DEEPSEEK_API_KEY`, with no secret output. |
| Existing CV workflow closure | Re-run CV harness under direct-provider architecture and append final evidence to `cv-evidence-contract.md`. |

## plan r2

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
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL `primary`; no schema, entity, migration or seed delta |
| Repo / branch | Backend `mtp` @ `7902830ff5e8fe0e2a6c213ac7e04cb0fdda04f0`; Frontend `main` @ `3f44dd7b681dc5ed27bf9787c6cf53af900298e9`; Trust `main` @ `428013d08e21b66cb7e4e5edfedbcd77edb6c94c` |
| Purpose | Refresh and freeze the exact source tree for migrating all six model-quality harness suites to provider-direct OpenRouter calls. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Revision | `provider-direct-harness-migration-plan-r2` |
| Phase | plan |
| Touching | Workflow record only; no target source. |

### Evidence refresh and frozen corrections

1. The available live evidence is OpenRouter-backed DeepSeek, not a dedicated `api.deepseek.com` credential. The exact SUT tuple proposed to Review is therefore `openai` SDK + `https://openrouter.ai/api/v1` + `HARNESS_OPENROUTER_API_KEY` + `deepseek/deepseek-v4-flash`. OpenRouter currently documents both the SDK configuration and model slug. Source may not read `OPENROUTER_KEYS`; Apply may only map one authorized key into the isolated variable process-only for proof.
2. Every harness file imports and calls the SDK directly. `harness-credentials.ts` may validate one environment variable but may not construct a client, select a model or call the provider.
3. Keep exactly six discovered suites and the r1 case budget: 12 Jest cases, 17 SUT calls across global tutor, Git challenge, Google Docs challenge, content AI, CV, milestone and mock-interview capabilities.
4. Guards, quota, entitlement, HTTP/worker/persistence and forced-provider-failure branches remain deterministic unit/E2E evidence. They do not call a live model.
5. `ContentAiService.prepareMessages` remains REUSE-only. No new content-AI prompt utility or changes to `content-ai` types are in the exact tree unless Review proves that the public seam cannot be instantiated without flow infrastructure.
6. The strict lint boundary is only `plugins/eslint-canon/testing.mjs`, `plugins/eslint-canon/testing.test.mjs` and `eslint.config.mjs`. Full sync currently reveals unrelated authorization, exception-identity and index mirror drift; those six generated files are excluded from this feature.

### Exact tree delta over plan r1

| Action | Path | Boundary |
|---|---|---|
| MODIFY | `src/tests/harness/jest-harness.json` | Remove `harness-setup`/`harness-teardown` after content harness stops booting the Docker flow stack; still discover exactly six suites. |
| DELETE | `src/tests/helpers/harness-setup.ts` | No Testcontainers setup in model-quality lane. |
| DELETE | `src/tests/helpers/harness-teardown.ts` | No Testcontainers teardown in model-quality lane. |
| MODIFY | `docs/secrets-map.md` | Document local-only `HARNESS_OPENROUTER_API_KEY`; never a value, token file or key-pool authority. |
| MODIFY | `package.json` | Preserve the current dirty `build` edit; remove direct `@anthropic-ai/sdk` only after zero non-deleted references; add explicit `openai@^4.104.0`. |
| MODIFY | `package-lock.json` | Lock only that direct dependency delta; no broad refresh. |
| MODIFY | `.github/workflows/ci.yml` | Replace Anthropic/`ant auth login` comments with isolated OpenRouter key instructions; CI remains unit-only. |

All ADD/MODIFY/DELETE production prompt/parser paths and six harness files listed in plan r1 remain frozen. `AiInvokeService`, provider catalog, key rotation, quota, billing, entitlement, E2E provider-result seam and GraphQL schema remain REUSE-only.

### Test and acceptance refinement

| Gate | Exact proof |
|---|---|
| Credential | Present key is trimmed; missing/blank fails before client creation; error names only `HARNESS_OPENROUTER_API_KEY`. |
| Direct-call scan | Zero `HarnessInvokeService`, `createHarnessInvoke`, `Pick<AiInvokeService`, `provide: AiInvokeService` and `overrideProvider(AiInvokeService)` in harness/helpers. |
| Authority scan | Zero harness authority through `CLAUDE_CODE_OAUTH_TOKEN`, `claude-code-token`, `sk-ant-oat`, `OAUTH_BETA`, `ant auth login` or `OPENROUTER_KEYS`. |
| Prompt/parser parity | Exact role/order/content snapshots before extraction; mock parser normalization twins; existing parser twins remain green. |
| Focused/full gates | New and modified twins, `npm test`, `npm run typecheck`, `npm run build`, changed-file ESLint and provider-direct rule at zero. Report existing lint debt and any ForkTsChecker OOM separately. |
| Discovery/live | `npm run harness -- --listTests` returns six files; run each suite and then full harness using process-only key, recording requested/returned model, verdict and duration without secrets. |

### OUTPUTS

| Concept | Result |
|---|---|
| Exact architecture | Production prompt builder -> direct OpenRouter/OpenAI SDK -> production parser; no production gateway impersonation. |
| Exact scope | Six harnesses, r1 prompt/parser seams, helper deletion, Docker harness setup deletion, dependency/CI/secrets docs and three testing-lint files. |
| Case budget | 12 cases / 17 SUT calls before optional judge calls. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | Appended evidence refresh `plan-r2`; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| LLM judge boundary | Keep a separate judge only for free-form tutor/content cases, with its own explicit OpenRouter tuple using `deepseek/deepseek-v4-pro`; structured graders use parser/discrimination only. This keeps semantic quality evidence without doubling every structured case. Alternative: delete `judge.ts` entirely. Review must freeze one option because it changes files and billed calls. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local API `3001` was not listening | Live schema introspection failed; unfiltered operation-folder fallback completed and schema delta remains none. |
| Worktree is materially dirty, including CV and `package.json` | Apply must baseline current source, preserve concurrent changes and patch only approved hunks. |
| Trust/workflow and backend lint have unrelated known debt | Provider-direct proof must be reported separately; no global-clean claim. |
| OpenRouter model availability/pricing is runtime state | Recheck official model page immediately before live proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| DeepSeek direct endpoint without evidenced credential | OpenRouter tuple already proven in this workspace | Exact authority must match available evidence. |
| Production `OPENROUTER_KEYS` pool in harness source | One isolated harness key variable | No pool, fallback or routing layer. |
| New shared SUT invoke helper | SDK call in every harness | Prevents hidden model/provider selection. |
| Content-AI prompt/type extraction by default | Reuse public `prepareMessages` | Smaller production boundary; no invented seam. |
| Full generated lint sync | Testing mirror only | Unrelated drift belongs to its owning audit/sync workflow. |

### OWED

| Owed | Cleared by |
|---|---|
| Judge choice and final challenge of every exact path | `starci-be-feature-review` and explicit approval of one revision. |
| Product/harness edits | `starci-be-feature-apply` after approved Review and baseline commit. |
| Live evidence | Six focused runs plus full harness with process-only key. |

## plan r3

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
| App | starci-academy; Nest executable `core` |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` on `mtp`; Frontend `D:\Repositories\starci-academy-fe` on `main` |
| Purpose | Correct the harness model targets from one global DeepSeek choice to the production AI allocation per capability. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | plan |
| Touching | This workflow record only. |

### Production AI allocation evidence

| Layer | Source evidence | Allocation |
|---|---|---|
| Catalog | Live `ai_models` rows plus `.gitmounts/data/ai-models/*/en.md` | Enabled generation roster is Low `qwen/qwen3.7-flash`, Medium `deepseek/deepseek-v4-flash`, High `openai/gpt-5.6-luna`, all through OpenRouter. |
| Task filter | `UseApiService.runAuto` | Removes models whose `supportedTasks` do not include the requested task; then preserves category order and orders within a category by health/latency/weight. |
| Chat | Content gateway, legacy content handler and mock-interview turn gateway | `floor: Low`, `task: Chatting`; default live model is Qwen 3.7 Flash. DeepSeek is only the Medium fallback if the Low chat model cannot serve. |
| Automatic grading | `GRADING_FLOOR_CATEGORY`, Git, CV, milestone and mock-interview grading | Defaults to Medium and is capped at Medium; current enabled workhorse is DeepSeek V4 Flash. It never auto-escalates to High. |
| Google Docs challenge | Grade-step explicitly starts Low, task `ChallengeGrading` | Qwen Low is filtered out because it supports only `Chatting`; the chain proceeds to Medium DeepSeek. |
| High | `resolveGradingInvokeOptions` pinned branch | GPT-5.6 Luna is reachable only through an explicit user model/provider pin; it is not an automatic default or fallback. |
| Entitlement | `TIER_ALLOWED_CATEGORIES` | Free includes Low + Medium so an unpaid learner can still be graded. Paid/enrolled unlocks High, but automatic grading remains capped at Medium. |

### Corrected harness target matrix

| Harness capability | Production task/floor | Exact direct SUT target |
|---|---|---|
| Global tutor (`ai-tutor`) | `Chatting` / Low | OpenRouter `qwen/qwen3.7-flash` |
| Content AI | `Chatting` / Low | OpenRouter `qwen/qwen3.7-flash` |
| Challenge Git | `ChallengeGrading` / Medium | OpenRouter `deepseek/deepseek-v4-flash` |
| Challenge Google Docs | `ChallengeGrading` / Low→task-filtered Medium | OpenRouter `deepseek/deepseek-v4-flash` |
| CV scoring | `CVGenerating` / Medium | OpenRouter `deepseek/deepseek-v4-flash` |
| Milestone grading | `TaskGrading` / Medium | OpenRouter `deepseek/deepseek-v4-flash` |
| Mock-interview grading | `Grading` / default Medium | OpenRouter `deepseek/deepseek-v4-flash` |

Every suite still imports/calls the OpenAI SDK directly, uses `https://openrouter.ai/api/v1`, and reads only `HARNESS_OPENROUTER_API_KEY`. The model constant is local to each harness and mirrors the production allocation above; no harness invokes the production balancer or key pool.

### Plan correction

- Replace every r2 statement that assigns DeepSeek V4 Flash to all six harnesses with the target matrix above.
- Keep the exact file tree, 12-case budget, 17 SUT-call budget, prompt/parser extraction, helper deletion, CI/secrets changes and strict testing-lint boundary unchanged.
- Optional LLM judge remains a distinct evaluation target, not the SUT allocation. Evidence-backed default for Review is OpenRouter `openai/gpt-5.6-luna`, because it is the enabled High grading model and avoids DeepSeek grading its own answer.
- Add a pre-live catalog parity assertion/documented check: requested harness model must equal the current enabled production model for that capability's task/floor. If the catalog changes, return to Review instead of silently switching.

### Allocation findings outside migration boundary

| Finding | Impact |
|---|---|
| `TIER_ALLOWED_CATEGORIES[AiSubTier.Max]` contains `High` twice | Harmless for current filtering but a real catalog/entitlement cleanup candidate; excluded from harness migration. |
| Live `text-embedding-3-small` is still category `low` and local `qwen3-embedding:8b` has empty tasks | Indicates seed/migration drift on the embedding axis; unrelated to the six generation harnesses and must route to a separate backend audit/feature plan. |
| Several source comments still say Free/Economy/Balanced/Premium/Frontier | Naming drift after Low/Medium/High migration; does not change runtime allocation but should not be copied into new harness code. |

### OUTPUTS

| Concept | Result |
|---|---|
| Plan revision | `provider-direct-harness-migration-plan-r3` |
| AI allocation | Chat harnesses use production Low Qwen; grading harnesses use production Medium DeepSeek; High Luna is pin-only and proposed only as optional judge. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `modified` — appended production allocation scan and corrected per-capability model matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Judge target | Default: retain judge only for free-form tutor/content using OpenRouter `openai/gpt-5.6-luna`; alternative: remove LLM judge entirely. |

### WARNINGS

| Warning | Impact |
|---|---|
| Allocation comes from current source, mounted catalog and live PostgreSQL | A reseed/admin catalog change can alter it; Apply must recheck before live proof. |
| Embedding catalog has independent drift | Do not mix its repair into the six-harness migration. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| DeepSeek V4 Flash for every harness | Per-capability production allocation | Chat modules actually default to Qwen Low; DeepSeek is the grading workhorse. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge r3 allocation and judge choice | `starci-be-feature-review` plus explicit approval. |
| Embedding/category and duplicate-High cleanup | Separate backend audit/feature workflow; excluded here. |

## review

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
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; no schema, entity, migration or seed delta |
| Repo / branch | Backend `mtp` @ `7902830ff5e8fe0e2a6c213ac7e04cb0fdda04f0`; Frontend `main` @ `3f44dd7b681dc5ed27bf9787c6cf53af900298e9`; Trust `main` @ `428013d08e21b66cb7e4e5edfedbcd77edb6c94c` |
| Purpose | Challenge plan r3 and freeze the exact production/test boundary for six provider-direct model-quality harness suites. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Revision | `provider-direct-harness-migration-review-r1` (proposed; approval pending) |
| Phase | review |
| Touching | This workflow record only. No handler, service, module, schema, dependency or test source is changed in Review. |

### Review verdict and frozen architecture

Plan r3 is implementation-feasible after the corrections below. The production architecture remains unchanged: production callers continue through `AiInvokeService`, catalog allocation, entitlement, quota, billing and provider routing. Only the live quality harness lane calls OpenRouter directly.

Each harness file must construct its own OpenAI-compatible client and invoke its own local model constant. Shared test code may validate credentials and judge answers, but may not construct the SUT client, choose the SUT model, flatten prompts into a new house protocol or call the SUT provider on a harness's behalf.

The direct SUT tuple is frozen as:

| Field | Value |
|---|---|
| SDK | Direct `openai` SDK import in every harness suite |
| Endpoint | `https://openrouter.ai/api/v1` |
| Credential | Required process-only `HARNESS_OPENROUTER_API_KEY` |
| Chat model | `qwen/qwen3.7-flash` for global tutor and contextual content AI |
| Grading model | `deepseek/deepseek-v4-flash` for Git, Google Docs, CV, milestone and mock-interview grading |
| Fallback | None; any provider/model failure fails that live case visibly |

The independent judge is retained only for the four free-form tutor/content answers. Its tuple is separately frozen as `openai` SDK + `https://openrouter.ai/api/v1` + required `HARNESS_OPENROUTER_JUDGE_API_KEY` + `openai/gpt-5.6-luna`, with no fallback. The source may deliberately map one authorized OpenRouter secret into both process variables for a local proof, but code must require the two authorities independently and must never infer one from the other.

### Challenges and revisions over plan r3

| Finding | Frozen revision |
|---|---|
| `ai-tutor` and `content-ai` both planned an anchorless/global case | `ai-tutor` owns global StarCi tutoring: ASI/coding diagnosis and Vietnamese instruction following. `content-ai` owns contextual augmentation: lesson/quote grounding and challenge-context grounding. |
| Removing all judge code would weaken semantic proof for open-ended answers | Keep `src/tests/helpers/judge.ts`, migrate it from Anthropic to the separate Luna tuple, and add `judge.spec.ts`. Delete only the Nest judge facade. Structured graders use parser and discrimination assertions without judge calls. |
| One credential variable would make judge independence implicit | `harness-credentials.ts` validates both exact environment variables independently, trims present values, rejects missing/blank before client construction, and never includes values in errors. |
| Content premium, content provider failure, CV missing input and mock-interview too-short currently appear in the live harness inventory | Premium and CV missing-input already have deterministic unit coverage. Add a provider-rejection case to `ask-content-ai.handler.spec.ts`; add the too-short/no-invoke case to `grade-mock-interview-session-grading.service.spec.ts`; then remove all four from the live quality lane. |
| Content harness currently boots GraphQL, PostgreSQL/Testcontainers and a fake `AiInvokeService` | Reduce it to `ContentAiService.prepareMessages` plus direct SDK and judge. Remove harness global setup/teardown; deterministic GraphQL/session behavior remains in existing E2E. |
| `openai` is currently transitive while both production ping code and the new harness import it | Add explicit top-level `openai@^4.104.0`; remove direct `@anthropic-ai/sdk` only after deleted/migrated test helpers leave zero direct imports. |
| Prompt extraction could change cached system prefixes or parsers could absorb business behavior | Freeze byte/role/order twin specs before extraction. New parser/prompt services only format/parse; quota, RAG, retries, charge, persistence, pass thresholds and checkpoint rescoring remain in their current owners. |

### Exact approved-for-approval source tree

This table supersedes conflicting r1/r2 statements, especially deletion of `judge.ts` and a single-model allocation.

| Action | Exact paths and boundary |
|---|---|
| ADD | `src/tests/helpers/harness-credentials.ts`; `src/tests/helpers/harness-credentials.spec.ts`; `src/tests/helpers/judge.spec.ts` — isolated credential validation and Luna judge twins only. |
| MODIFY | `src/tests/helpers/judge.ts`; `src/tests/helpers/test-helpers.module.ts`; `src/tests/harness/jest-harness.json` — direct separate judge, remove deleted Nest providers, remove Docker global setup/teardown while discovering exactly six suites. |
| DELETE | `src/tests/helpers/models.ts`; `src/tests/helpers/harness-invoke.ts`; `src/tests/helpers/harness-invoke.service.ts`; `src/tests/helpers/judge.service.ts`; `src/tests/helpers/harness-setup.ts`; `src/tests/helpers/harness-teardown.ts`; `scripts/set-claude-code-token.ps1`. |
| MODIFY | `src/tests/harness/ai-tutor.harness-spec.ts`; `src/tests/harness/challenge-grading.harness-spec.ts`; `src/tests/harness/content-ai.harness-spec.ts`; `src/tests/harness/cv-scoring.harness-spec.ts`; `src/tests/harness/milestone-grading.harness-spec.ts`; `src/tests/harness/mock-interview-grading.harness-spec.ts` — direct per-suite SDK calls and the frozen case matrix below. |
| ADD | `src/features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-prompt.service.ts`; matching `.spec.ts`. |
| MODIFY | Git `process-git-submission-grade-step.service.ts`, matching `.spec.ts`, and `process-git-submission.module.ts`; Google Docs `process-google-docs-submission-grade-step.service.ts`, matching `.spec.ts`, and `process-google-docs-submission.module.ts` — prompt delegation only. |
| ADD | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service.ts`; matching `.spec.ts`. |
| MODIFY | `src/features/api/processors/ai/shared/cv-scoring/cv-scoring.service.ts`; matching `.spec.ts`; `types.ts`; `src/features/api/processors/ai/generate-cv/generate-cv.module.ts` — prompt delegation/type ownership only. |
| ADD | `src/features/api/processors/ai/shared/project-evaluation/project-evaluation-prompt.service.ts`; matching `.spec.ts`. |
| MODIFY | `src/features/api/processors/ai/review-milestone-task/steps/review-milestone-task-grade-step.service.ts`; matching `.spec.ts`; `review-milestone-task.module.ts` — prompt delegation only. |
| ADD | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-parse.service.ts`; matching `.spec.ts`. |
| MODIFY | `src/features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service.ts`; matching `.spec.ts`; `grade-mock-interview-session.module.ts` — parser delegation plus deterministic too-short guard proof. |
| MODIFY | `src/features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.handler.spec.ts` — provider rejection propagates, billing is not consumed, and no false answer is returned. Production handler is REUSE-only. |
| MODIFY | `package.json`; `package-lock.json`; `.github/workflows/ci.yml`; `docs/secrets-map.md` — explicit SDK dependency and local-only two-key harness documentation, with no key values. |
| MODIFY | `plugins/eslint-canon/testing.mjs`; `plugins/eslint-canon/testing.test.mjs`; `eslint.config.mjs` — add and enable the exact provider-direct harness rule after source findings reach zero. |

The abbreviated Git/Google Docs path rows above mean exactly the full paths already named in plan r1; Apply may not expand to sibling processors. No frontend, GraphQL schema/resolver/request/response, entity, migration, seed, catalog, entitlement, balancer, production provider, embedding or generated lint-mirror file is in boundary.

### Frozen live case and call budget

| Capability | Jest cases | SUT calls | Judge calls | Acceptance |
|---|---:|---:|---:|---|
| Global tutor | 2 | 2 Qwen | 2 Luna | ASI/coding diagnosis; Vietnamese instruction following. |
| Challenge Git | 1 | 2 DeepSeek | 0 | Passing submission strictly outscores failing submission; parser shape valid. |
| Challenge Google Docs | 1 | 2 DeepSeek | 0 | Complete document strictly outscores vague document; parser shape valid. |
| Contextual content AI | 2 | 2 Qwen | 2 Luna | Lesson/quoted selection is grounded; challenge question uses challenge context. |
| CV scoring | 2 | 3 DeepSeek | 0 | Senior strictly outscores junior; Vietnamese feedback is valid. |
| Milestone grading | 2 | 3 DeepSeek | 0 | V2 strong/weak discrimination; legacy schema remains parseable. |
| Mock interview | 2 | 3 DeepSeek | 0 | Strong strictly outscores weak; Vietnamese feedback is valid. |
| Total | 12 | 17 | 4 | 21 billed provider calls in a full harness run; every capability remains at 1–2 Jest cases. |

### Frozen proof and acceptance

| Gate | Required evidence |
|---|---|
| Schema/application | Unfiltered live schema at `http://127.0.0.1:3001/graphql` still exposes the existing AI/content/challenge/CV/interview operations; no door or schema delta. Primary DB stays `primary`. |
| Catalog parity | Immediately before live proof, verify enabled allocation still maps Chatting/Low to Qwen and structured grading/Medium to DeepSeek. Any changed model returns to Review; no silent substitution. |
| Prompt/parser twins | Exact role, order, byte content, locale, blank-line, JSON-template and cache-prefix parity for extracted seams; parser normalization only. |
| Deterministic guards | Existing content premium and CV no-input tests green; new content provider-rejection and mock too-short/no-invoke unit cases green. |
| Credential twins | Present/trimmed, missing and blank cases for both `HARNESS_OPENROUTER_API_KEY` and `HARNESS_OPENROUTER_JUDGE_API_KEY`; errors name variables only. |
| Negative source scan | Zero `HarnessInvokeService`, `createHarnessInvoke`, `Pick<AiInvokeService`, `provide: AiInvokeService` or `overrideProvider(AiInvokeService)` under harness/helpers. |
| Authority scan | Zero harness use of `CLAUDE_CODE_OAUTH_TOKEN`, `claude-code-token`, `sk-ant-oat`, `OAUTH_BETA`, `ant auth login` or production `OPENROUTER_KEYS`. |
| Dependency scan | Zero surviving direct `@anthropic-ai/sdk` imports before removing its top-level dependency; every harness itself imports `openai`. |
| Focused/full gates | New/modified twins; `npm test`; `npm run typecheck`; `npm run build`; exact changed-file ESLint; strict provider-direct rule at zero. Unrelated pre-existing failures must be reported separately. |
| Harness | `npm run harness -- --listTests` returns exactly six suites; run each suite and the full harness with process-only credentials, recording requested/returned model, verdict and duration without secrets. |
| E2E | Existing content session, challenge submission, project review, CV and mock-interview flows remain deterministic and stub only the external provider result. |
| Workflow | Full workflow validator passes for this record; unrelated workflow failures are itemized rather than hidden. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability | Six production-parity, provider-direct model-quality harness suites with deterministic business-flow coverage kept outside the live lane. |
| Architecture | Production prompt builder -> direct per-suite OpenRouter SDK call -> production parser; optional semantic evaluation is a separately authorized Luna judge only for four free-form answers. |
| Proposed frozen revision | `provider-direct-harness-migration-review-r1`; no production implementation is authorized until explicit approval. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | Appended Review challenge, corrected exact boundary, case/call budget and proof obligations only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Freeze this implementation boundary? | Default: approve `provider-direct-harness-migration-review-r1` exactly, including separate Luna judge for four free-form answers and the two deterministic guard specs. Alternative: reject the judge, then issue Review r2 with `judge.ts`/judge spec removed and 17 total calls. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree is dirty, including unrelated workflow, Jest and integration-test changes. | Apply must first commit the current approved target-source baseline per skill, preserve unrelated work and patch only this exact boundary. |
| Live provider allocation and aliases are mutable runtime data. | Recheck catalog immediately before live calls; drift returns to Review. |
| Full harness makes 21 billed external calls. | Never run it in default CI; use explicit local process credentials and report cost-sensitive evidence. |
| Existing lint/workflow debt is outside this feature. | No global-clean claim unless those independent gates actually pass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One DeepSeek model for all six suites | Qwen for Chatting/Low; DeepSeek for structured grading/Medium | Mirrors the live production allocation. |
| DeepSeek judging its own answers or a hidden shared judge model | Separate explicitly keyed Luna judge for free-form answers only | Avoids self-evaluation and makes authority/model/cost visible. |
| Delete every judge artifact | Retain and migrate plain `judge.ts`; delete only Nest facade | Free-form answer quality needs semantic evidence; structured outputs do not. |
| Duplicate global chat coverage in two harnesses | Global tutor cases in `ai-tutor`; lesson/quote and challenge context in `content-ai` | Separates global capability from context augmentation. |
| Keep business guards in billed live harness | Deterministic service/handler specs | Guards prove orchestration, not model quality. |
| Shared SUT provider wrapper | Direct SDK import/call in each harness | Prevents hidden routing, fallback, model substitution and invented usage metadata. |
| Production key pool or Claude Code OAuth | Two isolated process-only OpenRouter variables | Harness authority must be explicit and independent from deployed routing or consumer credentials. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit owner decision on this exact Review revision | Reply `approve provider-direct-harness-migration-review-r1` or request a revision. |
| Product/test implementation | `$starci-be-feature-apply` only after the exact Review revision is approved. |
| Baseline and preservation proof | Apply records current target-source baseline before edits and preserves all unrelated dirty work. |
| Live quality evidence | Apply runs six focused suites and the full 21-call harness with the two process-only credentials. |

## review r2

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
| App | starci-academy; Nest executable `core` |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` @ `7902830ff5e8fe0e2a6c213ac7e04cb0fdda04f0`; Frontend D:\Repositories\starci-academy-fe on `main` @ `3f44dd7b681dc5ed27bf9787c6cf53af900298e9` |
| Purpose | Record explicit owner approval of the exact provider-direct harness Review boundary before Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | review |
| Touching | This workflow record only; production and test source remain untouched. |

Approved revision: `provider-direct-harness-migration-review-r1`

Owner approval received verbatim: `approve provider-direct-harness-migration-review-r1`.

The exact source tree, Qwen/DeepSeek SUT allocation, separately authorized Luna judge, 12-case/17-SUT-call/4-judge-call budget, deterministic guard migration, exclusions and proof gates are unchanged from the preceding Review revision. This approval authorizes `$starci-be-feature-apply` to begin with its required baseline commit; it does not itself perform source writes.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | Six provider-direct, production-allocation-parity AI quality harness suites with deterministic business guards outside the billed live lane. |
| Approved architecture | Per-suite OpenRouter SDK SUT calls: Qwen for chat, DeepSeek for grading, plus separately keyed Luna judge for four free-form answers. |
| Approved revision | `provider-direct-harness-migration-review-r1` is frozen for Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `modified` — appended explicit owner approval and Apply handoff; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Review is approved; Apply may begin under the frozen boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree remains dirty with unrelated files. | Apply must baseline current target state and preserve every unrelated change. |
| Provider allocation is mutable runtime data. | Apply must recheck the catalog before live proof and return to Review on drift. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | The owner approved Review r1 without revision. | No new rejection was supplied. |

### OWED

| Owed | Cleared by |
|---|---|
| Baseline, implementation and all frozen proof gates | Run `$starci-be-feature-apply` against `provider-direct-harness-migration-review-r1`. |

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
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; no schema, entity, migration or seed write |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Implement and prove the approved provider-direct harness migration without changing production AI routing. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | apply |
| Touching | Exact ADD/MODIFY/DELETE paths frozen in `provider-direct-harness-migration-review-r1`, plus this workflow record only. |

Applied revision: `provider-direct-harness-migration-review-r1`

Baseline commit: `4a39096a6fa35a21e1010da3b74e2779902a7252`

Tracked diff: `4a39096a6fa35a21e1010da3b74e2779902a7252..worktree`

Owner production-write confirmation received verbatim: `confirm mtp + baseline current worktree + exact r1 boundary`.

### Apply state

| State | Evidence |
|---|---|
| Baseline | Committed the complete confirmed current worktree before any implementation edit; commit created 12-file baseline with 1,245 insertions and 3 deletions. |
| Parallel boundary | Six disjoint implementation slices: chat/helpers, challenge, CV, milestone, mock interview, and dependency/lint/CI. Workflow integration and final proof remain with the primary Apply agent. |
| Status | Implementation in progress; no proof claim is complete yet. |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply start | Approved revision is active on the confirmed `mtp` target with a recoverable baseline. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `modified` — recorded Apply context, owner confirmation, baseline and tracked diff. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact production boundary and baseline were explicitly confirmed. |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply proof has not run yet. | No implementation or green-gate claim is made in this start event. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Apply follows the approved Review unchanged. | No new architecture decision is allowed in Apply. |

### OWED

| Owed | Cleared by |
|---|---|
| Source implementation and exact diff reconciliation | Finish all six approved write slices and compare against baseline. |
| Unit/typecheck/build/lint/E2E/live proof | Run every frozen acceptance gate and append exact command results. |

## apply r2

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
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; no schema, entity, migration or seed write |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Record the implemented provider-direct harness migration, final deterministic gates and live provider evidence. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | apply |
| Touching | Exact paths frozen in `provider-direct-harness-migration-review-r1` plus this workflow record; concurrent workflow/preview edits outside this task are preserved and excluded from the implementation commit. |

Applied revision: `provider-direct-harness-migration-review-r1`

Baseline commit: `4a39096a6fa35a21e1010da3b74e2779902a7252`

Tracked diff: `4a39096a6fa35a21e1010da3b74e2779902a7252..worktree`

### Implementation evidence

| Capability | Implemented result |
|---|---|
| Harness authority | Every suite constructs and calls its own OpenAI-compatible OpenRouter client; source reads only `HARNESS_OPENROUTER_API_KEY`. Luna judge separately reads `HARNESS_OPENROUTER_JUDGE_API_KEY`. No OAuth, token-file, production key pool, fallback or shared SUT invoke wrapper remains. |
| Allocation | Global tutor and contextual content call `qwen/qwen3.7-flash`; Git, Google Docs, CV, milestone and mock interview call `deepseek/deepseek-v4-flash`; free-form judge calls `openai/gpt-5.6-luna`. Live PostgreSQL catalog recheck matched Low/Medium/High allocation immediately before proof. |
| Prompt seams | Challenge code/document, CV structured/text and milestone V2/legacy prompt construction moved into production services with byte/role/order twins. Existing production routing, RAG, quota, charge, persistence and parsers remain owners of business behavior. |
| Mock parser | Raw/fenced JSON normalization moved into a parse-only service; checkpoint rescoring, question reviews, replay, charge and persistence remain in grading service. Too-short guard is now deterministic unit evidence. |
| Content guards | Provider rejection is deterministic in `ask-content-ai.handler.spec.ts`; premium and CV missing-input guards remain in existing unit suites. |
| Live-derived corrections | Luna judge now requires `pass` iff score is at least 60; structured harnesses no longer force `response_format` absent from production transport; Git passing fixture now implements every critical contract before discrimination. No threshold was weakened. |

### Proof commands and results

| Gate | Exact result |
|---|---|
| Live schema | Unfiltered introspection at `http://127.0.0.1:3001/graphql`: `askContentAi`, challenge submission, CV generate/revise/upload, project review, mock-interview grade and AI model/health operations all present. |
| Catalog | Live `ai_models`: Qwen 3.7 Flash Low/OpenRouter, DeepSeek V4 Flash Medium/OpenRouter and GPT-5.6 Luna High/OpenRouter enabled. Embedding drift remained excluded. |
| Focused unit | `npx jest --selectProjects unit --runInBand <12 approved specs>`: 12 suites, 61 tests passed. |
| Full unit | `npm test -- --runInBand`: 222 suites, 1,445 tests passed. |
| Typecheck | `npm run typecheck`: exit 0. |
| Build | `npm run build`: webpack compiled successfully; only existing Node built-in package-version warnings. |
| Changed-file lint | ESLint over 39 changed/new TypeScript and MJS files: exit 0, no errors. |
| Canon twins | `node --test plugins/eslint-canon/testing.test.mjs`: 6/6 passed, including TESTING-10. |
| Harness discovery | `npm run harness -- --listTests`: exactly six approved suite files. |
| Individual live suites | All six passed: AI tutor 2/2, content 2/2, challenge 2/2, CV 2/2, milestone 2/2, mock interview 2/2. |
| Full live harness | Process-only credential mapping; `npm run harness`: 6 suites, 12 cases, 21 provider calls passed in 200.062 seconds. No key value was printed or persisted. |
| Content E2E | `content-ai-session.e2e-spec.ts`: 1 suite, 6/6 passed through the deterministic E2E lane. |
| Other focused E2E | Grouped run timed out after 604 seconds. Challenge retry timed out after 304 seconds, including retry after stale Ryuk cleanup; personal-project run showed the same startup hold and was terminated. No assertion failure was emitted. |
| Diff check | `git diff --check 4a39096a..worktree`: clean. |

The broad negative regex still finds baseline `src/tests/helpers/flow-world.ts` providing `AiInvokeService` for deterministic E2E infrastructure. No harness imports that helper, and it existed unchanged at baseline. Harness files and harness-owned helpers contain zero forbidden gateway/OAuth/key-pool authority; the strict TESTING-10 rule reports zero findings.

### OUTPUTS

| Concept | Result |
|---|---|
| Implemented capability | Six production-allocation-parity provider-direct quality harnesses with 12 bounded cases and 21 explicit live calls. |
| Production architecture | Prompt builders/parsers are reusable production seams; deployed AI still routes exclusively through existing catalog, entitlement, quota, billing and `AiInvokeService`. |
| Quality outcome | Full unit/typecheck/build/lint and full live harness are green without lowering thresholds or adding fallback. |

### CHANGES

| Tree | Details |
|---|---|
| `src/tests/helpers/harness-credentials.ts`; matching `.spec.ts` | `added` — independently validated process-only SUT and judge credentials. |
| `src/tests/helpers/judge.ts`; matching `.spec.ts` | `modified` / `added` — direct separately keyed Luna judge and consistent pass/score contract. |
| `src/tests/helpers/models.ts`; `harness-invoke.ts`; `harness-invoke.service.ts`; `judge.service.ts`; `harness-setup.ts`; `harness-teardown.ts` | `deleted` — removed Claude/OAuth, fake gateway and harness Docker indirection. |
| `src/tests/helpers/test-helpers.module.ts`; `src/tests/harness/jest-harness.json` | `modified` — removed deleted providers and global Docker hooks. |
| Six files under `src/tests/harness/*.harness-spec.ts` | `modified` — exact 12-case direct-provider matrix. |
| `src/features/api/processors/ai/shared/challenge-evaluation/challenge-evaluation-prompt.service.ts`; matching `.spec.ts` | `added` — exact code/document prompt builder and twins. |
| Git grade-step service/spec/module | `modified` — prompt delegation only. |
| Google Docs grade-step service/spec/module | `modified` — prompt delegation only. |
| `src/features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service.ts`; matching `.spec.ts` | `added` — structured/text CV prompt builder and twins. |
| CV scoring service/spec/types; `generate-cv.module.ts` | `modified` — prompt delegation and registration only. |
| `src/features/api/processors/ai/shared/project-evaluation/project-evaluation-prompt.service.ts`; matching `.spec.ts` | `added` — V2/legacy milestone prompt builder and twins. |
| Milestone grade-step service/spec/module | `modified` — prompt delegation only. |
| Mock-interview parse service/spec | `added` — provider JSON normalization only. |
| Mock-interview grading service/spec/module | `modified` — parser delegation, registration and deterministic too-short proof. |
| `src/features/api/core/graphql/mutations/contents/ask-content-ai/ask-content-ai.handler.spec.ts` | `modified` — deterministic provider-rejection proof. |
| `package.json`; `package-lock.json` | `modified` — explicit OpenAI SDK and removal of direct Anthropic SDK. |
| `.github/workflows/ci.yml`; `docs/secrets-map.md` | `modified` — local-only two-key harness instructions without values. |
| `plugins/eslint-canon/testing.mjs`; matching `.test.mjs`; `eslint.config.mjs` | `modified` — strict provider-direct harness enforcement and twins. |
| `scripts/set-claude-code-token.ps1` | `deleted` — removed consumer Claude OAuth provisioning. |
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `modified` — Plan, Review, approval, baseline and Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved source implementation and live proof are complete. |

### WARNINGS

| Warning | Impact |
|---|---|
| Four named deterministic flow E2E suites could not pass Testcontainers startup/teardown in this run. | They emitted no assertion regression; content flow passed 6/6, but challenge/project/CV/mock-interview E2E proof remains owed. |
| Full workflow validator contains many historical errors outside this record. | This record must be checked separately and may not be represented as a globally clean workflow root. |
| Concurrent workflow/preview edits appeared after baseline. | They are preserved outside the feature implementation commit and excluded from this Apply claim. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Treat Luna `pass: true, score: 10` as a failed Qwen answer | Tighten judge consistency contract | Judge reasons explicitly confirmed the answer met the rubric; pass/score inconsistency was the defect. |
| Keep `response_format: json_object` in structured harnesses | Mirror production raw model response and parse it with production parsers | Review forbids harness-only transport behavior; forced JSON mode intermittently returned `{}`. |
| Lower Git discrimination threshold after equal zero scores | Complete the passing fixture's missing critical implementation and HTTP door | DeepSeek correctly detected the fixture did not meet its own critical rubric. |
| Claim timed-out E2E suites passed | Record exact startup timeout as owed proof | No assertion result was produced. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge, personal-project, CV and mock-interview deterministic flow E2E | Stabilize local Testcontainers global setup/teardown, then rerun the four named specs without changing provider-direct source. |
| Historical workflow-root validator debt | Repair through its owning workflow audit; this feature record itself must remain at zero validator errors. |

## apply r3

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
| App | starci-academy; Nest executable `core` |
| Database | Primary PostgreSQL connection `primary`; no schema, entity, migration or seed write |
| Repo / branch | D:\Repositories\starci-academy-backend on `mtp` |
| Purpose | Diagnose and rerun the four owed deterministic E2E proofs without widening the approved provider-direct migration boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\provider-direct-harness-migration.md |
| Language | vi |
| Phase | apply |
| Touching | This workflow record only; no production, harness or E2E configuration source changed. |

Applied revision: `provider-direct-harness-migration-review-r1`

Baseline commit: `4a39096a6fa35a21e1010da3b74e2779902a7252`

Implementation commit: `099a9a8eeb3197f6257109e1dc919637891a7ba4`

Tracked diff: `4a39096a6fa35a21e1010da3b74e2779902a7252..099a9a8eeb3197f6257109e1dc919637891a7ba4`

### Runtime diagnosis

| Check | Evidence |
|---|---|
| Testcontainers primitive | Standalone `PostgreSqlContainer('postgres:16-alpine').start()` with Ryuk disabled started and stopped successfully in 2.8 seconds. |
| E2E stack primitive | Standalone `e2e-setup` plus `e2e-teardown`, profile `core`, completed successfully in 5.6 seconds. |
| Concurrent lock | A simultaneous `nivo-backend` E2E owned the per-user Testcontainers lock during one retry. StarCi was waiting before container creation; the unrelated process was preserved and allowed to finish. |
| Clean retry | After the external lock was released, a canonical one-file `--runTestsByPath` retry still remained before Testcontainers container creation; `proper-lockfile.check` reported `locked=false`. |
| Transform experiment | Ignoring all `node_modules` made Jest start quickly but failed on required ESM dependencies. A selective ESM allowlist loaded the target suite, then remained in the same pre-container global-setup/module-evaluation hold. No business assertion ran or failed. |
| Boundary decision | `src/tests/e2e/jest-e2e.json` and E2E infrastructure are outside Review r1. Apply did not mutate them or claim the four flows green. |

### OUTPUTS

| Concept | Result |
|---|---|
| Migration status | Provider-direct harness implementation and its previously recorded unit/build/lint/live-provider proofs remain complete at commit `099a9a8e`. |
| E2E status | The four owed flow suites remain unproved because the shared Jest E2E lane does not reach container startup; no flow assertion regression was observed. |
| Required next workflow | Plan and review a bounded E2E runner/global-setup repair before changing `jest-e2e.json` or related infrastructure. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/provider-direct-harness-migration.md` | `modified` — appended bounded retry evidence, root-cause boundary and honest owed status. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for approved r1 | No additional provider-direct source write is needed or authorized. |

### WARNINGS

| Warning | Impact |
|---|---|
| The shared Jest E2E lane can remain indefinitely before container creation even when Docker, Postgres/Redis stack startup and the global lock are independently healthy. | Challenge, personal-project, CV and mock-interview flow proof cannot be honestly closed under the current runner. |
| A permanent repair would touch files outside `provider-direct-harness-migration-review-r1`. | It requires a separate Plan -> Review -> Apply boundary; current Apply must not edit those files. |
| Concurrent unrelated worktree changes remain present. | They were preserved and are excluded from this record and any evidence-only commit. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Edit `src/tests/e2e/jest-e2e.json` inside this Apply | Route the runner defect through a new bounded backend feature workflow | The file is outside the explicitly approved r1 source tree. |
| Treat a pre-container timeout as a business-flow failure | Record it as E2E infrastructure evidence | No test hook or assertion emitted a failure. |
| Stop the concurrent Nivo E2E | Preserve it and wait for its lock to release | It belongs to unrelated user work. |

### OWED

| Owed | Cleared by |
|---|---|
| Repair the shared Jest E2E global-setup/module-evaluation hold | New backend Plan -> Review -> Apply covering the exact E2E runner/config source. |
| Challenge, personal-project, CV and mock-interview deterministic flow E2E | Rerun the four named specs after the runner repair and record actual assertions. |
| Historical workflow-root validator debt | Repair through its owning workflow audit; this feature record itself must remain at zero validator errors. |
