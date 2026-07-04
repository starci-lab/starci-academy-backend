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
    ListMyMockInterviewAttemptsParams,
    ListMyMockInterviewAttemptsResult,
    MockInterviewAttemptAttributeScore,
    MockInterviewAttemptPhaseScore,
} from "./types"

/**
 * Reads back the viewer's persisted mock-interview attempts (each row = one
 * whole graded session, written by `gradeMockInterviewSession`) so the
 * scorecard's "history" can list and re-open past sessions.
 */
@Injectable()
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
        }: ListMyMockInterviewAttemptsParams,
    ): Promise<ListMyMockInterviewAttemptsResult> {
        // attempts are keyed by enrollment (user × course) — scan through that
        // relation rather than requiring a separate enrollment lookup first
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
                },
                // newest session first — matches the scorecard's "recent attempts" framing
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
                overallScore: attempt.overallScore,
                verdict: attempt.verdict,
                // jsonb columns are stored as loosely-typed records (schema-evolution
                // friendly) — the named interfaces are structurally compatible with
                // what `gradeMockInterviewSession` wrote, so widen explicitly here
                phaseScores: attempt.phaseScores as unknown as Array<MockInterviewAttemptPhaseScore>,
                attributeScores: attempt.attributeScores as unknown as Array<MockInterviewAttemptAttributeScore>,
                strengths: attempt.strengths,
                gaps: attempt.gaps,
                followUpQuestion: attempt.followUpQuestion,
                createdAt: attempt.createdAt,
            })),
        }
    }
}
