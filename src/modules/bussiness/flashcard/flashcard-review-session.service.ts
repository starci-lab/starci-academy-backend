import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
} from "typeorm"
import {
    FlashcardDeckEntity,
    FlashcardReviewSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    FlashcardDeckNotFoundException,
} from "@modules/exceptions"
import {
    UserService,
} from "../user"
import type {
    CompleteFlashcardReviewSessionParams,
    CompleteFlashcardReviewSessionResult,
    FindFlashcardReviewSessionByIdParams,
    FindMyInProgressFlashcardReviewSessionParams,
    FlashcardReviewSessionByIdResultData,
    MyInProgressFlashcardReviewSessionResultData,
    StartFlashcardReviewSessionParams,
    StartFlashcardReviewSessionResult,
    SyncFlashcardReviewSessionProgressParams,
    SyncFlashcardReviewSessionProgressResult,
} from "./types/flashcard-review-session"

/**
 * How far back a session's last sync may be for it to still be offered as
 * resumable — same reasoning as `MyInProgressFlashcardQuizSessionService`'s
 * own `RESUME_WINDOW_HOURS`: a session synced longer ago than this is treated
 * as effectively abandoned even though `startFlashcardReviewSession` has not
 * yet flipped its status (that only happens when the SAME enrollment+deck
 * starts a NEW draw).
 */
const RESUME_WINDOW_HOURS = 24

/**
 * Business logic for the resumable flashcard reviewer ("Học thẻ") session —
 * mirrors {@link import("./flashcard-quiz-session.service").FlashcardQuizSessionService}'s
 * resumable-draw shape, but scoped to ONE deck (not a whole course) and with
 * NO coverage/weakTags/XP-grant complexity: the actual SM-2 grading still
 * happens per-card through the existing `reviewFlashcard` mutation
 * ({@link import("./flashcard-review.service").FlashcardReviewService.review}); this
 * service is purely a resumable progress/bookkeeping wrapper around a
 * sequence of those calls, so history/stats can be built for review mode the
 * same way they already exist for quiz mode.
 *
 * XP DECISION: `reviewFlashcard` grants no XP today and writes no
 * `xp_histories` row. To avoid inventing a new, unreviewed XP-granting
 * mechanism for this MVP pass, `xpEarned` on `flashcard_review_sessions` is
 * treated as a CLIENT-REPORTED BOOKKEEPING SNAPSHOT ONLY — `sync`/`complete`
 * below persist whatever value the caller sends, with NO `xp_histories`
 * insert, NO `XpSource` addition, and NO daily-cap logic. This keeps parity
 * with `reviewFlashcard`'s own current behavior (no XP) instead of silently
 * introducing a parallel economy.
 */
