export const meta = {
  name: 'mock-interview-be-p0',
  description: 'Build BE mock-interview P0: gradeInterviewAnswer GraphQL mutation + interview grading bussiness service, reusing the AI grading stack (stateless)',
  phases: [
    { title: 'Recon & plan' },
    { title: 'Implement & verify' },
  ],
}

const CONTEXT = `# Feature: Mock-Interview free-text grading (BE, P0 stateless)

Repo: C:/Repositories/ac/starci-academy-backend (NestJS + TypeORM + GraphQL/Apollo + CQRS).
Design doc: docs/mock-interview-flow-design.md (READ IT FIRST).

## What P0 is
A GraphQL mutation that grades a candidate's spoken-then-transcribed answer to an interview question.
The question bank = existing flashcard cards. The card's model answer (FlashcardCardEntity.answer, a 3-block markdown rubric) is the grading rubric.
P0 is STATELESS: no new entity, no migration, no persistence of attempts. Just: take input -> grade with AI -> return result.

## Decisions (already made — do NOT re-litigate)
- STT happens on the FRONTEND (Web Speech API). BE only receives text. This task is BE ONLY.
- Reuse the existing AI grading stack: GradeModelRouterService + AiBalancerService/UseApiService + AiEntitlementService + GradingLaneValidationService. Task kind = AiTaskKind.Grade.
- Lane: resolve from the user's subscription preferredMode via AiEntitlementService (same as challenge grading); allow optional override via input.mode (AiMode).
- Auth: guard the mutation with KeycloakAuthGraphQLGuard (same as other AI mutations).

## Mutation contract
gradeInterviewAnswer(input: { flashcardDeckId: ID!, flashcardCardId: ID!, transcript: String!, locale: Locale!, mode: AiMode }): InterviewGradeResult!
type InterviewGradeResult { score: Int!  verdict: InterviewVerdict!  strengths: [String!]!  gaps: [String!]!  modelAnswerHint: String  followUpQuestion: String }
enum InterviewVerdict { PASS BORDERLINE FAIL }
Server loads the card (question + answer) from the deck by id — do NOT trust a question/rubric sent by the client.
Grading prompt must tell the model: transcript came from speech-to-text so ignore spelling/term-recognition errors and grade the substance; adjust expectations by card.level; output STRICT JSON matching the result shape; write strengths/gaps/followUp/modelAnswerHint in the request locale.`

const REFERENCES = `## Read these to learn the exact patterns + real API signatures (do not guess signatures):
- docs/mock-interview-flow-design.md
- .cursor/rules/starci-academy.mdc  (coding conventions: module layout, params/result objects, JSDoc-per-member, no type/enum/interface inside *.service.ts, English-only comments)
- src/modules/ai/grade-model-router.service.ts
- src/modules/ai/balancer/use-api.service.ts  AND  src/modules/ai/balancer/ai-balancer.service.ts  (how to actually invoke a model + which params)
- src/modules/ai/ai-entitlement.service.ts  AND  src/modules/ai/grading-lane-validation.service.ts  (how grading resolves/validates the lane and debits quota)
- src/features/api/processors/process-git-submission-v2/steps/process-git-submission-v2-grade-step.service.ts  (the REAL end-to-end "build grade prompt -> call model -> parse" pattern to mirror)
- src/features/api/core/graphql/mutations/ai/update-my-ai-settings/  (mirror this module's file layout: resolver + handler(CQRS) + module + graphql-types/{request,response} + index)
- src/modules/databases/postgresql/primary/entities/flashcard-card.entity.ts  AND  flashcard-deck.entity.ts
- src/modules/bussiness/flashcard/flashcard-deck.service.ts  (how to load a deck/card) and src/modules/bussiness/bussiness.module.ts (how bussiness services are registered/exported)
- the GraphQL mutations aggregator module that registers mutation modules (find where update-my-ai-settings is imported) — your new mutation module must be registered the same way.`

phase('Recon & plan')
const plan = await agent(
  `${CONTEXT}

${REFERENCES}

## YOUR JOB (recon only — do NOT write any code yet)
Read the reference files above and produce a PRECISE, file-by-file implementation plan for the P0 BE feature. The plan must include, for every file to create or edit:
- exact path
- its responsibility
- the REAL signatures/imports it will use (copy the actual method names + param/return shapes you saw in UseApiService / GradeModelRouterService / AiEntitlementService / GradingLaneValidationService, and how the existing grade step calls them)
- how it mirrors the update-my-ai-settings module structure (resolver/handler/module/graphql-types/index)
- where and how to register: the new bussiness interview module in bussiness.module.ts, and the new mutation module in the mutations aggregator
Also note: the exact way the existing AI mutation resolves the user from the Keycloak context, and how the grade step parses model output into structured data (so we can force strict JSON). Call out any uncertainty explicitly.
Return the full plan as text.`,
  { label: 'recon', phase: 'Recon & plan' },
)

phase('Implement & verify')
const result = await agent(
  `${CONTEXT}

## IMPLEMENTATION PLAN (produced by a recon pass — follow it; correct it only where it is demonstrably wrong against the actual code)
${plan}

## YOUR JOB — implement the P0 BE feature now
Create the bussiness layer and the GraphQL mutation exactly per the plan, mirroring update-my-ai-settings and the existing grade-step grading call. Stateless: NO entity, NO migration.
Suggested layout (adjust to match repo conventions you observed):
- src/modules/bussiness/interview/interview-prompt.service.ts  (build the grading prompt from question + answer rubric + level + transcript + locale)
- src/modules/bussiness/interview/interview-grading.service.ts  (load card; entitlement/lane via AiEntitlementService + GradingLaneValidationService; call GradeModelRouter + AiBalancer/UseApi with AiTaskKind.Grade; parse STRICT JSON -> result)
- src/modules/bussiness/interview/interview.module.ts + index.ts ; register/export in bussiness.module.ts
- src/features/api/core/graphql/mutations/interview/grade-interview-answer/ : resolver, handler (CQRS), module, graphql-types/{request.ts,response.ts}, enums (InterviewVerdict), index ; register the module in the mutations aggregator
Guard with KeycloakAuthGraphQLGuard. Follow .cursor/rules/starci-academy.mdc strictly (params object + result object naming, JSDoc on every member, NO type/enum/interface declared inside *.service.ts files — put them in sibling types/enums files, English-only comments).

## VERIFY (be honest — do not claim success you did not observe)
1. Run: bash -c 'npx tsc --noEmit -p tsconfig.json 2>&1 | grep -iE "interview|grade-interview" || echo "NO TSC ERRORS IN NEW FILES"'
   NOTE: the repo already has ~113 PRE-EXISTING unrelated tsc errors and "nest build" may OOM — that is NOT your concern. You ONLY need ZERO errors mentioning the files you created (interview / grade-interview). If tsc cannot run at all, say so explicitly.
2. Run eslint --fix on the files you created and confirm it is clean.
3. Do NOT modify unrelated files except the two minimal registrations (bussiness.module.ts + mutations aggregator).
Report: every file you created/edited, the tsc result for your files, the eslint result, and anything you could NOT verify and why.`,
  { label: 'implement', phase: 'Implement & verify' },
)

return result
