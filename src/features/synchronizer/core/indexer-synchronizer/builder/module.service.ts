import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
} from "@modules/databases"
import {
    CourseNotFoundException,
    ModuleNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import { 
    ModuleParentIndexCacheResult 
} from "@modules/cache"
import {
    CacheKey 
} from "@modules/cache"
import {
    CacheService 
} from "@modules/cache"

/**
 * Loads a content (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ContentResolverService`) for Elasticsearch JSON.
 */
@Injectable()
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
