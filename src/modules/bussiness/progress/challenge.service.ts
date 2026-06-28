import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ChallengeEntity,
    UserChallengeProgressProjectionEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeProgressStatus,
} from "@modules/cache"
import type {
    ChallengeSubmissionProgressCacheResult,
    ChallengeSubmissionProgressItem,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    envConfig,
} from "@modules/env"
import type {
    ProgressEnrollmentType,
} from "./types"

/**
 * Service for managing challenge submission progress.
 *
 * Backed by the `user_challenge_progress_projections` CQRS read-model (one row
 * per enrollment, aggregate in jsonb `value`). The heavy recompute runs ONLY in
 * {@link recompute} (eager: in the grade-complete transaction + CDC); reads
 * ({@link getProgress}) extract the stored aggregate and lazily recompute when
 * the row is missing or older than the projection TTL. This replaces the old
 * Redis `challenge.submission.progress` cache — the projection table IS the cache
 * now, and its `updated_at` timestamp drives staleness.
 */
@Injectable()
export class ChallengeProgressService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Recompute + upsert the projection row for an enrollment. Call on every
     * grade-complete (and from the CDC/event listener). Idempotent (UPSERT) and
     * runs inside the caller's transaction when one is given (atomic + fresh).
     * @param enrollment - The enrollment to recompute.
     * @param entityManager - Optional caller transaction manager.
     */
    async recompute(
        enrollment: ProgressEnrollmentType,
        entityManager?: EntityManager,
    ): Promise<void> {
        const manager = entityManager ?? this.entityManager
        const result = await this.computeProgress(enrollment,
            manager)
        // raw UPSERT so `updated_at = now()` is bumped on conflict (TypeORM's
        // @UpdateDateColumn is not re-stamped by `upsert`) — the timestamp the
        // read-path staleness check relies on.
        await manager.query(
            `
            INSERT INTO user_challenge_progress_projections (enrollment_id, value)
            VALUES ($1, $2::jsonb)
            ON CONFLICT (enrollment_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
            `,
            [
                enrollment.enrollmentId,
                JSON.stringify(result),
            ],
        )
    }

    /**
     * Read an enrollment's challenge progress from the projection (TTL
     * lazy-refresh): a missing row, or one older than the projection TTL, is
     * recomputed on the spot before returning.
     * @param enrollment - The enrollment to read.
     */
    async getProgress(
        enrollment: ProgressEnrollmentType,
    ): Promise<ChallengeSubmissionProgressCacheResult> {
        let row = await this.entityManager.findOne(
            UserChallengeProgressProjectionEntity,
            {
                where: {
                    enrollmentId: enrollment.enrollmentId,
                },
            },
        )
        // TTL safety net: missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute(enrollment)
            row = await this.entityManager.findOne(
                UserChallengeProgressProjectionEntity,
                {
                    where: {
                        enrollmentId: enrollment.enrollmentId,
                    },
                },
            )
        }
        const value = (row?.value ?? {
        }) as Partial<ChallengeSubmissionProgressCacheResult>
        return {
            completionTasks: value.completionTasks ?? [],
        }
    }

    /**
     * Drop the projection row for an enrollment so the next read recomputes a
     * fresh aggregate. Called eagerly from the grade-complete step (and the
     * event listener) — the shared row is the source of truth, so deleting it
     * is globally effective without any cache/event indirection.
     * @param enrollmentId - The enrollment whose projection to invalidate.
     */
    async invalidateProgress(
        enrollmentId: string,
    ): Promise<void> {
        await this.entityManager.delete(
            UserChallengeProgressProjectionEntity,
            {
                enrollmentId,
            },
        )
    }

    /**
     * Whether a projection row is past its freshness window.
     * @param updatedAt - The row's last write time.
     * @returns true when older than the configured projection TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Compute progress from DB for a given enrollment.
     * @param enrollment - The enrollment to compute for.
     * @param manager - The entity manager to read through (caller tx or service).
     */
    private async computeProgress(
        enrollment: ProgressEnrollmentType,
        manager: EntityManager,
    ): Promise<ChallengeSubmissionProgressCacheResult> {
        const challenges = await manager.find(
            ChallengeEntity,
            {
                where: {
                    content: {
                        module: {
                            course: {
                                id: enrollment.courseId,
                            },
                        },
                    },
                },
                relations: {
                    submissions: true,
                },
                order: {
                    content: {
                        module: {
                            sortIndex: "ASC",
                        },
                        sortIndex: "ASC",
                    },
                    sortIndex: "ASC",
                },
            },
        )

        const challengeIds = challenges.map((c) => c.id)

        if (challengeIds.length === 0) {
            return {
                completionTasks: [],
            }
        }

        // the viewer's own submission rows for these challenges, keyed by ENROLLMENT
        // (the anchor for per-course progress going forward) — user_challenge_submissions
        // carries enrollment_id (backfilled). Without this filter the aggregate would
        // span EVERY user's submissions for the course's challenges.
        const userSubmissions = await manager.find(
            UserChallengeSubmissionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.enrollmentId,
                    },
                    submission: {
                        challenge: {
                            id: In(challengeIds),
                        },
                    },
                },
                relations: {
                    attempts: true,
                    submission: true,
                },
            },
        )

        // Fraction of a submission's score the latest attempt must reach to pass it.
        const passThreshold = this.mountStorageService.appConfig.systemConfig.challenge.passThreshold

        const completionTasks: Array<ChallengeSubmissionProgressItem> = challenges.map((challenge) => {
            const submissionsForChallenge = userSubmissions.filter(
                (us) => us.submission.challengeId === challenge.id,
            )

            // Total attempts across all submissions for this challenge.
            const numAttempts = submissionsForChallenge.reduce(
                (sum, us) => sum + (us.attempts?.length ?? 0),
                0,
            )

            // Whether any user submission row exists at all (challenge has been started).
            let anyUserSubmission = false
            // Whether some user submission row exists but has no attempt yet (started, not submitted).
            let hasPendingSubmission = false
            // Whether every submission has been submitted and cleared its pass threshold.
            let allSubmittedAndPassed = true
            // Sum of each submission's latest-attempt score, capped at that submission's score.
            let lastScore = 0

            for (const submission of challenge.submissions) {
                const userSubmission = submissionsForChallenge.find(
                    (us) => us.submission.id === submission.id,
                )
                // Submission never created → not submitted, cannot pass.
                if (!userSubmission) {
                    allSubmittedAndPassed = false
                    continue
                }
                anyUserSubmission = true
                const attempts = userSubmission.attempts ?? []
                // User submission row exists but was never submitted for grading → in progress.
                if (attempts.length === 0) {
                    hasPendingSubmission = true
                    allSubmittedAndPassed = false
                    continue
                }
                // Latest attempt = the one with the highest attempt number.
                const latestAttempt = attempts.reduce(
                    (latest, attempt) => (attempt.attemptNumber > latest.attemptNumber ? attempt : latest),
                )
                const latestScore = latestAttempt.score ?? 0
                // Earned points for this submission, capped at its own max score.
                lastScore += Math.min(latestScore,
                    submission.score)
                // Pass when the latest attempt clears the submission's pass threshold.
                if (latestScore < submission.score * passThreshold) {
                    allSubmittedAndPassed = false
                }
            }

            // Derive the lifecycle status from the per-submission outcomes.
            // "In progress" wins whenever a created-but-unsubmitted submission exists.
            let status: ChallengeProgressStatus
            if (hasPendingSubmission) {
                status = ChallengeProgressStatus.InProgress
            } else if (!anyUserSubmission) {
                status = ChallengeProgressStatus.NotStarted
            } else if (allSubmittedAndPassed) {
                status = ChallengeProgressStatus.Completed
            } else {
                status = ChallengeProgressStatus.Failed
            }

            const maxScore = challenge.score
            const completed = status === ChallengeProgressStatus.Completed

            return {
                id: challenge.id,
                lastScore,
                maxScore,
                completed,
                status,
                numAttempts,
            }
        })

        return {
            completionTasks,
        }
    }
}
