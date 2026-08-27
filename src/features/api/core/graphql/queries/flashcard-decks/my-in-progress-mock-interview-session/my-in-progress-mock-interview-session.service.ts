import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    MockInterviewGradingJobEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-grading-job.entity"
import type {
    FindMyInProgressMockInterviewSessionParams,
    MyInProgressMockInterviewSessionResult,
} from "./types/my-in-progress-mock-interview-session"

/**
 * How far back a session's last sync may be for it to still be offered as
 * resumable -- "resume mock interview session" (2026-07-08). A session synced
 * longer ago than this is treated as effectively abandoned (the learner has
 * long since moved on) even though `startMockInterviewSession` has not yet
 * flipped its status (that only happens when the SAME enrollment starts a
 * NEW draw) -- this keeps a months-old forgotten "in_progress" row from
 * popping back up as a resume prompt indefinitely.
 */
@Injectable()
/**
 * Reads back the learner's most recent RESUMABLE mock-interview session for
 * one course, so the FE can offer "resume mock interview?" instead of
 * forcing a fresh draw. Mirrors `MyMockInterviewAttemptsService`'s structure
 * (plain query service, no CQRS command bus -- a straight read has no command
 * to dispatch).
 */
export class MyInProgressMockInterviewSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Find the most recent `status = "in_progress"` session, synced within
     * {@link RESUME_WINDOW_HOURS}, for the caller's enrollment in one course.
     *
     * @param params - {@link FindMyInProgressMockInterviewSessionParams}
     * @returns the resumable session, or null when there is none.
     */
    async find(
        {
            userId,
            courseId,
        }: FindMyInProgressMockInterviewSessionParams,
    ): Promise<MyInProgressMockInterviewSessionResult | null> {
        // resolve (or lazily create) the SAME trial enrollment
        // startMockInterviewSession draws against, so the lookup is scoped to
        // the caller's own enrollment.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const session = await this.entityManager.findOne(
            MockInterviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    status: In(["in_progress",
                        "grading",
                        "grading_failed"]),
                },
                order: {
                    updatedAt: "DESC",
                },
            },
        )

        if (!session) {
            return null
        }

        if (session.status === "in_progress" && session.expiresAt.getTime() <= Date.now()) {
            await this.entityManager.createQueryBuilder()
                .update(MockInterviewSessionEntity)
                .set({
                    status: "expired", revision: () => "\"revision\" + 1"
                })
                .where("id = :id AND revision = :revision",
                    {
                        id: session.id, revision: session.revision
                    })
                .execute()
            return null
        }

        const gradingJob = session.status === "in_progress"
            ? null
            : await this.entityManager.findOneBy(MockInterviewGradingJobEntity,
                {
                    sessionId: session.id
                })

        return {
            sessionId: session.id,
            promptId: session.promptId,
            promptTitle: session.promptTitle,
            level: session.level,
            difficulty: session.difficulty,
            source: session.source,
            mode: session.mode,
            seedQuestions: session.seedQuestions ?? [],
            turns: session.turns,
            questionIndex: session.questionIndex,
            phaseIndex: session.phaseIndex,
            updatedAt: session.updatedAt,
            createdAt: session.createdAt,
            name: session.name,
            status: session.status,
            revision: session.revision,
            rubricVersion: session.rubricVersion,
            gradingJobId: gradingJob?.id ?? null,
            gradingJobStatus: gradingJob?.status ?? null,
            gradingAttemptCount: gradingJob?.attemptCount ?? 0,
            gradingMaxAttempts: gradingJob?.maxAttempts ?? 0,
            gradingLastError: gradingJob?.lastError ?? null,
        }
    }
}
