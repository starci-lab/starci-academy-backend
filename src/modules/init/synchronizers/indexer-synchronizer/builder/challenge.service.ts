import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
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
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
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
    ChallengeParentIndexCacheResult,
} from "@modules/integrations/cache/types/cache-results/parent-index"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"

@Injectable()
/**
 * Loads a challenge (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ChallengeResolverService`) for Elasticsearch JSON.
 */
export class IndexerChallengeBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}
    
    /**
     * Builds the index by challenge id.
     * @param id - The challenge id.
     * @returns The index by challenge id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id,
                }
            )
        }
        const parentContent = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: challenge.contentId,
                },
            },
        )
        if (!parentContent) {
            throw new ContentNotFoundException(
                {
                    id: challenge.contentId,
                }
            )
        }
        const parentModule = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id: parentContent.moduleId,
                },
            },
        )
        if (!parentModule) {
            throw new ModuleNotFoundException(
                {
                    id: parentContent.moduleId,
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
        const ref: ChallengeParentIndexCacheResult = {
            challenge: {
                id,
                displayId: challenge.displayId,
            },
            content: {
                id: parentContent.id,
                displayId: parentContent.displayId,
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
                    ChallengeEntity.name, 
                    id
                ],
                cacheResult: ref,
            },
        )
    }
}
