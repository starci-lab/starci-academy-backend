import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    CourseParentIndexCacheResult,
} from "@modules/integrations/cache/types/cache-results/parent-index"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"

@Injectable()
/**
 * Loads a course (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ContentResolverService`) for Elasticsearch JSON.
 */
export class IndexerCourseBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}
    
    /**
     * Builds the index by content id.
     * @param id - The content id.
     * @returns The index by content id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id,
                }
            )
        }
        const ref: CourseParentIndexCacheResult = {
            course: {
                id,
                displayId: course.displayId,
            },
        }
        await this.cacheService.set(
            {
                key: CacheKey.ParentIndex,
                args: [
                    CourseEntity.name, 
                    id
                ],
                cacheResult: ref,
            },
        )
    }
}
