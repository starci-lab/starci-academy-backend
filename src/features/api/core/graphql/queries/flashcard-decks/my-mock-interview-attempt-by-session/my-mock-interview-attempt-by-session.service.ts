import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewAttemptEntity,
} from "@modules/databases"
import type {
    MockInterviewAttemptAttributeScore,
    MockInterviewAttemptPhaseScore,
    MockInterviewAttemptQuestionReview,
} from "../my-mock-interview-attempts/types"
import type {
    FindMyMockInterviewAttemptBySessionParams,
    MyMockInterviewAttemptBySessionResult,
} from "./types"

/**
 * Sanitizes `phaseScores`/`attributeScores`/`questionReviews`-shaped jsonb —
 * COPIED verbatim (per-viewer single-row read, not an aggregate — exempt from
 * `.claude/be/rules/cqrs-no-inline-aggregate.md`) from
 * `MyMockInterviewAttemptsService` so this single-row reader stays consistent
 * with the list reader's legacy/malformed-row tolerance.
 */
const coerceScore = (value: unknown, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

/** A non-empty string, or `null` when `value` isn't one (signals "drop this entry"). */
const coerceIdentifyingString = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? value : null

/** A string field that's NOT the entry's identity — never drops the entry, just defaults to empty. */
const coerceText = (value: unknown): string =>
    typeof value === "string" ? value : ""

@Injectable()
/**
 * Reads back ONE graded mock-interview attempt by its `sessionId` — a
 * per-viewer single-row edge check (exempt from the CQRS-projection rule),
 * used to recover the just-finished result when a resume attempt lands on a
 * session that's no longer `in_progress` (already graded, or expired past the
 * resume window) — see `MockInterviewSession`'s rehydrate effect.
 */
export class MyMockInterviewAttemptBySessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Find the viewer's graded attempt for one session, scoped to the
     * viewer + course so a foreign/mismatched sessionId can never leak
     * another learner's result.
     *
     * @param params - {@link FindMyMockInterviewAttemptBySessionParams}
     * @returns the graded attempt, or `null` when no matching row exists.
     *
     * @example
     * await service.find({ userId, courseId, sessionId })
     */
    async find(
        {
            userId,
            courseId,
            sessionId,
        }: FindMyMockInterviewAttemptBySessionParams,
    ): Promise<MyMockInterviewAttemptBySessionResult | null> {
        const attempt = await this.entityManager.findOne(
            MockInterviewAttemptEntity,
            {
                where: {
                    sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                },
            },
        )

        if (!attempt) {
            return null
        }

        return {
            id: attempt.id,
            sessionId: attempt.sessionId,
            promptId: attempt.promptId,
            promptTitle: attempt.promptTitle,
            level: attempt.level,
            mode: attempt.mode,
            overallScore: attempt.overallScore,
            verdict: attempt.verdict,
            phaseScores: ((attempt.phaseScores ?? []) as unknown as Array<MockInterviewAttemptPhaseScore>)
                .flatMap((entry) => {
                    const phase = coerceIdentifyingString(entry.phase)
                    return phase ? [{
                        phase,
                        score: coerceScore(entry.score,
                            0),
                        max: coerceScore(entry.max,
                            100),
                    }] : []
                }),
            attributeScores: ((attempt.attributeScores ?? []) as unknown as Array<MockInterviewAttemptAttributeScore>)
                .flatMap((entry) => {
                    const key = coerceIdentifyingString(entry.key)
                    return key ? [{
                        key,
                        score: coerceScore(entry.score,
                            0),
                    }] : []
                }),
            strengths: attempt.strengths,
            gaps: attempt.gaps,
            followUpQuestion: attempt.followUpQuestion,
            matchedContentIds: attempt.matchedContentIds,
            questionReviews: ((attempt.questionReviews ?? []) as unknown as Array<MockInterviewAttemptQuestionReview>)
                .flatMap((entry) => {
                    const kind = coerceIdentifyingString(entry.kind)
                    return kind ? [{
                        questionIndex: coerceScore(entry.questionIndex,
                            0),
                        kind,
                        question: coerceText(entry.question),
                        candidateAnswer: coerceText(entry.candidateAnswer),
                        modelAnswer: entry.modelAnswer ?? null,
                        feedback: coerceText(entry.feedback),
                        score: coerceScore(entry.score,
                            0),
                        max: coerceScore(entry.max,
                            100),
                        matchedContentId: entry.matchedContentId ?? null,
                    }] : []
                }),
            createdAt: attempt.createdAt,
            name: attempt.name,
        }
    }
}
