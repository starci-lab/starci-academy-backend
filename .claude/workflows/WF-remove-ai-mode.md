# WF-remove-ai-mode · Xóa khái niệm AiMode (auto/premium/byok)

- **Status:** undone (plan — chờ thầy chốt câu hỏi §1)
- **Repo:** backend (`mtp`) + frontend (`mtp`)
- **Effort:** L (cross-cutting: enum + 5 cột DB + services + ~8 DTO + 5 response + FE)
- **Owner:** (chưa gán)

## Vì sao xóa (thầy chốt: "đâu cần đâu")
Sau khi chuyển sang **unified credit pool** + **tier-based model ceiling**, phân biệt mode đã **thừa**:
- **Auto** = balancer tự chọn model free/economy (không pin). **Premium** = user pin 1 model (tier cho phép). → cả hai **tiêu cùng 1 pool**; khác biệt DUY NHẤT là *"user có pin model không + tier đủ cao không"* → biểu diễn được bằng `tier` + `selectedModel`, **không cần enum mode**.
- **Byok** = dùng key riêng của user (bypass pool). Đây là distinction THẬT duy nhất — **nhưng FE đã bỏ BYOK khỏi main flow** (comment `AiSettings`: *"BYOK removed... grading + tutor run only on StarCi System pool"*). BE vẫn wired nhưng FE-dead.
- **FE đã collapse sẵn:** không còn mode-picker, chỉ còn **model-picker** (`GradeModelDropdown`), mode tự suy từ `canPremium`. Việc còn lại = dọn BE + DB.

## §1 — CÂU HỎI CHỐT TRƯỚC (thầy quyết)
**BYOK xử lý sao?** (auto/premium chắc chắn xóa)
- **A. Xóa luôn BYOK** (đơn giản nhất — FE đã dead, ít user). Mọi AI job chạy qua StarCi pool. Bỏ hết byok (entitlement bypass, `byokProvider/byokApiKey/clearByok`, `canByok/hasByokKey/byokKeyLast4`).
- **B. Giữ BYOK nhưng bỏ enum** — thay mode bằng 1 boolean/nhánh (vd `useByokKey` hoặc "có byokApiKey → bypass"). Giữ khả năng BYOK mà không cần AiMode.
→ Em nghiêng **A** (thầy muốn gọn + FE đã bỏ). Nếu sau cần BYOK lại thì thêm boolean, không cần enum 3 giá trị.

## Phạm vi (ground từ research)
### Pha 1 — BE logic (collapse branching)
- `types/ai-job-selection.ts`: `AiJobSelection` union (Auto/Premium/Byok) → `{ model?, provider? }` (+ byok nhánh nếu chọn B).
- `grading-lane-validation.service.ts`: bỏ switch theo `mode` → validate đơn: *"selectedModel có nằm trong `TIER_ALLOWED_CATEGORIES[tier]` không"*. Không pin = balancer.
- `ai-entitlement.service.ts`: bỏ `resolveEffectiveMode`/`resolvePreferredMode`/`assertModeAvailable`. Giữ `creditAllowance(tier)` + `TIER_ALLOWED_CATEGORIES` (vốn key theo tier, KHÔNG theo mode).
- `resolve-grading-invoke-options.ts` + `flat-fields-to-ai-job-selection.ts` + `validated-lane-to-ai-job-selection.ts`: `selectedModel ? pin : balancer-loop([Free,Economy])`. Bỏ nhánh mode.
- `ai-invoke.service.ts` + `balancer/use-api.service.ts`: bỏ param `lane: AiMode` (chỉ là label).
- ⚠️ **`credit-usage.service.ts` READ `mode=Auto`** khi sum window → sửa logic sum (bỏ filter mode; pool giờ 1 lane).

### Pha 2 — GraphQL surface
- **Request DTO bỏ `mode?`** (~8): submit-challenge-submission · sync-submission · grade-interview-answer · review-personal-project-task · run-playground-prompt · submit-eval-challenge · ask-content-ai · generate-cv/revise-cv. (+ `update-my-ai-settings`: bỏ `byokProvider/byokApiKey/clearByok` nếu chọn A.)
- **Response bỏ field mode:** `MyAiSettingsResponseData` (`preferredMode`/`effectiveMode`/`canByok`/`byokProvider`/`hasByokKey`/`byokKeyLast4`) · `MyAiQuotaResponseData.mode` · credit-usage-history response.

### Pha 3 — DB + migration
- Drop **5 cột**: `ai_subscriptions.preferred_mode` · `credit_usage_histories.mode` · `ai_lab_runs.ai_mode` · `ai_lab_eval_runs.ai_mode` · `user_challenge_submissions.selected_mode`.
- Drop enum type `ai_mode` (sau khi 5 cột đã drop → hết dependent → `DROP TYPE ai_mode` sạch, KHÔNG deadlock vì không còn cột nào).
- Bỏ `enum AiMode` + `GraphQLTypeAiMode` khỏi `enums/ai-mode.ts` + `enums/index.ts`.

### Pha 4 — FE
- `GradeModelDropdown` + `AiLab/LaneModelPicker`: bỏ suy `mode` từ `canPremium` → chỉ gửi `selectedModel`/`provider`.
- Mutation types: bỏ `mode` khỏi 7 mutation (submitChallengeSubmission, generateCv, reviseCv, gradeInterviewAnswer, reviewPersonalProjectTask, runPlaygroundPrompt, submitEvalChallenge).
- `AiSettings`/`AiUsage`: dọn nốt (đã bỏ BYOK sẵn; AiUsage còn render 2 lane → về 1 pool).

## ⚠️ Prod deploy (synchronize=true policy)
- Prod `POSTGRESQL_PRIMARY_SYNCHRONIZE=true` (policy — [[model-provider-enum-and-nats-recreate-gotcha]]). Khi entity bỏ 5 cột → synchronize **tự drop cột**; enum `ai_mode` hết dependent → synchronize `DROP TYPE` sạch (KHÔNG deadlock như vụ ai_mode 2026-07-04, vì lần đó còn cột dùng type).
- **Nhưng nếu synchronize vẫn kẹt** → fix thủ công trên prod DB: `<drop 5 cột>` rồi `DROP TYPE ai_mode` (dùng creds Bitnami `POSTGRESQL_*`, DB `starci-academy`, `-u postgres`). Pattern y vụ ai_mode.
- Deploy lockstep BE+FE (response bỏ field → FE không được select field đã xóa).

## Acceptance
- [ ] `grep -rn "AiMode\|preferred_mode\|selected_mode\|\.mode\b" src` (BE) → chỉ còn chỗ hợp lệ (byok nếu chọn B).
- [ ] Enum `ai_mode` + 5 cột biến mất khỏi prod DB; core boot sạch.
- [ ] AI grading/CV/interview vẫn chạy (pool + tier + selectedModel); credit trừ đúng.
- [ ] tsc/eslint 2 repo sạch; FE không select field mode đã xóa.

## Rủi ro
- `credit_usage_histories.mode` đang được READ (sum window) → đổi logic cẩn thận kẻo tính credit sai.
- Nhiều mutation gửi `mode` → sót 1 chỗ = GraphQL "unknown field" khi BE bỏ. Grep kỹ FE.
