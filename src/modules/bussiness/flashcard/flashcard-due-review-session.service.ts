import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
    Not,
} from "typeorm"
import {
    FlashcardDueReviewSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserService,
} from "../user"
import type {
    CompleteFlashcardDueReviewSessionParams,
    CompleteFlashcardDueReviewSessionResult,
    FindFlashcardDueReviewSessionByIdParams,
    FindMyInProgressFlashcardDueReviewSessionParams,
    MyInProgressFlashcardDueReviewSessionResultData,
    StartFlashcardDueReviewSessionParams,
    StartFlashcardDueReviewSessionResult,
    SyncFlashcardDueReviewSessionProgressParams,
    SyncFlashcardDueReviewSessionProgressResult,
} from "./types/flashcard-due-review-session"

/**
 * How far back a session's last sync may be for it to still be offered as
 * resumable — same reasoning as `FlashcardReviewSessionService`'s own
 * `RESUME_WINDOW_HOURS`: a session synced longer ago than this is treated as
 * effectively abandoned even though `startFlashcardDueReviewSession` has not
 * yet flipped its status (that only happens when the SAME enrollment starts a
 * NEW draw).
 */
const RESUME_WINDOW_HOURS = 24

/**
 * Business logic for the resumable CROSS-DECK due-review batch ("DueReview")
 * session — mirrors
 * {@link import("./flashcard-review-session.service").FlashcardReviewSessionService}'s
 * resumable-draw shape, but scoped to an ENROLLMENT only (no deck): a
 * due-review batch draws cards across MULTIPLE decks in one course, so it
 * cannot reuse the deck-scoped review-session table/service. The actual SM-2
 * grading still happens per-card through the existing `reviewFlashcard`
 * mutation ({@link import("./flashcard-review.service").FlashcardReviewService.review});
 * this service is purely a resumable progress/bookkeeping wrapper around a
 * sequence of those calls, mirroring `FlashcardReviewSessionService`'s own XP
 * DECISION: `reviewFlashcard` grants no XP today, so `xpEarned` on
 * `flashcard_due_review_sessions` is a CLIENT-REPORTED BOOKKEEPING SNAPSHOT
 * ONLY — `sync`/`complete` below persist whatever value the caller sends,
 * with NO `xp_histories` insert, NO `XpSource` addition, and NO daily-cap
 * logic.
 */
