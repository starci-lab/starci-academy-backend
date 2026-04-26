import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import _ from "lodash"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "../elasticsearch.service"

/**
 * Indexes a lesson video to Elasticsearch (Vi + En), with sync-state guards.
 */
@Injectable()
export class ElasticsearchEntityLessonVideosService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearch: ElasticsearchService,
        private readonly syncStateService: SyncStateService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
    ) {
    }

    /**
     * Load the row, optionally skip via sync state, then index all locales.
     */
    async indexById(
        id: string,
    ): Promise<void> {
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
                },
            )
        }

        const sourceUpdatedAt = lessonVideo.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.Elasticsearch,
                sourceType: SyncStateSourceType.LessonVideo,
                sourceId: id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>()
            const locales = [
                Locale.Vi,
                Locale.En,
            ]

            for (const locale of locales) {
                const hydratedLessonVideo = _.cloneDeep(
                    plainLessonVideo,
                )

                this.lessonVideoResolver.transform(
                    hydratedLessonVideo,
                    locale,
                    hydratedLessonVideo.defaultLocale ?? Locale.En,
                )

                const dataToIndex = _.omit(
                    hydratedLessonVideo,
                    ["translations"],
                )

                const indexedData = {
                    ...dataToIndex,
                    locale,
                }

                await this.elasticsearch.indexEntity(
                    LessonVideoEntity,
                    indexedData,
                    `${hydratedLessonVideo.id}-${locale}`,
                )
            }

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.LessonVideo,
                    sourceId: id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.LessonVideo,
                    sourceId: id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
