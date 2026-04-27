import {
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
} from "@modules/databases"
import {
    ContentNotFoundException,
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
    ContentParentIndexCacheResult 
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
                    challenges: {
                        id,
                    },
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
                    contents: {
                        id: content.id,
                    },
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
                    modules: {
                        id: parentModule.id,
                    },
                },
            },
        )
        if (!parentCourse) {
            throw new CourseNotFoundException(
                {
                    moduleId: parentModule.id,
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
