import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    Equal,
    IsNull,
    Or,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewAttemptEntity,
} from "@modules/databases"
import {
    toUnknownRecordArray,
} from "@modules/common"
import type {
    ListMyMockInterviewAttemptsParams,
    ListMyMockInterviewAttemptsResult,
} from "./types"

/**
 * Sanitizes `phaseScores`/`attributeScores`/`questionReviews`-shaped jsonb
 * before it reaches the GraphQL layer, which declares several of their
 * fields non-nullable. A legacy/malformed row (e.g. graded before a field
 * was fully validated at write time) can have ANY of them null/missing --
 * one bad entry must not null out the ENTIRE list for that page.
 *
 * - A numeric field coerces to `fallback` when not a finite number.
 * - An IDENTIFYING string field (`phase`/`key`/`kind`) that's missing makes
 *   the whole entry meaningless to render (nothing to label it with) -- the
 *   entry is DROPPED rather than coerced to an empty/fabricated label.
 */
const coerceScore = (value: unknown, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

/** A non-empty string, or `null` when `value` isn't one (signals "drop this entry"). */
const coerceIdentifyingString = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? value : null

/** A string field that's NOT the entry's identity (e.g. free-text body) -- never drops the entry, just defaults to empty. */
const coerceText = (value: unknown): string =>
    typeof value === "string" ? value : ""

@Injectable()
/**
 * Reads back the viewer's persisted mock-interview attempts (each row = one
 * whole graded session, written by `gradeMockInterviewSession`) so the
 * scorecard's "history" can list and re-open past sessions.
 */
export class MyMockInterviewAttemptsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Lists a page of the viewer's mock-interview attempts for one course,
     * newest first.
     *
     * @param params - {@link ListMyMockInterviewAttemptsParams}
     * @returns the page of attempts + the total count for pagination.
     *
     * @example
     * await service.list({ userId, courseId, limit: 10, offset: 0 })
     */
    async list(
        {
            userId,
            courseId,
            limit,
            offset,
            mode,
        }: ListMyMockInterviewAttemptsParams,
    ): Promise<ListMyMockInterviewAttemptsResult> {
        // attempts are keyed by enrollment (user x course) -- scan through that
        // relation rather than requiring a separate enrollment lookup first.
        // "design" also matches a null-mode legacy attempt (predates the "mode
        // split" -- the only mode that could have existed then) via Or(IsNull()),
        // since a plain `mode: "design"` equality would silently exclude it.
        const [
            attempts,
            totalCount,
        ] = await this.entityManager.findAndCount(
            MockInterviewAttemptEntity,
            {
                where: {
                    enrollment: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                    ...(mode === "design"
                        ? {
                            mode: Or(Equal("design"),
                                IsNull()) 
                        }
                        : mode
                            ? {
                                mode: Equal(mode) 
                            }
                            : {
                            }),
                },
                // newest session first -- matches the scorecard's "recent attempts" framing
                order: {
                    createdAt: "DESC",
                },
                take: limit,
                skip: offset,
            },
        )

        return {
            totalCount,
            items: attempts.map((attempt) => ({
                id: attempt.id,
                sessionId: attempt.sessionId,
                promptId: attempt.promptId,
                promptTitle: attempt.promptTitle,
                level: attempt.level,
                mode: attempt.mode,
                overallScore: attempt.overallScore,
                verdict: attempt.verdict,
                // jsonb columns are stored as loosely-typed records (schema-evolution
                // friendly) -- the named interfaces are structurally compatible with
                // what `gradeMockInterviewSession` wrote, but a legacy/malformed row
                // can have almost any field null/missing, and the GraphQL layer
                // declares most of these non-nullable -- sanitize (see
                // `coerceScore`/`coerceIdentifyingString`/`coerceText`) so one bad
                // entry drops out instead of nulling the WHOLE page.
                phaseScores: toUnknownRecordArray(attempt.phaseScores)
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
                attributeScores: toUnknownRecordArray(attempt.attributeScores)
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
                questionReviews: toUnknownRecordArray(attempt.questionReviews)
                    .flatMap((entry) => {
                        const kind = coerceIdentifyingString(entry.kind)
                        return kind ? [{
                            questionIndex: coerceScore(entry.questionIndex,
                                0),
                            kind,
                            question: coerceText(entry.question),
                            candidateAnswer: coerceText(entry.candidateAnswer),
                            modelAnswer: typeof entry.modelAnswer === "string" ? entry.modelAnswer : null,
                            feedback: coerceText(entry.feedback),
                            score: coerceScore(entry.score,
                                0),
                            max: coerceScore(entry.max,
                                100),
                            matchedContentId: typeof entry.matchedContentId === "string" ? entry.matchedContentId : null,
                        }] : []
                    }),
                createdAt: attempt.createdAt,
                name: attempt.name,
            })),
        }
    }
}