@Injectable()
export class FlashcardReviewSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Persist ONE resumable flashcard review session draw over a single deck,
     * retiring any PRIOR "in_progress" draw for the same enrollment+deck first
     * so a learner never has two resumable review sessions on the same deck
     * at once — mirrors `FlashcardQuizSessionService`'s own "abandon prior
     * in_progress row" step (there scoped by enrollment alone; here further
     * scoped by deck, since review sessions are per-deck).
     *
     * @param params - {@link StartFlashcardReviewSessionParams}
     * @returns the newly-persisted session's id.
     * @throws FlashcardDeckNotFoundException when the deck does not exist.
     */
    async start(
        {
            userId,
            deckId,
            cardIds,
        }: StartFlashcardReviewSessionParams,
    ): Promise<StartFlashcardReviewSessionResult> {
        const deck = await this.entityManager.findOne(
            FlashcardDeckEntity,
            {
                where: {
                    id: deckId,
                },
                select: {
                    id: true,
                    course: {
                        id: true,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )
        if (!deck) {
            throw new FlashcardDeckNotFoundException({
                flashcardDeckId: deckId,
            })
        }

        // review sessions are anchored to the SAME (user, course) trial
        // enrollment startFlashcardQuizSession/reviewFlashcard already resolve
        // — the course is derived from the deck itself since the request only
        // carries deckId, not courseId.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            deck.course.id,
        )

        // retire the enrollment+deck's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates.
        await this.entityManager.update(
            FlashcardReviewSessionEntity,
            {
                enrollment: {
                    id: enrollment.id,
                },
                deck: {
                    id: deckId,
                },
                status: "in_progress",
            },
            {
                status: "abandoned",
            },
        )

        const session = await this.entityManager.save(
            FlashcardReviewSessionEntity,
            {
                enrollment,
                deck: {
                    id: deckId,
                },
                cardIds,
                currentIndex: 0,
                reviewedCount: 0,
                xpEarned: 0,
                status: "in_progress",
            },
        )

        return {
            sessionId: session.id,
        }
    }

    /**
     * Sync an in-flight flashcard review session's position + progress —
     * ownership-scoped, silently no-ops (never throws) for a session that is
     * not found/owned or no longer "in_progress", same reasoning as
     * `SyncFlashcardQuizSessionProgressHandler` (a background periodic sync
     * must never surface an error toast mid-review).
     *
     * @param params - {@link SyncFlashcardReviewSessionProgressParams}
     * @returns whether the sync was applied.
     */
    async sync(
        {
            userId,
            sessionId,
            currentIndex,
            reviewedCount,
            xpEarned,
        }: SyncFlashcardReviewSessionProgressParams,
    ): Promise<SyncFlashcardReviewSessionProgressResult> {
        const session = await this.entityManager.findOne(
            FlashcardReviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                    },
                },
                select: {
                    id: true,
                    status: true,
                },
            },
        )

        if (!session || session.status !== "in_progress") {
            return {
                success: false,
            }
        }

        await this.entityManager.update(
            FlashcardReviewSessionEntity,
            {
                id: session.id,
            },
            {
                currentIndex,
                reviewedCount,
                xpEarned,
            },
        )

        return {
            success: true,
        }
    }

    /**
     * Record a finished flashcard review session — flips the row to
     * "completed" and snapshots the final reviewed-count/xpEarned the caller
     * reports. Ownership-scoped via the `status: "in_progress"` WHERE clause
     * (mirrors `FlashcardQuizSessionService.complete`'s own update guard): a
     * replay or an id that does not match any owned in-progress row simply
     * matches nothing, so this is safe to call more than once.
     *
     * NO XP is granted here — see the class doc's XP DECISION. `xpEarned` is
     * echoed straight through as a bookkeeping snapshot, never written to
     * `xp_histories`.
     *
     * @param params - {@link CompleteFlashcardReviewSessionParams}
     * @returns the reviewed-count/xpEarned snapshotted onto the row.
     */
    async complete(
        {
            userId,
            sessionId,
            reviewedCount,
            xpEarned,
        }: CompleteFlashcardReviewSessionParams,
    ): Promise<CompleteFlashcardReviewSessionResult> {
        await this.entityManager.update(
            FlashcardReviewSessionEntity,
            {
                id: sessionId,
                enrollment: {
                    user: {
                        id: userId,
                    },
                },
                status: "in_progress",
            },
            {
                status: "completed",
                reviewedCount,
                xpEarned,
            },
        )

        return {
            reviewedCount,
            xpEarned,
        }
    }

    /**
     * Find the most recent `status = "in_progress"` review session, synced
     * within {@link RESUME_WINDOW_HOURS}, for the caller's enrollment scoped
     * to ONE deck — mirrors `MyInProgressFlashcardQuizSessionService.find`,
     * further scoped by deck (review sessions are per-deck, quiz sessions are
     * per-course).
     *
     * @param params - {@link FindMyInProgressFlashcardReviewSessionParams}
     * @returns the resumable session, or null when there is none.
     * @throws FlashcardDeckNotFoundException when the deck does not exist.
     */
    async findInProgress(
        {
            userId,
            deckId,
        }: FindMyInProgressFlashcardReviewSessionParams,
    ): Promise<MyInProgressFlashcardReviewSessionResultData | null> {
        const deck = await this.entityManager.findOne(
            FlashcardDeckEntity,
            {
                where: {
                    id: deckId,
                },
                select: {
                    id: true,
                    course: {
                        id: true,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )
        if (!deck) {
            throw new FlashcardDeckNotFoundException({
                flashcardDeckId: deckId,
            })
        }

        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            deck.course.id,
        )

        const resumeWindowStart = new Date(
            Date.now() - RESUME_WINDOW_HOURS * 60 * 60 * 1000,
        )

        const session = await this.entityManager.findOne(
            FlashcardReviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    deck: {
                        id: deckId,
                    },
                    status: "in_progress",
                    updatedAt: MoreThanOrEqual(resumeWindowStart),
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
            reviewedCount: session.reviewedCount,
            xpEarned: session.xpEarned,
            updatedAt: session.updatedAt,
        }
    }

    /**
     * Find a review session directly by its id (ownership-checked against the
     * caller) — no `deckId` needed upfront, unlike {@link findInProgress}. The
     * FE's unified `/review/sessions/[sessionId]` route uses this to resolve
     * full context (deck + progress) from just the id in the URL (thầy
     * 2026-07-11: "session đã persist hết rồi", no `deckId` query hint
     * needed). NOT window/status-scoped like `findInProgress` — a direct link
     * to a completed/abandoned session still resolves (so a stale link shows
     * the real state instead of a false 404); the caller decides what to do
     * with a non-"in_progress" row.
     *
     * @param params - {@link FindFlashcardReviewSessionByIdParams}
     * @returns the session with its deck identity attached, or null when not
     * found/not owned by the caller.
     */
    async findById(
        {
            userId,
            sessionId,
        }: FindFlashcardReviewSessionByIdParams,
    ): Promise<FlashcardReviewSessionByIdResultData | null> {
        const session = await this.entityManager.findOne(
            FlashcardReviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                    },
                },
                relations: {
                    deck: true,
                },
            },
        )

        if (!session) {
            return null
        }

        return {
            sessionId: session.id,
            deckId: session.deckId,
            deckTitle: session.deck.title,
            cardIds: session.cardIds,
            currentIndex: session.currentIndex,
            reviewedCount: session.reviewedCount,
            xpEarned: session.xpEarned,
            updatedAt: session.updatedAt,
        }
    }
}
