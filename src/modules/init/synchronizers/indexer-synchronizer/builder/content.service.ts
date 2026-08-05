import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
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
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
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
    ContentParentIndexCacheResult,
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
export class IndexerContentBuildService {
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
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!content) {
            throw new ContentNotFoundException(
                {
                    id,
                }
            )
        }
        const parentModule = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id: content.moduleId,
                },
            },
        )
        if (!parentModule) {
            throw new ModuleNotFoundException(
                {
                    contentId: content.id,
                }
            )
        }
        const parentCourse = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: parentModule.courseId,
                },
            },
        )
        if (!parentCourse) {
            throw new CourseNotFoundException(
                {
                    id: parentModule.courseId,
                }
            )
        }
        const ref: ContentParentIndexCacheResult = {
            content: {
                id: content.id,
                displayId: content.displayId,
            },
            module: {
                id: parentModule.id,
                displayId: parentModule.displayId,
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
                    ContentEntity.name, 
                    id
                ],
                cacheResult: ref,
            },
        )
    }
}
