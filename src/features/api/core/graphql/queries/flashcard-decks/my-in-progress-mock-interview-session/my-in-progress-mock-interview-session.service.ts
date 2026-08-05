import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MOCK_INTERVIEW_SESSION_DURATION_MS,
    MockInterviewSessionEntity,
} from "@modules/databases"
import {
    UserService,
} from "@modules/bussiness"
import type {
    FindMyInProgressMockInterviewSessionParams,
    MyInProgressMockInterviewSessionResult,
} from "./types"

/**
 * How far back a session's last sync may be for it to still be offered as
 * resumable -- "resume mock interview session" (2026-07-08). A session synced
 * longer ago than this is treated as effectively abandoned (the learner has
 * long since moved on) even though `startMockInterviewSession` has not yet
 * flipped its status (that only happens when the SAME enrollment starts a
 * NEW draw) -- this keeps a months-old forgotten "in_progress" row from
 * popping back up as a resume prompt indefinitely.
 */
const RESUME_WINDOW_HOURS = 24

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

        const resumeWindowStart = new Date(
            Date.now() - RESUME_WINDOW_HOURS * 60 * 60 * 1000,
        )
        // lazy-expiry, no cron (2026-07-11): a session drawn longer ago than
        // its own 1h ask-loop duration has expired even if it was synced
        // more recently than the resume window above -- both gates apply,
        // whichever is stricter wins (MoreThanOrEqual on createdAt = "not yet
        // expired"). Mirrors `MyInProgressFlashcardQuizSessionService`'s same
        // addition.
        const notExpiredSince = new Date(
            Date.now() - MOCK_INTERVIEW_SESSION_DURATION_MS,
        )

        const session = await this.entityManager.findOne(
            MockInterviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    status: "in_progress",
                    updatedAt: MoreThanOrEqual(resumeWindowStart),
                    createdAt: MoreThanOrEqual(notExpiredSince),
                },
                order: {
                    updatedAt: "DESC",
                },
            },
        )

        if (!session) {
            return null
        }

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
        }
    }
}
