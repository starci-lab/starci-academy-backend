import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
} from "typeorm"
import {
    FLASHCARD_QUIZ_SESSION_DURATION_MS,
    FlashcardQuizSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserService,
} from "@modules/bussiness"
import type {
    FindMyInProgressFlashcardQuizSessionParams,
    MyInProgressFlashcardQuizSessionResultData,
} from "./types"

/**
 * How far back a session's last sync may be for it to still be offered as
 * resumable — mirrors `MyInProgressMockInterviewSessionService`'s own
 * `RESUME_WINDOW_HOURS` reasoning: a session synced longer ago than this is
 * treated as effectively abandoned (the learner has long since moved on)
 * even though `startFlashcardQuizSession` has not yet flipped its status
 * (that only happens when the SAME enrollment starts a NEW draw) — this
 * keeps a months-old forgotten "in_progress" row from popping back up as a
 * resume prompt indefinitely.
 */
const RESUME_WINDOW_HOURS = 24

/**
 * Reads back the learner's most recent RESUMABLE flashcard quick-quiz
 * session for one course, so the FE can offer "Tiếp tục phiên hỏi nhanh?"
 * instead of forcing a fresh draw. Mirrors
 * `MyInProgressMockInterviewSessionService`'s structure (plain query
 * service, no CQRS command bus — a straight read has no command to
 * dispatch).
 */
@Injectable()
export class MyInProgressFlashcardQuizSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Find the most recent `status = "in_progress"` session, synced within
     * {@link RESUME_WINDOW_HOURS}, for the caller's enrollment in one course.
     *
     * @param params - {@link FindMyInProgressFlashcardQuizSessionParams}
     * @returns the resumable session, or null when there is none.
     */
    async find(
        {
            userId,
            courseId,
        }: FindMyInProgressFlashcardQuizSessionParams,
    ): Promise<MyInProgressFlashcardQuizSessionResultData | null> {
        // resolve (or lazily create) the SAME trial enrollment
        // startFlashcardQuizSession draws against, so the lookup is scoped
        // to the caller's own enrollment.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const resumeWindowStart = new Date(
            Date.now() - RESUME_WINDOW_HOURS * 60 * 60 * 1000,
        )
        // lazy-expiry, no cron (2026-07-11): a session drawn longer ago than
        // its own duration has "hết giờ" even if it was synced more recently
        // than the resume window above — both gates apply, whichever is
        // stricter wins (MoreThanOrEqual on createdAt = "not yet expired").
        const notExpiredSince = new Date(
            Date.now() - FLASHCARD_QUIZ_SESSION_DURATION_MS,
        )

        const session = await this.entityManager.findOne(
            FlashcardQuizSessionEntity,
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
            cardIds: session.cardIds,
            currentIndex: session.currentIndex,
            results: session.results ?? [],
            updatedAt: session.updatedAt,
            createdAt: session.createdAt,
        }
    }
}
