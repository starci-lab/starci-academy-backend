import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
    UserMilestoneTaskEntity,
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    MilestoneTaskProgressCacheResult,
    MilestoneTaskProgressItem,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import type {
    ProgressEnrollmentType,
} from "./types"

/**
 * Service for managing personal project task progress.
 * Encapsulates cache get / compute / set / invalidate logic.
 */
@Injectable()
export class PersonalProjectProgressService {
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
            key: CacheKey.MilestoneTaskProgress,
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
    ): Promise<MilestoneTaskProgressCacheResult> {
        const cached = await this.cacheService.get({
            key: CacheKey.MilestoneTaskProgress,
            args: [enrollment.enrollmentId],
        })
        if (cached && cached.completionTasks) {
            return cached
        }

        const result = await this.computeProgress(enrollment)
        await this.cacheService.set({
            key: CacheKey.MilestoneTaskProgress,
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
            key: CacheKey.MilestoneTaskProgress,
            args: [enrollmentId],
        })
    }

    /**
     * Compute progress from DB for a given enrollment.
     */
    private async computeProgress(
        enrollment: ProgressEnrollmentType,
    ): Promise<MilestoneTaskProgressCacheResult> {
        const passThreshold = this.mountStorageService.appConfig.systemConfig.task.passThreshold
        /** Fetch all milestone tasks for the course, ordered */
        const milestoneTasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        course: {
                            id: enrollment.courseId,
                        },
                    },
                },
                relations: {
                    milestone: true,
                },
                order: {
                    milestone: {
                        orderIndex: "ASC",
                    },
                    orderIndex: "ASC",
                },
            },
        )
        const completionTasks: Array<MilestoneTaskProgressItem> = []
        let currentTask: MilestoneTaskProgressItem | null = null
        for (const task of milestoneTasks) {
            /** Find user's milestone task record */
            const userMilestoneTask = await this.entityManager.findOne(
                UserMilestoneTaskEntity,
                {
                    where: {
                        enrollment: {
                            id: enrollment.enrollmentId,
                        },
                        milestoneTask: {
                            id: task.id,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )

            if (!userMilestoneTask) {
                /** No attempts at all */
                const item: MilestoneTaskProgressItem = {
                    id: task.id,
                    lastScore: 0,
                    maxScore: task.maxScore,
                    completed: false,
                    numAttempts: 0,
                }
                completionTasks.push(item)
                if (!currentTask) {
                    currentTask = item
                }
                continue
            }

            /** Fetch all attempts for this user milestone task */
            const attempts = await this.entityManager.find(
                UserMilestoneTaskAttemptEntity,
                {
                    where: {
                        userMilestoneTask: {
                            id: userMilestoneTask.id,
                        },
                    },
                    order: {
                        attemptNumber: "DESC",
                    },
                    select: {
                        id: true,
                        score: true,
                        attemptNumber: true,
                    },
                },
            )

            const numAttempts = attempts.length
            const latestAttempt = attempts[0] ?? null

            const lastScore = latestAttempt?.score ?? 0
            const completed = lastScore >= task.maxScore * passThreshold

            const item: MilestoneTaskProgressItem = {
                id: task.id,
                lastScore,
                maxScore: task.maxScore,
                completed,
                numAttempts,
            }
            completionTasks.push(item)
            if (!completed && !currentTask) {
                currentTask = item
            }
        }

        return {
            completionTasks,
            currentTask,
        }
    }
}
