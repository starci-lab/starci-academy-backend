import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    AiCeilSurface,
    AiModelTask,
    FlashcardCardEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewAttemptEntity,
    MockInterviewEntity,
    MockInterviewMode,
    MockInterviewSeedQuestion,
    MockInterviewSessionEntity,
    normalizeMockInterviewKind,
    normalizeMockInterviewMode,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    GradingLaneValidationService,
    extractJsonBlock,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
import {
    MockInterviewSessionTooShortException,
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    CourseRagRetrievalService,
} from "@modules/rag"
import {
    UserService,
} from "@modules/bussiness"
import {
    toUnknownRecord,
} from "@modules/common"
import {
    MockInterviewGradePromptService,
} from "./grade-mock-interview-session-prompt.service"
import {
    parseFlashcardAnswerKeywords,
} from "./mock-interview-seed-grounding.util"
import {
    MockInterviewVerdict,
    type GradeMockInterviewSessionParams,
    type MockInterviewAttributeScore,
    type MockInterviewGradeSessionResult,
    type MockInterviewPhaseScore,
    type MockInterviewQuestionReview,
    type MockInterviewSeedGrounding,
    type MockInterviewTurnRecord,
} from "./types"

/**
 * One `questionFeedback[]` entry as returned raw by the model (see
 * {@link MockInterviewGradePromptService.buildQna}'s new output field) —
 * intermediate shape between the raw JSON parse and the fully-built
 * {@link MockInterviewQuestionReview} (which also needs the transcript +
 * seed groundings, not available inside {@link MockInterviewGradingService.parse}).
 */
interface MockInterviewQuestionFeedbackItem {
    /** 0-based question index this feedback line applies to. */
    index: number
    /** One-line what-was-missing summary for this specific question. */
    feedback: string
}

/**
 * One `coveredCheckpoints[]` entry as returned raw by the model — which authored
 * checkpoints the candidate actually established for one question. The SCORE is derived
 * from these in code, so the model reports evidence rather than picking a number.
 */
interface MockInterviewCoveredCheckpointItem {
    /** 0-based question index this coverage applies to. */
    index: number
    /** 0-based checkpoint numbers this answer established. */
    covered: Array<number>
}

/** Ceiling applied when an answer missed a checkpoint marked `critical`. */
const CRITICAL_MISS_SCORE_CAP = 60

/** Minimum allowed interview score/attribute value. */
const MIN_SCORE = 0

/** Maximum allowed overall score / attribute value. */
const MAX_SCORE = 100

/** Default per-phase max when the model omits it. */
const DEFAULT_PHASE_MAX = 100

/** Score at/above which a missing/garbled verdict falls back to a pass. */
const PASS_SCORE_THRESHOLD = 75

/** Score at/above which a missing/garbled verdict falls back to borderline (below → fail). */
const BORDERLINE_SCORE_THRESHOLD = 50

/**
 * Maximum characters of joined candidate turns fed into the RAG retrieval
 * query — keeps the query short (embedding models degrade on very long
 * inputs) while still capturing the substance of what the candidate said
 * across the whole session.
 */
const RAG_QUERY_MAX_CHARS = 2000

/**
 * Minimum total characters across the candidate's own turns (joined, the same
 * text used to build the RAG query — see {@link RAG_QUERY_MAX_CHARS}) required
 * before a session is considered substantive enough to grade. Below this, the
 * transcript is functionally empty (a learner who clicked through without
 * answering, or answered with a couple of filler words) — grading it would
 * only ever produce a "fail", would burn a real AI credit charge on a
 * non-attempt, and would pollute the rolling job-readiness interview average
 * ({@link import("@modules/api/core/graphql/queries/users/job-readiness/job-readiness.service").JobReadinessService})
 * with a data point that isn't a real attempt. 100 chars is roughly one short
 * real sentence ("Chúng ta có thể dùng hàng đợi tin nhắn để tách rời các
 * service." / "We could use a message queue to decouple the services.") —
 * comfortably above a one-word/filler non-answer, comfortably below any
 * genuine attempt at any of the 5 phases.
 */
const MIN_SUBSTANTIVE_ANSWER_LENGTH = 100

@Injectable()
/**
 * Grading for a WHOLE mock-interview SESSION (not one question — the
 * candidate answered across all 5 phases in a single conversation). Retrieves
 * course material via RAG to ground the grading in what the course actually
 * taught, builds the 5-phase rubric prompt, invokes the shared AI grading
 * lane, and parses the strict-JSON scorecard. Also records the AI credit
 * charge (surfaced on the "Lịch sử dùng AI" page) and a
 * {@link MockInterviewAttemptEntity} row for cross-session interview history.
 * Mirrors the flashcard `InterviewGradingService`'s structure closely, but
 * grades a whole session against a 5-phase rubric instead of one answer
 * against a single model-answer rubric.
 */
export class MockInterviewGradingService {
    /** Logger scoped to this service for the session-lookup-miss warning (see {@link resolveTrustedPromptIdentity}). */
    private readonly logger = new Logger(MockInterviewGradingService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mockInterviewGradePromptService: MockInterviewGradePromptService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly contentRagRetrievalService: CourseRagRetrievalService,
        private readonly userService: UserService,
    ) { }

