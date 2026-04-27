import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
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
    ChallengeParentIndexCacheResult 
} from "@modules/cache"
import {
    CacheKey 
} from "@modules/cache"
import {
    CacheService 
} from "@modules/cache"

/**
 * Loads a challenge (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ChallengeResolverService`) for Elasticsearch JSON.
 */
@Injectable()
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
                    challenges: {
                        id,
                    },
                },
            },
        )
        if (!parentContent) {
            throw new ContentNotFoundException(
                {
                    challengeId: id,
                }
            )
        }
        const parentModule = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    contents: {
                        id: parentContent.id,
                    },
                },
            },
        )
        if (!parentModule) {
            throw new ModuleNotFoundException(
                {
                    contentId: parentContent.id,
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
