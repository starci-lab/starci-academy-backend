import {
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneEntity,
} from "@modules/databases"
import {
    MilestoneNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CacheKey,
    CacheService,
    MilestoneParentIndexCacheResult,
} from "@modules/cache"

/**
 * Primes the parent-index cache for a milestone so global-search hits can build a deep-link URL.
 *
 * A milestone has no standalone page — a search hit lands on the personal-project page of its
 * first task. The cached ref therefore carries the owning course (for the URL slug) plus the
 * milestone's first task (lowest sort order), when it has any.
 */
@Injectable()
export class IndexerMilestoneBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Builds the parent-index entry for the given milestone id.
     * @param id - The milestone id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const milestone = await this.entityManager.findOne(
            MilestoneEntity,
            {
                where: {
                    id,
                },
                relations: {
                    course: true,
                    tasks: true,
                },
                order: {
                    tasks: {
                        sortIndex: "ASC",
                        orderIndex: "ASC",
                    },
                },
            },
        )
        if (!milestone) {
            throw new MilestoneNotFoundException(
                {
                    id,
                },
            )
        }
        // the lowest-ordered task is where a milestone hit deep-links (undefined when empty)
        const firstTask = milestone.tasks?.at(0)
        const ref: MilestoneParentIndexCacheResult = {
            course: {
                id: milestone.course.id,
                displayId: milestone.course.displayId,
            },
            task: firstTask
                ? {
                    id: firstTask.id,
                    displayId: firstTask.displayId,
                }
                : undefined,
        }
        await this.cacheService.set(
            {
                key: CacheKey.ParentIndex,
                args: [
                    MilestoneEntity.name,
                    id,
                ],
                cacheResult: ref,
            },
        )
    }
}