    /**
     * Grade one whole mock-interview session.
     *
     * @param params - User, course, prompt/session identity, the full
     *   transcript, locale, and optional lane pick.
     * @returns The parsed, normalized session grade result.
     * @throws AiQuotaExhaustedException when the user is over the rolling Auto credit pool.
     * @throws ParsingCriteriaResultsFromModelTextException when the model output is not parseable JSON.
     */
    async grade(
        params: GradeMockInterviewSessionParams,
    ): Promise<MockInterviewGradeSessionResult> {
        const {
            userId,
            courseId,
            promptId: clientPromptId,
            promptTitle: clientPromptTitle,
            level: clientLevel,
            turns,
            sessionId,
            locale,
            selectedModel,
            selectedModelProvider,
        } = params

        // Pha 2 integrity fix: prefer the SERVER-stored prompt/level/mode from the
        // `startMockInterviewSession` draw over whatever the client echoes back —
        // a client-sent promptId/promptTitle/level can be tampered with (e.g. a
        // learner claiming to have drawn a harder capstone prompt than they
        // actually did, to inflate their job-readiness interview average), and
        // `mode` in particular MUST come from the server draw (never the client)
        // so a learner cannot claim "design" to dodge a Q&A rubric or vice versa.
        // Falls back to the client-sent values (+ a warn log, mode falls back to
        // "design") when no session row is found, so a mid-flight session started
        // before this fix shipped (or a session from a different flow) never
        // hard-fails the grade.
        const {
            promptId,
            promptTitle,
            level,
            mode,
            seedQuestions,
            lang: sessionLang,
            countsToReadiness,
            name,
        } = await this.resolveTrustedPromptIdentity({
            userId,
            courseId,
            sessionId,
            clientPromptId,
            clientPromptTitle,
            clientLevel,
        })

        // mode="qna" grades each question against ITS OWN kind's rubric — a
        // "theory" question needs its seed card's authored answer + `:::chip`
        // keywords (fetched here, server-side, never trusted from the client, so
        // a learner cannot forge/omit the reference answer used against them);
        // reasoning/scenario questions carry a grounding entry too (so the
        // grader still knows their kind) but their answer/keywords go unused by
        // the open rubric. Empty for mode="design" (it has no seed questions).
        const seedGroundings = mode === MockInterviewMode.Qna
            ? await this.resolveSeedGroundings(seedQuestions,
                turns,
                sessionLang)
            : []

        // join the CANDIDATE's own words only — the interviewer's prompts would just
        // echo the rubric back at itself and dilute both the substance check and the
        // retrieval query with phrasing that isn't what the candidate actually said.
        // Used for BOTH the near-empty-session guard below AND the RAG query.
        const candidateAnswerText = turns
            .filter((turn) => turn.role === "candidate")
            .map((turn) => turn.content)
            .join(" ")
            .trim()

        // reject a near-empty session BEFORE charging credit or touching the AI lane
        // at all — a learner who clicked through without answering must not burn a
        // real charge, and must not get a persisted "fail" attempt polluting their
        // rolling job-readiness interview average with a non-attempt.
        if (candidateAnswerText.length < MIN_SUBSTANTIVE_ANSWER_LENGTH) {
            throw new MockInterviewSessionTooShortException({
                candidateCharCount: candidateAnswerText.length,
                minRequired: MIN_SUBSTANTIVE_ANSWER_LENGTH,
            })
        }

        // gate on the SAME unified credit pool every other grading surface reads
        // (tier-aware — a paid Pro/Max user gets their tier's real ceiling, not the
        // free base).
        await this.aiEntitlementService.assertNotOverQuota({
            userId,
        })

        // validate the optional model/provider pick against the user's entitlement
        // and the ai_models catalog, then collapse it into the AI job selection. No
        // pick validates to an empty selection (the balancer picks). Mirrors the
        // challenge grading wiring exactly.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)

        // qna (interview-bank) grades by comparing the candidate to each question's
        // AUTHORED answer/rubric — the authored answer IS the ground truth, so NO
        // content RAG (cheaper + more precise + immune to retrieval miss). `design`
        // has no per-question reference, so it still grounds in course material.
        const { excerpt: courseExcerpt, matchedContentIds } = mode === MockInterviewMode.Qna
            ? {
                excerpt: "",
                matchedContentIds: [] as Array<string>,
            }
            : await this.contentRagRetrievalService.retrieveCourseExcerpt({
                courseId,
                query: candidateAnswerText.slice(0,
                    RAG_QUERY_MAX_CHARS),
                topK: 10,
            })

        // build the grading messages — the design's 5-phase rubric or the qna
        // mode's per-question rubric (each question graded by ITS OWN kind:
        // coverage for theory, open for reasoning/scenario), branched inside the
        // prompt service by `mode`
        const { messages } = this.mockInterviewGradePromptService.build({
            promptTitle,
            mode,
            level,
            turns,
            seedGroundings,
            courseExcerpt,
            locale,
        })

        // ONE shared entry (temperature defaults to 0 → deterministic grading)
        const {
            text, model, provider, cost, promptTokens, completionTokens, attempts,
        } = await this.aiInvokeService.run({
            userId,
            messages,
            selection,
            surface: AiCeilSurface.Interview,
        })

        // charge NOW — before parsing — so a malformed model response can never leak a
        // free grading call. Billed by the model that served, matching the
        // challenge-grading service exactly.
        await this.aiEntitlementService.consume({
            userId,
            cost,
            surface: AiCeilSurface.Interview,
            task: AiModelTask.Grading,
            model,
            provider,
            promptTokens,
            completionTokens,
            attempts,
        })

        const parsed = this.parse(text)

        // Where a question carries authored checkpoints AND the model reported which of
        // them the answer established, the score becomes the SUM of those bands instead of
        // a number the model chose: the same answer now always earns the same score, and
        // the total is explainable per checkpoint ("missing #2 cost 16"). Questions with no
        // checkpoints, or a model that omitted the field, keep the model's own score.
        const coveredByIndex = new Map(
            parsed.coveredCheckpoints.map((item) => [item.index,
                item.covered]),
        )
        let rescored = false
        const phaseScores = parsed.phaseScores.map((phase, index) => {
            const checkpoints = seedGroundings[index]?.checkpoints
            const covered = coveredByIndex.get(index)
            if (!checkpoints || checkpoints.length === 0 || !covered) {
                return phase
            }
            rescored = true
            return {
                ...phase,
                score: this.scoreFromCheckpoints(checkpoints,
                    covered),
            }
        })
        // keep the headline consistent with the per-question scores it summarises —
        // leaving the model's own overall next to recomputed question scores would let
        // the two contradict each other on the same scorecard
        const overallScore = rescored && phaseScores.length > 0
            ? Math.round(
                phaseScores.reduce((sum, phase) => sum + phase.score,
                    0) / phaseScores.length,
            )
            : parsed.overallScore

        // build the per-question model-answer reviews (qna only — see
        // buildQuestionReviews's own doc for why design has none) from the
        // SAME three server-held sources used to grade: the transcript's
        // turns, the session's persisted seed groundings, and the model's own
        // per-question phaseScores/questionFeedback just parsed above.
        const questionReviews = mode === MockInterviewMode.Qna
            ? this.buildQuestionReviews({
                turns,
                seedGroundings,
                phaseScores,
                questionFeedback: parsed.questionFeedback,
                matchedContentIds,
            })
            : []

        const result: MockInterviewGradeSessionResult = {
            ...parsed,
            overallScore,
            phaseScores,
            verdict: this.normalizeVerdict(parsed.verdict,
                overallScore),
            matchedContentIds,
            questionReviews,
        }
        // persist the graded session for cross-session interview history (best-effort —
        // a history write must never fail the grade the user is waiting on)
        await this.persistAttempt({
            userId,
            courseId,
            promptId,
            promptTitle,
            level,
            mode,
            sessionId,
            result,
            countsToReadiness,
            name,
        })
        return result
    }

