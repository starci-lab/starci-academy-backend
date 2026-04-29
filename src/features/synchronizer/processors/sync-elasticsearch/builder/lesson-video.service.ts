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
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

/**
 * Loads a lesson video row from PostgreSQL and materializes **per-locale** plain objects
 * (after `LessonVideoResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchLessonVideoBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly lessonVideoResolver: LessonVideoResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed lesson video payload.
     */
    async buildMultilingualByLessonVideoId(
        lessonVideoId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<LessonVideoEntity>>> {
        const hydratedLessonVideo = await this.loadHydratedLessonVideoPlain(
            lessonVideoId,
        )
        const defaultLocale = hydratedLessonVideo.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedLessonVideo = _.cloneDeep(hydratedLessonVideo)
                this.lessonVideoResolver.transform(
                    localizedLessonVideo,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedLessonVideo,
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

    /**
     * Builds the index by lesson video id.
     * @param id - The lesson video id.
     * @returns The index by lesson video id.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByLessonVideoId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: LessonVideoEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
