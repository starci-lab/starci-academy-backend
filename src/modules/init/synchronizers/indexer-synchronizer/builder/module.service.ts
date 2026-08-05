import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    ModuleNotFoundException,
} from "@modules/platform/exceptions/errors/courses/module-not-found"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ModuleParentIndexCacheResult,
} from "@modules/integrations/cache/types/cache-results/parent-index"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"

@Injectable()
/**
 * Loads a content (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ContentResolverService`) for Elasticsearch JSON.
 */
export class IndexerModuleBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}
    
    /**
     * Builds the index by module id.
     * @param id - The module id.
     * @returns The index by module id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const module = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!module) {
            throw new ModuleNotFoundException(
                {
                    id,
                }
            )
        }
        const parentCourse = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: module.courseId,
                },
            },
        )
        if (!parentCourse) {
            throw new CourseNotFoundException(
                {
                    id: module.courseId,
                }
            )
        }
        const ref: ModuleParentIndexCacheResult = {
            module: {
                id,
                displayId: module.displayId,
            },
            course: {
                id: parentCourse.id,
                displayId: parentCourse.displayId,
            },
        }
        await this.cacheService.set(
            {
                key: CacheKey.ParentIndex,
                args: [
                    ModuleEntity.name, 
                    id
                ],
                cacheResult: ref,
            },
        )
    }
}
