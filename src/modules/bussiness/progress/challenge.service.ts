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
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
    ChallengeProgressStatus,
} from "@modules/cache"
import type {
    ChallengeSubmissionProgressCacheResult,
    ChallengeSubmissionProgressItem,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import type {
    ProgressEnrollmentType,
} from "./types"

/**
 * Service for managing challenge submission progress.
 * Encapsulates cache get / compute / set / invalidate logic.
 */
@Injectable()
export class ChallengeProgressService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Update the cached progress for an enrollment.
     * Recomputes from DB and sets cache.
     * @param enrollment - The enrollment type.
     */
    async updateProgress(
        enrollment: ProgressEnrollmentType,
    ): Promise<void> {
        const result = await this.computeProgress(enrollment)
        await this.cacheService.set({
            key: CacheKey.ChallengeSubmissionProgress,
            args: [enrollment.enrollmentId],
            cacheResult: result,
        })
    }

    /**
     * Get progress from cache. On cache miss, compute from DB and store.
     * @param enrollment - The enrollment type.
     */
    async getProgress(
        enrollment: ProgressEnrollmentType,
    ): Promise<ChallengeSubmissionProgressCacheResult> {
        const cached = await this.cacheService.get({
            key: CacheKey.ChallengeSubmissionProgress,
            args: [enrollment.enrollmentId],
        })
        if (cached && cached.completionTasks) {
            return cached
        }

        const result = await this.computeProgress(enrollment)
        await this.cacheService.set({
            key: CacheKey.ChallengeSubmissionProgress,
            args: [enrollment.enrollmentId],
            cacheResult: result,
        })
        return result
    }

    /**
     * Invalidate the cached progress for an enrollment.
     * The next getProgress call will recompute from DB.
     * @param enrollmentId - The enrollment ID.
     */
    async invalidateProgress(
        enrollmentId: string,
    ): Promise<void> {
        await this.cacheService.del({
            key: CacheKey.ChallengeSubmissionProgress,
            args: [enrollmentId],
        })
    }

    /**
     * Compute progress from DB for a given enrollment.
     */
    private async computeProgress(
        enrollment: ProgressEnrollmentType,
    ): Promise<ChallengeSubmissionProgressCacheResult> {
        const challenges = await this.entityManager.find(
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
        const userSubmissions = await this.entityManager.find(
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
