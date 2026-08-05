import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserMockInterviewCourseStatsProjectionService,
} from "@modules/bussiness"
import type {
    ComputeMyMockInterviewStatsParams,
    MyMockInterviewStatsResultData,
} from "./types"

/** Empty/zeroed result shape when the viewer has no enrollment (nothing to aggregate) at all. */
const EMPTY_RESULT: MyMockInterviewStatsResultData = {
    insufficientData: true,
    modeSplit: {
        qnaCount: 0,
        designCount: 0,
    },
    trend: [],
    byPhase: [],
}

@Injectable()
/**
 * Reads the viewer's mock-interview stats for one course — the readiness
 * hero (vs the pass bar, projected from the trend delta) + the per-phase
 * breakdown that `MockInterviewStats` renders (`stats-canonical-fold` — 1
 * hero + 1 zone). The heavy attempts scan + fold runs ONLY in
 * `UserMockInterviewCourseStatsProjectionService.recompute` (CQRS projection,
 * CDC on `mock_interview_attempts`) — this service is a pure point-read (TTL
 * lazy-refresh), never re-scans/folds inline (per
 * `.claude/be/rules/cqrs-no-inline-aggregate.md`).
 */
export class MyMockInterviewStatsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userMockInterviewCourseStatsProjectionService: UserMockInterviewCourseStatsProjectionService,
    ) {}

    /**
     * Read the viewer's mock-interview stats for one course.
     *
     * @param params - {@link ComputeMyMockInterviewStatsParams}
     * @returns the trend line, mode split, and the phase breakdown.
     */
    async compute(
        {
            userId,
            courseId,
        }: ComputeMyMockInterviewStatsParams,
    ): Promise<MyMockInterviewStatsResultData> {
        // a read never needs to resolve/create the trial enrollment first
        // (unlike flashcard quiz/review, mock-interview attempts don't
        // auto-provision one) — just look up the existing enrollment; if none
        // exists there is nothing to aggregate.
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    course: {
                        id: courseId,
                    },
                },
            },
        )

        if (!enrollment) {
            return EMPTY_RESULT
        }

        return this.userMockInterviewCourseStatsProjectionService.getStats({
            enrollmentId: enrollment.id,
        })
    }
}