    /**
     * Resolve the TRUSTED prompt/mode identity (`promptId` / `promptTitle` /
     * `level` / `mode` / `seedQuestions`) for one grade call — looked up from
     * the persisted {@link MockInterviewSessionEntity} row
     * `startMockInterviewSession` wrote, scoped to the caller's OWN enrollment
     * (a session can never be graded on behalf of a different enrollment's
     * draw). `mode` is NEVER accepted from the client (there is no client-sent
     * `mode` on the grading request at all — this is the ONLY place it can
     * come from), so a learner cannot pick a lenient rubric for their own
     * answers. Falls back to the client-sent prompt/level values (+
     * `mode="design"`) when no session row is found (session predates this
     * fix, or the caller supplied a stale/unknown `sessionId`) — logged as a
     * WARN rather than thrown, so an in-flight session started before this
     * change ships never hard-fails grading.
     *
     * @param params - The caller's identity + the client-sent prompt/level to fall back to.
     * @returns the trusted (or client-fallback) prompt/mode identity, including whether it should feed job-readiness.
     */
    private async resolveTrustedPromptIdentity(
        params: {
            userId: string
            courseId: string
            sessionId: string
            clientPromptId: string
            clientPromptTitle: string
            clientLevel: string | null
        },
    ): Promise<{
        promptId: string
        promptTitle: string
        level: string | null
        mode: MockInterviewMode
        seedQuestions: Array<MockInterviewSeedQuestion>
        lang: string | null
        countsToReadiness: boolean
        name: string | null
    }> {
        const {
            userId,
            courseId,
            sessionId,
            clientPromptId,
            clientPromptTitle,
            clientLevel,
        } = params

        // resolve (or lazily create) the SAME trial enrollment persistAttempt uses,
        // so the by-id session lookup is scoped to the caller's own enrollment
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const session = await this.entityManager.findOne(
            MockInterviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        id: enrollment.id,
                    },
                },
                select: {
                    id: true,
                    promptId: true,
                    promptTitle: true,
                    level: true,
                    lang: true,
                    mode: true,
                    seedQuestions: true,
                    countsToReadiness: true,
                    name: true,
                },
            },
        )

        if (!session) {
            this.logger.warn(
                `No mock_interview_sessions row found for sessionId=${sessionId} enrollmentId=${enrollment.id} — falling back to client-sent prompt identity (mode="design").`,
            )
            return {
                promptId: clientPromptId,
                promptTitle: clientPromptTitle,
                level: clientLevel,
                // no session row → predates the mode split (or an unknown
                // sessionId) → the only mode that could have existed is "design"
                mode: MockInterviewMode.Design,
                seedQuestions: [],
                lang: null,
                // a "design" fallback always counts towards job-readiness —
                // there was no configurable-setup axis before this column existed
                countsToReadiness: true,
                // no session row → no user-chosen name to copy
                name: null,
            }
        }

        return {
            promptId: session.promptId,
            promptTitle: session.promptTitle,
            level: session.level,
            mode: normalizeMockInterviewMode(session.mode),
            seedQuestions: session.seedQuestions ?? [],
            lang: session.lang,
            countsToReadiness: session.countsToReadiness,
            name: session.name,
        }
    }

    /**
     * Fetch each seed card's authored answer + parsed `:::chip` keywords for
     * every drawn question, ALONGSIDE that question's own randomly-assigned
     * kind — server-side, from the persisted `seedQuestions` snapshot (never
     * re-derived from the client), preserving the ORDER the cards were asked
     * in (index-aligned with the transcript's `questionIndex`). The
     * answer/keywords are only USED by the prompt service for a "theory"-kind
     * question's coverage rubric; reasoning/scenario questions still get a
     * grounding entry (carrying their kind) even though their answer/keywords
     * go unused. A card that no longer exists (deleted after the session
     * started) is simply omitted — the prompt service's grouping already
     * tolerates a shorter `seedGroundings` array than the transcript's
     * question count.
     *
     * @param seedQuestions - The session's persisted seed questions (cardId + kind + title), in ask order.
     * @param turns - The full recorded transcript — used ONLY to find each question's own
     *   candidate-submitted `[Code lang=X]` artifact, so the GIVEN-code baseline handed to
     *   the grader matches whichever language the candidate actually solved in (not just
     *   whichever variant happens to be authored first).
     * @returns the seed groundings, in the SAME order as `seedQuestions`.
     */
    private async resolveSeedGroundings(
        seedQuestions: Array<MockInterviewSeedQuestion>,
        turns: Array<MockInterviewTurnRecord>,
        sessionLang?: string | null,
    ): Promise<Array<MockInterviewSeedGrounding>> {
        if (seedQuestions.length === 0) {
            return []
        }
        const cardIds = seedQuestions.map((seed) => seed.cardId)
        // PRIMARY source = the authored interview bank (`prompt`/`idealAnswer`/
        // `rubric`); fall back to flashcards for any id not in the bank (legacy
        // flashcard-seed sessions). Fetch both, resolve per-seed by whichever hits.
        const [bankRows,
            cards] = await Promise.all([
            this.entityManager.find(MockInterviewEntity,
                {
                    where: {
                        id: In(cardIds),
                    },
                    relations: {
                        langs: true,
                        checklists: true,
                    },
                }),
            this.entityManager.find(FlashcardCardEntity,
                {
                    where: {
                        id: In(cardIds),
                    },
                }),
        ])
        const bankById = new Map(
            bankRows.map((row) => [row.id,
                row]),
        )
        const cardById = new Map(
            cards.map((card) => [card.id,
                card]),
        )
        // the code lang the CANDIDATE actually submitted for question `index`, parsed off
        // the same "[Code lang=X]" marker `submitQnaAnswer` (FE) writes — undefined when the
        // candidate never touched the code tab for that question (shouldn't happen for a
        // debug/review/optimize question, but a question can't assume it did)
        const submittedLangByIndex = new Map<number, string>()
        for (const turn of turns) {
            if (turn.role !== "candidate" || turn.questionIndex === undefined) {
                continue
            }
            const match = /^\[Code lang=([^\]]+)\]/.exec(turn.content)
            if (match) {
                submittedLangByIndex.set(turn.questionIndex,
                    match[1])
            }
        }
        // re-order by the PERSISTED draw order (entityManager.find does not
        // guarantee IN(...) result order) and drop any seed that no longer resolves
        const groundings: Array<MockInterviewSeedGrounding | undefined> = seedQuestions
            .map((seed, index) => {
                const bank = bankById.get(seed.cardId)
                if (bank) {
                    // fold the behavioral "I vs we" ownership note in as an extra
                    // rubric point so the grader is forced to score it (research §4)
                    // authored checkpoints win over the legacy flat `rubric` — each carries
                    // its dimension / must-hit flag / score band, which the grader scores
                    // against directly. `rubric` remains the fallback for any question
                    // whose content has not been converted to `# checklist` yet.
                    const orderedCheckpoints = [...(bank.checklists ?? [])]
                        .sort((left, right) => left.sortIndex - right.sortIndex)
                    const checkpoints = orderedCheckpoints
                        .map((checkpoint) => {
                            const dimension = checkpoint.dimension
                                ? `[${checkpoint.dimension}] `
                                : ""
                            const mustHit = checkpoint.critical
                                ? " (MUST-HIT)"
                                : ""
                            const band = checkpoint.scoreBand > 0
                                ? ` (${checkpoint.scoreBand} pts)`
                                : ""
                            return `${dimension}${checkpoint.text}${mustHit}${band}`
                        })
                    const rubricPoints = checkpoints.length > 0
                        ? checkpoints
                        : [...(bank.rubric ?? [])]
                    if (bank.ownershipSignal) {
                        rubricPoints.push(`[Ownership] ${bank.ownershipSignal}`)
                    }
                    // Resolve the per-language body to grade this question against. With the
                    // multi-language draw (2026-07-17) each question is served in its OWN
                    // randomly-chosen track language, snapshotted on the seed at draw time —
                    // so `seed.givenCodes[0].lang` (the language THIS question was actually
                    // rendered in) is the authoritative match, NOT `session.lang` (now only a
                    // single representative across a session that may mix languages; grading
                    // against it would score a Go-drawn question against the TypeScript
                    // idealAnswer/givenCode). Fall back in order: the drawn language →
                    // the language the candidate actually submitted in (`[Code lang=X]`) →
                    // the legacy session language → the first authored body. A legacy variant
                    // (prompt/idealAnswer null) still falls back to the parent's shared prompt.
                    const bodies = [...(bank.langs ?? [])]
                        .sort((left, right) => left.sortIndex - right.sortIndex)
                    const drawnLang = seed.givenCodes?.[0]?.lang
                    const submittedLang = submittedLangByIndex.get(index)
                    const chosenBody = bodies.find((body) => body.lang === drawnLang)
                        ?? bodies.find((body) => body.lang === submittedLang)
                        ?? bodies.find((body) => body.lang === sessionLang)
                        ?? bodies[0]
                        ?? null
                    const grounding: MockInterviewSeedGrounding = {
                        cardId: bank.id,
                        kind: normalizeMockInterviewKind(seed.kind) as string,
                        // per-language body prompt/answer win; parent is the agnostic
                        // fallback (empty for a full-4-body code question)
                        question: chosenBody?.prompt ?? bank.prompt,
                        answer: chosenBody?.idealAnswer ?? bank.idealAnswer,
                        keywords: bank.keywords ?? [],
                        rubric: rubricPoints.length > 0 ? rubricPoints : undefined,
                        // structured form of the same checkpoints — lets the score be
                        // summed from the bands the grader reports as covered instead of
                        // taken on trust from a number it picked
                        checkpoints: orderedCheckpoints.length > 0
                            ? orderedCheckpoints.map((checkpoint) => ({
                                text: checkpoint.text,
                                dimension: checkpoint.dimension,
                                critical: checkpoint.critical,
                                scoreBand: checkpoint.scoreBand,
                            }))
                            : undefined,
                        // the GIVEN (buggy) code — lets the grader diff the candidate's
                        // fix against the baseline (debug/review/optimize questions)
                        givenCode: chosenBody?.givenCode ?? bank.givenCode ?? null,
                        givenLang: chosenBody?.lang ?? bank.givenLang ?? null,
                    }
                    return grounding
                }
                const card = cardById.get(seed.cardId)
                if (!card) {
                    return undefined
                }
                const grounding: MockInterviewSeedGrounding = {
                    cardId: card.id,
                    // widen the normalized enum to the interface's plain-string field
                    // (persisted/round-tripped as a jsonb value, not the enum type)
                    kind: normalizeMockInterviewKind(seed.kind) as string,
                    question: card.question,
                    answer: card.answer,
                    keywords: parseFlashcardAnswerKeywords(card.answer),
                }
                return grounding
            })
        return groundings.filter((grounding): grounding is MockInterviewSeedGrounding => Boolean(grounding))
    }

    /**
     * Persist a {@link MockInterviewAttemptEntity} row for one graded session so
     * the learner's mock-interview history can be computed later. Best-effort: a
     * failure here is swallowed so it can never sink the grade result the user
     * is waiting on.
     *
     * @param params - Identity of the session + its already-normalized grade result.
     */
    private async persistAttempt(
        params: {
            userId: string
            courseId: string
            promptId: string
            promptTitle: string
            level: string | null
            mode: MockInterviewMode
            sessionId: string
            result: MockInterviewGradeSessionResult
            countsToReadiness: boolean
            name: string | null
        },
    ): Promise<void> {
        const {
            userId,
            courseId,
            promptId,
            promptTitle,
            level,
            mode,
            sessionId,
            result,
            countsToReadiness,
            name,
        } = params
        try {
            // resolve (or lazily create) the trial enrollment (user × course) so the
            // attempt can be keyed by enrollment — the anchor for per-course history,
            // consistent with the enrollment-centric re-key already applied to
            // InterviewAttemptEntity. Mirrors InterviewGradingService.recordAttempt.
            const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
                userId,
                courseId,
            )
            await this.entityManager.save(
                MockInterviewAttemptEntity,
                {
                    enrollment,
                    sessionId,
                    promptId,
                    promptTitle,
                    level,
                    mode,
                    overallScore: result.overallScore,
                    verdict: result.verdict,
                    // jsonb columns are typed as Array<Record<string, unknown>> on the
                    // entity (schema-evolution friendly); copy named result rows onto
                    // index-signature records for the jsonb column assignment
                    phaseScores: result.phaseScores.map(toUnknownRecord),
                    attributeScores: result.attributeScores.map(toUnknownRecord),
                    strengths: result.strengths,
                    gaps: result.gaps,
                    followUpQuestion: result.followUpQuestion,
                    matchedContentIds: result.matchedContentIds,
                    questionReviews: result.questionReviews.map(toUnknownRecord),
                    countsToReadiness,
                    // copied verbatim from the session row so the history row
                    // keeps the name after the session's 24h resume TTL expires
                    name,
                },
            )

            // "resume mock interview session" (2026-07-08): a session that just
            // graded successfully is no longer resumable — flip it to "completed"
            // so myInProgressMockInterviewSession stops offering it back, and a
            // late/stale syncMockInterviewSessionTurns call for the same session
            // no-ops instead of clobbering the now-finished transcript.
            await this.entityManager.update(
                MockInterviewSessionEntity,
                {
                    id: sessionId,
                    enrollment: {
                        id: enrollment.id,
                    },
                },
                {
                    status: "completed",
                },
            )
        } catch {
            // history is non-critical — never fail the grade over a persistence write
        }
    }

    /**
     * Parse + normalize the model's strict-JSON response into a
     * {@link MockInterviewGradeSessionResult} (minus `matchedContentIds` —
     * comes from RAG retrieval, not the model's response — and
     * `questionReviews`, built separately by {@link buildQuestionReviews}
     * once the transcript/seed groundings are also in scope), clamping scores
     * and coercing the verdict + phase/attribute breakdowns. Also parses the
     * new `questionFeedback` array (mode="qna" only; harmlessly ignored by
     * mode="design", which never asks the model for it).
     *
     * @param raw - The raw model response text.
     * @returns The normalized session grade result (without `matchedContentIds`/`questionReviews`), plus the raw `questionFeedback` for {@link buildQuestionReviews} to consume.
     * @throws ParsingCriteriaResultsFromModelTextException when JSON parsing fails.
     */
    private parse(
        raw: string,
    ): Omit<MockInterviewGradeSessionResult, "matchedContentIds" | "questionReviews"> & {
        questionFeedback: Array<MockInterviewQuestionFeedbackItem>
        coveredCheckpoints: Array<MockInterviewCoveredCheckpointItem>
    } {
        let parsed: Record<string, unknown>
        try {
            // strip any fence / prose then parse the JSON object
            parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text: raw,
                originalError: error instanceof Error
                    ? error
                    : undefined,
            })
        }

        // overall score is normalized first so the verdict can fall back to it when
        // the model returns a missing / unrecognized verdict literal
        const overallScore = this.normalizeScore(parsed.overallScore)
        return {
            overallScore,
            verdict: this.normalizeVerdict(
                parsed.verdict,
                overallScore,
            ),
            phaseScores: this.normalizePhaseScores(parsed.phaseScores),
            attributeScores: this.normalizeAttributeScores(parsed.attributeScores),
            strengths: this.normalizeStringArray(parsed.strengths),
            gaps: this.normalizeStringArray(parsed.gaps),
            followUpQuestion: this.normalizeNullableString(parsed.followUpQuestion),
            questionFeedback: this.normalizeQuestionFeedback(parsed.questionFeedback),
            coveredCheckpoints: this.normalizeCoveredCheckpoints(parsed.coveredCheckpoints),
        }
    }

    /**
     * Coerce an unknown value to a clean array of
     * {@link MockInterviewQuestionFeedbackItem}. A malformed or missing array
     * degrades to empty rather than throwing — mode="design" never sends this
     * field at all, and a model that omits/garbles it for mode="qna" must
     * still let the rest of the grade through (the FE just shows no
     * per-question feedback line for the affected index).
     *
     * @param value - The raw `questionFeedback` value from the parsed JSON.
     * @returns A clean array of `{ index, feedback }` entries (possibly empty).
     */
    /**
     * Coerce the raw `coveredCheckpoints` value into clean `{ index, covered }` entries.
     * Missing or malformed degrades to empty, which simply leaves the model's own score in
     * place — the same tolerance `questionFeedback` gets.
     *
     * @param value - The raw `coveredCheckpoints` value from the parsed JSON.
     * @returns A clean array (possibly empty).
     */
    private normalizeCoveredCheckpoints(
        value: unknown,
    ): Array<MockInterviewCoveredCheckpointItem> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => {
                const indexRaw = typeof item.index === "number"
                    ? item.index
                    : Number(item.index)
                const index = Number.isFinite(indexRaw)
                    ? Math.max(0,
                        Math.trunc(indexRaw))
                    : -1
                const covered = Array.isArray(item.covered)
                    ? item.covered
                        .map((entry) => Number(entry))
                        .filter((entry) => Number.isFinite(entry) && entry >= 0)
                        .map((entry) => Math.trunc(entry))
                    : []
                return {
                    index,
                    covered,
                }
            })
            .filter((item) => item.index >= 0)
    }

    /**
     * Score ONE question as the sum of the score bands it actually covered.
     *
     * Missing a checkpoint marked `critical` caps the result: a candidate who skipped the
     * point the question exists to test has not passed it, however much peripheral credit
     * they accumulated. Duplicate or out-of-range checkpoint numbers from the model are
     * ignored rather than allowed to inflate the total past 100.
     *
     * @param checkpoints - The question's authored checkpoints, in authored order.
     * @param covered - Checkpoint numbers the model reported as established.
     * @returns Integer 0-100.
     */
    private scoreFromCheckpoints(
        checkpoints: NonNullable<MockInterviewSeedGrounding["checkpoints"]>,
        covered: Array<number>,
    ): number {
        const hit = new Set(
            covered.filter((index) => index >= 0 && index < checkpoints.length),
        )
        const score = checkpoints.reduce(
            (sum, checkpoint, index) => (hit.has(index) ? sum + checkpoint.scoreBand : sum),
            0,
        )
        const missedCritical = checkpoints.some(
            (checkpoint, index) => checkpoint.critical && !hit.has(index),
        )
        const capped = missedCritical
            ? Math.min(score,
                CRITICAL_MISS_SCORE_CAP)
            : score
        return Math.max(0,
            Math.min(100,
                Math.round(capped)))
    }

    private normalizeQuestionFeedback(
        value: unknown,
    ): Array<MockInterviewQuestionFeedbackItem> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => {
                const indexRaw = typeof item.index === "number"
                    ? item.index
                    : Number(item.index)
                const index = Number.isFinite(indexRaw)
                    ? Math.max(0,
                        Math.trunc(indexRaw))
                    : -1
                const feedback = typeof item.feedback === "string"
                    ? item.feedback.trim()
                    : ""
                return {
                    index,
                    feedback,
                }
            })
            .filter((item) => item.index >= 0)
    }

    /**
     * Build the per-question model-answer reviews for a `mode="qna"` session —
     * the anti-ChatGPT feature: pairs the candidate's own words against the
     * course's CANONICAL authored answer for the exact same question, which
     * no generic tool can do (see {@link MockInterviewQuestionReview}'s doc).
     * One review per question, in index order, spanning
     * `max(transcript question count, seed grounding count)` so a question
     * with turns but no resolved grounding (a deleted seed card) — or vice
     * versa — still gets a row (with `modelAnswer: null` / empty
     * question-answer text respectively) rather than being silently dropped.
     *
     * @param params - The full transcript, the session's seed groundings, the
     *   model's normalized per-question `phaseScores`, its raw
     *   `questionFeedback`, and the session-wide `matchedContentIds`.
     * @returns One {@link MockInterviewQuestionReview} per question, in order.
     */
    private buildQuestionReviews(
        params: {
            turns: Array<MockInterviewTurnRecord>
            seedGroundings: Array<MockInterviewSeedGrounding>
            phaseScores: Array<MockInterviewPhaseScore>
            questionFeedback: Array<MockInterviewQuestionFeedbackItem>
            matchedContentIds: Array<string>
        },
    ): Array<MockInterviewQuestionReview> {
        const {
            turns, seedGroundings, phaseScores, questionFeedback, matchedContentIds,
        } = params

        const turnsByQuestion = new Map<number, Array<MockInterviewTurnRecord>>()
        for (const turn of turns) {
            if (turn.questionIndex === undefined || turn.questionIndex === null) {
                continue
            }
            const existing = turnsByQuestion.get(turn.questionIndex)
            if (existing) {
                existing.push(turn)
            } else {
                turnsByQuestion.set(turn.questionIndex,
                    [turn])
            }
        }

        const feedbackByIndex = new Map(
            questionFeedback.map((item) => [item.index,
                item.feedback]),
        )

        // best-effort single per-question content match — the RAG retrieval is
        // one flat top-K pass over the WHOLE session (see the caller's
        // `contentRagRetrievalService.retrieveCourseExcerpt` call), so there is
        // no real per-question ranking to draw from; the closest honest
        // best-effort signal is "the single content id the retrieval ranked
        // most relevant overall" attached to every question that resolves a
        // grounding, and null otherwise — never invented when the whole
        // session had zero matches.
        const bestEffortContentId = matchedContentIds[0] ?? null

        const questionCount = Math.max(
            turnsByQuestion.size,
            seedGroundings.length,
        )

        return Array.from(
            {
                length: questionCount,
            },
            (unused, index) => {
                const questionTurns = turnsByQuestion.get(index) ?? []
                const grounding = seedGroundings[index]
                const phaseScore = phaseScores[index]

                const question = questionTurns
                    .filter((turn) => turn.role === "interviewer")
                    .map((turn) => turn.content)
                    .join(" ")
                    .trim()
                const candidateAnswer = questionTurns
                    .filter((turn) => turn.role === "candidate")
                    .map((turn) => turn.content)
                    .join(" ")
                    .trim()

                const review: MockInterviewQuestionReview = {
                    questionIndex: index,
                    kind: grounding?.kind ?? "theory",
                    // fall back to the seed's OWN question text when the interviewer
                    // turn wasn't recorded/tagged with this index — still gives the
                    // learner something to compare their answer against
                    question: question || grounding?.question || "",
                    candidateAnswer,
                    modelAnswer: grounding?.answer ?? null,
                    feedback: feedbackByIndex.get(index) ?? "",
                    score: phaseScore?.score ?? MIN_SCORE,
                    max: phaseScore?.max ?? DEFAULT_PHASE_MAX,
                    matchedContentId: grounding
                        ? bestEffortContentId
                        : null,
                }
                return review
            },
        )
    }

    /**
     * Coerce an unknown score to an integer clamped to [{@link MIN_SCORE}, {@link MAX_SCORE}].
     *
     * @param value - The raw score value from the parsed JSON.
     * @returns A clamped integer score (defaults to {@link MIN_SCORE} when not numeric).
     */
    private normalizeScore(
        value: unknown,
    ): number {
        const numeric = typeof value === "number"
            ? value
            : Number(value)
        if (!Number.isFinite(numeric)) {
            return MIN_SCORE
        }
        return Math.min(
            MAX_SCORE,
            Math.max(
                MIN_SCORE,
                Math.round(numeric),
            ),
        )
    }

    /**
     * Coerce an unknown verdict to a valid {@link MockInterviewVerdict}. When the
     * model returns a missing / unrecognized verdict literal, fall back to one
     * derived from the score so a strong session is not mislabeled "fail" over
     * a garbled string.
     *
     * @param value - The raw verdict value from the parsed JSON.
     * @param scoreFallback - The already-normalized overall score to derive a verdict from on a miss.
     * @returns A valid verdict enum member.
     */
    private normalizeVerdict(
        value: unknown,
        scoreFallback: number,
    ): MockInterviewVerdict {
        const candidate = typeof value === "string"
            ? value.trim().toLowerCase()
            : ""
        const match = Object.values(MockInterviewVerdict).find(
            (verdict) => verdict === candidate,
        )
        return match ?? this.verdictFromScore(scoreFallback)
    }

    /**
     * Derive a verdict from a normalized overall score, used only as a
     * fallback when the model's own verdict literal is missing or unrecognized.
     *
     * @param score - The normalized [0, 100] overall score.
     * @returns Pass at/above {@link PASS_SCORE_THRESHOLD}, Borderline at/above
     *   {@link BORDERLINE_SCORE_THRESHOLD}, otherwise Fail.
     */
    private verdictFromScore(
        score: number,
    ): MockInterviewVerdict {
        if (score >= PASS_SCORE_THRESHOLD) {
            return MockInterviewVerdict.Pass
        }
        if (score >= BORDERLINE_SCORE_THRESHOLD) {
            return MockInterviewVerdict.Borderline
        }
        return MockInterviewVerdict.Fail
    }

    /**
     * Coerce an unknown value to a clean array of {@link MockInterviewPhaseScore}.
     * A malformed or missing array degrades to empty rather than throwing — a
     * partial rubric breakdown must never sink the whole grade.
     *
     * @param value - The raw `phaseScores` value from the parsed JSON.
     * @returns A clamped, well-typed array of phase scores (possibly empty).
     */
    private normalizePhaseScores(
        value: unknown,
    ): Array<MockInterviewPhaseScore> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => {
                // phase is echoed back as-is (string) — the entity column is a plain
                // varchar array element, so an unrecognized literal is still stored
                // rather than silently dropped
                const phase = typeof item.phase === "string"
                    ? item.phase
                    : ""
                // max defaults to 100 when the model omits it, matching the prompt's
                // instruction that phase maxes sum to 100 across the breakdown
                const maxRaw = typeof item.max === "number"
                    ? item.max
                    : Number(item.max)
                const max = Number.isFinite(maxRaw) && maxRaw > 0
                    ? maxRaw
                    : DEFAULT_PHASE_MAX
                // clamp the phase score into [0, max] — a model that over/under-shoots
                // its own declared max is still bounded to something renderable
                const scoreRaw = typeof item.score === "number"
                    ? item.score
                    : Number(item.score)
                const score = Number.isFinite(scoreRaw)
                    ? Math.min(
                        max,
                        Math.max(
                            MIN_SCORE,
                            Math.round(scoreRaw),
                        ),
                    )
                    : MIN_SCORE
                return {
                    phase,
                    score,
                    max,
                } as MockInterviewPhaseScore
            })
            .filter((phaseScore) => phaseScore.phase.length > 0)
    }

    /**
     * Coerce an unknown value to a clean array of
     * {@link MockInterviewAttributeScore}. A malformed or missing array degrades
     * to empty rather than throwing.
     *
     * @param value - The raw `attributeScores` value from the parsed JSON.
     * @returns A clamped, well-typed array of attribute scores (possibly empty).
     */
    private normalizeAttributeScores(
        value: unknown,
    ): Array<MockInterviewAttributeScore> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => {
                const key = typeof item.key === "string"
                    ? item.key
                    : ""
                const scoreRaw = typeof item.score === "number"
                    ? item.score
                    : Number(item.score)
                const score = Number.isFinite(scoreRaw)
                    ? Math.min(
                        MAX_SCORE,
                        Math.max(
                            MIN_SCORE,
                            Math.round(scoreRaw),
                        ),
                    )
                    : MIN_SCORE
                return {
                    key,
                    score,
                }
            })
            .filter((attributeScore) => attributeScore.key.length > 0)
    }

    /**
     * Coerce an unknown value to an array of trimmed non-empty strings.
     *
     * @param value - The raw array value from the parsed JSON.
     * @returns A clean string array (empty when the value is not an array).
     */
    private normalizeStringArray(
        value: unknown,
    ): Array<string> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
    }

    /**
     * Coerce an unknown value to a trimmed non-empty string, or null.
     *
     * @param value - The raw value from the parsed JSON.
     * @returns The trimmed string, or null when absent/blank.
     */
    private normalizeNullableString(
        value: unknown,
    ): string | null {
        if (typeof value !== "string") {
            return null
        }
        const trimmed = value.trim()
        return trimmed.length > 0
            ? trimmed
            : null
    }
}
