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
} from "@modules/cache"
import type {
    ChallengeSubmissionProgressCacheResult,
    ChallengeSubmissionProgressItem,
} from "@modules/cache"
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
                            orderIndex: "ASC",
                        },
                        orderIndex: "ASC",
                    },
                    orderIndex: "ASC",
                },
            },
        )

        const challengeIds = challenges.map((c) => c.id)

        if (challengeIds.length === 0) {
            return {
                completionTasks: [],
                currentTask: null,
            }
        }

        const userSubmissions = await this.entityManager.find(
            UserChallengeSubmissionEntity,
            {
                where: {
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

        const completionTasks: Array<ChallengeSubmissionProgressItem> = challenges.map((challenge) => {
            const submissionsForChallenge = userSubmissions.filter(
                (us) => us.submission.challengeId === challenge.id,
            )

            // Total attempts across all submissions for this challenge
            const numAttempts = submissionsForChallenge.reduce(
                (sum, us) => sum + (us.attempts?.length || 0),
                0,
            )

            // Score is the sum of the maximum score achieved in each submission
            const lastScore = challenge.submissions.reduce((sum, submission) => {
                const us = submissionsForChallenge.find((u) => u.submission.id === submission.id)
                if (!us || !us.attempts || us.attempts.length === 0) {
                    return sum
                }
                const maxAttemptScore = Math.max(...us.attempts.map((a) => a.score || 0))
                return sum + maxAttemptScore
            },
            0)

            const maxScore = challenge.score
            const completed = lastScore >= maxScore && maxScore > 0

            return {
                id: challenge.id,
                lastScore,
                maxScore,
                completed,
                numAttempts,
            }
        })

        const currentTask = completionTasks.find((t) => !t.completed) || null

        return {
            completionTasks,
            currentTask,
        }
    }
}
