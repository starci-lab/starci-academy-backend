import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiCeilSurface,
    AiModelTask,
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewAttemptEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    GradingLaneValidationService,
    extractJsonBlock,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    UserService,
} from "@modules/bussiness/user"
import {
    MockInterviewGradePromptService,
} from "./grade-mock-interview-session-prompt.service"
import {
    MockInterviewVerdict,
    type GradeMockInterviewSessionParams,
    type MockInterviewAttributeScore,
    type MockInterviewGradeSessionResult,
    type MockInterviewPhaseScore,
} from "./types"

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
@Injectable()
export class MockInterviewGradingService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mockInterviewGradePromptService: MockInterviewGradePromptService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly contentRagRetrievalService: ContentRagRetrievalService,
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
            promptId,
            promptTitle,
            level,
            turns,
            sessionId,
            locale,
            selectedModel,
            selectedModelProvider,
        } = params

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

        // build a short retrieval query from the CANDIDATE's own words only — the
        // interviewer's prompts would just echo the rubric back at itself and dilute
        // the query with phrasing that isn't what the candidate actually said
        const ragQuery = turns
            .filter((turn) => turn.role === "candidate")
            .map((turn) => turn.content)
            .join(" ")
            .slice(0,
                RAG_QUERY_MAX_CHARS)

        // ground the grading in what the course actually taught — degrades to an
        // empty excerpt (never throws) when the index is missing or retrieval fails,
        // so a RAG outage can never block grading
        const { excerpt: courseExcerpt } = await this.contentRagRetrievalService.retrieveCourseExcerpt({
            courseId,
            query: ragQuery,
            topK: 10,
        })

        // build the 5-phase rubric grading messages from the prompt title + level +
        // full transcript + retrieved course excerpt
        const { messages } = this.mockInterviewGradePromptService.build({
            promptTitle,
            level,
            turns,
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

        const result = this.parse(text)
        // persist the graded session for cross-session interview history (best-effort —
        // a history write must never fail the grade the user is waiting on)
        await this.persistAttempt({
            userId,
            courseId,
            promptId,
            promptTitle,
            level,
            sessionId,
            result,
        })
        return result
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
            sessionId: string
            result: MockInterviewGradeSessionResult
        },
    ): Promise<void> {
        const {
            userId,
            courseId,
            promptId,
            promptTitle,
            level,
            sessionId,
            result,
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
                    overallScore: result.overallScore,
                    verdict: result.verdict,
                    // jsonb columns are typed as Array<Record<string, unknown>> on the
                    // entity (schema-evolution friendly); the normalized result's named
                    // interfaces are structurally compatible but lack an index signature,
                    // so widen explicitly for the jsonb column assignment
                    phaseScores: result.phaseScores as unknown as Array<Record<string, unknown>>,
                    attributeScores: result.attributeScores as unknown as Array<Record<string, unknown>>,
                    strengths: result.strengths,
                    gaps: result.gaps,
                    followUpQuestion: result.followUpQuestion,
                },
            )
        } catch {
            // history is non-critical — never fail the grade over a persistence write
        }
    }

    /**
     * Parse + normalize the model's strict-JSON response into a
     * {@link MockInterviewGradeSessionResult}, clamping scores and coercing the
     * verdict + phase/attribute breakdowns.
     *
     * @param raw - The raw model response text.
     * @returns The normalized session grade result.
     * @throws ParsingCriteriaResultsFromModelTextException when JSON parsing fails.
     */
    private parse(
        raw: string,
    ): MockInterviewGradeSessionResult {
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
        }
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
