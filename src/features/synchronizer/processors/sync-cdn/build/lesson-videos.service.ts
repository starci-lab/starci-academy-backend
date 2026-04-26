import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedCdnEntity,
} from "./types"

/**
 * Loads a lesson video row from PostgreSQL and materializes **per-locale** plain objects
 * (after `LessonVideoResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnLessonVideosBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly lessonVideoResolver: LessonVideoResolverService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed lesson video payload.
     */
    async buildMultilingualByLessonVideoId(
        lessonVideoId: string,
    ): Promise<Array<LocalizedCdnEntity<LessonVideoEntity>>> {
        const hydratedLessonVideo = await this.loadHydratedLessonVideoPlain(
            lessonVideoId,
        )
        const defaultLocale = hydratedLessonVideo.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                this.lessonVideoResolver.transform(
                    hydratedLessonVideo,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: hydratedLessonVideo,
                }
            },
        )
    }

    /**
     * Loads the hydrated lesson video plain object from PostgreSQL.
     * @param id - The lesson video id.
     * @returns The hydrated lesson video plain object.
     */
    private async loadHydratedLessonVideoPlain(
        id: string,
    ): Promise<LessonVideoEntity> {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
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
        return lessonVideo.toPlain<LessonVideoEntity>()
    }
}
