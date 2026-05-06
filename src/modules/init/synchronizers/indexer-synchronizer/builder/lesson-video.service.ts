import {
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    ModuleEntity,
} from "@modules/databases"
import {
    ContentNotFoundException,
    CourseNotFoundException,
    LessonVideoNotFoundException,
    ModuleNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import { 
    LessonVideoParentIndexCacheResult 
} from "@modules/cache"
import {
    CacheKey 
} from "@modules/cache"
import {
    CacheService 
} from "@modules/cache"

/**
 * Loads a lesson video (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ChallengeResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class IndexerLessonVideoBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}
    
    /**
     * Builds the index by lesson video id.
     * @param id - The lesson video id.
     * @returns The index by lesson video id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id,
                },
            },
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id,
                }
            )
        }
        const parentContent = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: lessonVideo.contentId,
                },
            },
        )
        if (!parentContent) {
            throw new ContentNotFoundException(
                {
                    id: lessonVideo.contentId,
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
        const ref: LessonVideoParentIndexCacheResult = {
            lessonVideo: {
                id,
                displayId: lessonVideo.displayId,
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
                    LessonVideoEntity.name, 
                    id
                ],
                cacheResult: ref,
            },
        )
    }
}