@Injectable()
export class FlashcardDueReviewSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Persist ONE resumable due-review batch draw over a course, retiring any
     * PRIOR "in_progress" draw for the same enrollment first so a learner
     * never has two resumable due-review batches at once — mirrors
     * `FlashcardReviewSessionService.start`'s own "abandon prior in_progress
     * row" step (there further scoped by deck; here scoped by enrollment
     * alone, since a due-review batch spans multiple decks).
     *
     * @param params - {@link StartFlashcardDueReviewSessionParams}
     * @returns the newly-persisted session's id.
     */
    async start(
        {
            userId,
            courseId,
            cardIds,
        }: StartFlashcardDueReviewSessionParams,
    ): Promise<StartFlashcardDueReviewSessionResult> {
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        // retire the enrollment's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates.
        await this.entityManager.update(
            FlashcardDueReviewSessionEntity,
            {
                enrollment: {
                    id: enrollment.id,
                },
                status: "in_progress",
            },
            {
                status: "abandoned",
            },
        )

        const session = await this.entityManager.save(
            FlashcardDueReviewSessionEntity,
            {
                enrollment,
                cardIds,
                currentIndex: 0,
                reviewedCount: 0,
                gradedIndexes: [],
                xpEarned: 0,
                status: "in_progress",
            },
        )

        return {
            sessionId: session.id,
        }
    }

    /**
     * Sync an in-flight due-review batch session's position + progress —
     * ownership-scoped, silently no-ops (never throws) for a session that is
     * not found/owned or no longer "in_progress", same reasoning as
     * `FlashcardReviewSessionService.sync` (a background periodic sync must
     * never surface an error toast mid-batch).
     *
     * @param params - {@link SyncFlashcardDueReviewSessionProgressParams}
     * @returns whether the sync was applied.
     */
    async sync(
        {
            userId,
            sessionId,
            currentIndex,
            reviewedCount,
            gradedIndexes,
            xpEarned,
        }: SyncFlashcardDueReviewSessionProgressParams,
    ): Promise<SyncFlashcardDueReviewSessionProgressResult> {
        const session = await this.entityManager.findOne(
            FlashcardDueReviewSessionEntity,
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
            FlashcardDueReviewSessionEntity,
            {
                id: session.id,
            },
            {
                currentIndex,
                reviewedCount,
                // only overwrite the graded-index set when the caller sent one
                // — omitting it must leave the column untouched (same tolerance
                // the rest of the sync payload has), not wipe it to undefined.
                ...(gradedIndexes !== undefined ? {
                    gradedIndexes,
                } : {
                }),
                xpEarned,
            },
        )

        return {
            success: true,
        }
    }

    /**
     * Record a finished due-review batch session — flips the row to
     * "completed" and snapshots the final reviewed-count/xpEarned the caller
     * reports. Ownership-scoped via `status: Not("completed")` (loosened
     * 2026-07-12 — was `status: "in_progress"`, mirroring
     * `FlashcardReviewSessionService.complete`'s own guard): the STRICT
     * `"in_progress"` match silently updated ZERO rows (TypeORM `update()`
     * never throws on a no-match) whenever the row had ALREADY been raced to
     * "abandoned" by a concurrent `start()` (retires every prior in_progress
     * row for the enrollment — e.g. a duplicate resolve-or-start effect fire)
     * BEFORE this call landed — the FE still reported "success" (the mutation
     * itself never errored), but the row was permanently stuck un-completed,
     * so a later revisit-by-URL/resume kept re-entering the review instead of
     * showing the recap (thầy 2026-07-12: "sao có kết quả phiên ôn rồi mà F5
     * lại ra flashcard cuối"). `Not("completed")` still refuses to re-flip an
     * ALREADY-completed row (replay-safe, same as before) while tolerating
     * "abandoned" — the learner genuinely finished, so their completion
     * should win regardless of what else raced the row's status meanwhile.
     *
     * NO XP is granted here — see the class doc's XP DECISION. `xpEarned` is
     * echoed straight through as a bookkeeping snapshot, never written to
     * `xp_histories`.
     *
     * @param params - {@link CompleteFlashcardDueReviewSessionParams}
     * @returns the reviewed-count/xpEarned snapshotted onto the row.
     */
    async complete(
        {
            userId,
            sessionId,
            reviewedCount,
            xpEarned,
        }: CompleteFlashcardDueReviewSessionParams,
    ): Promise<CompleteFlashcardDueReviewSessionResult> {
        // Ownership is a two-level nested relation (enrollment → user), which a
        // bare `update()` cannot express: TypeORM compiles `update` to an
        // UpdateQueryBuilder that has no JOINs, so a nested-relation WHERE throws
        // "Cannot find alias for relation". Resolve ownership with a `findOne`
        // (which CAN join) first, then update by the scalar `id` + the
        // replay-safe `status` guard — mirroring `sync()` in this same service.
        const owned = await this.entityManager.findOne(
            FlashcardDueReviewSessionEntity,
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
                },
            },
        )
        if (owned) {
            await this.entityManager.update(
                FlashcardDueReviewSessionEntity,
                {
                    id: sessionId,
                    status: Not("completed"),
                },
                {
                    status: "completed",
                    reviewedCount,
                    xpEarned,
                },
            )
        }

        return {
            reviewedCount,
            xpEarned,
        }
    }

    /**
     * Find the most recent `status = "in_progress"` due-review batch session,
     * synced within {@link RESUME_WINDOW_HOURS}, for the caller's enrollment
     * in one course — mirrors
     * `MyInProgressFlashcardQuizSessionService.find`/
     * `FlashcardReviewSessionService.findInProgress`, scoped by course
     * (course-wide, like quiz sessions — NOT per-deck, unlike review
     * sessions).
     *
     * @param params - {@link FindMyInProgressFlashcardDueReviewSessionParams}
     * @returns the resumable session, or null when there is none.
     */
    async findInProgress(
        {
            userId,
            courseId,
        }: FindMyInProgressFlashcardDueReviewSessionParams,
    ): Promise<MyInProgressFlashcardDueReviewSessionResultData | null> {
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const resumeWindowStart = new Date(
            Date.now() - RESUME_WINDOW_HOURS * 60 * 60 * 1000,
        )

        const session = await this.entityManager.findOne(
            FlashcardDueReviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
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
            gradedIndexes: session.gradedIndexes ?? [],
            xpEarned: session.xpEarned,
            updatedAt: session.updatedAt,
        }
    }

    /**
     * Find a due-review batch session directly by its id (ownership-checked
     * against the caller) — mirrors
     * `FlashcardReviewSessionService.findById`; no deck identity to attach
     * here (a due-review batch spans multiple decks, per-card deckId comes
     * from the drawn cards themselves, not the session row). NOT
     * window/status-scoped like `findInProgress` — a direct link to a
     * completed/abandoned session still resolves.
     *
     * @param params - {@link FindFlashcardDueReviewSessionByIdParams}
     * @returns the session, or null when not found/not owned by the caller.
     */
    async findById(
        {
            userId,
            sessionId,
        }: FindFlashcardDueReviewSessionByIdParams,
    ): Promise<MyInProgressFlashcardDueReviewSessionResultData | null> {
        const session = await this.entityManager.findOne(
            FlashcardDueReviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                    },
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
            gradedIndexes: session.gradedIndexes ?? [],
            xpEarned: session.xpEarned,
            updatedAt: session.updatedAt,
        }
    }
}
