import {
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CacheKey,
    CacheService,
    MilestoneTaskParentIndexCacheResult,
} from "@modules/cache"

@Injectable()
/**
 * Primes the parent-index cache for a milestone task so global-search hits can build a deep-link URL.
 *
 * A task hit routes to its personal-project page (`/learn/personal-project/tasks/{taskId}`), where
 * the task id is the hit's own id -- so the cached ref only needs the owning course for the URL slug.
 */
export class IndexerMilestoneTaskBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Builds the parent-index entry for the given milestone task id.
     * @param id - The milestone task id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const task = await this.entityManager.findOne(
            MilestoneTaskEntity,
            {
                where: {
                    id,
                },
                relations: {
                    milestone: {
                        course: true,
                    },
                },
            },
        )
        // the sync loop already confirmed the row exists; bail out defensively otherwise
        const course = task?.milestone?.course
        if (!course) {
            return
        }
        const ref: MilestoneTaskParentIndexCacheResult = {
            course: {
                id: course.id,
                displayId: course.displayId,
            },
        }
        await this.cacheService.set(
            {
                key: CacheKey.ParentIndex,
                args: [
                    MilestoneTaskEntity.name,
                    id,
                ],
                cacheResult: ref,
            },
        )
    }
}
