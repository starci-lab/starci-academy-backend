import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LessonVideoResolverService,
    Locale,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import _ from "lodash"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    LessonVideoRuntimeContextRequest,
} from "./types"
import {
    LessonVideoNotFoundException 
} from "@modules/exceptions"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class LessonVideoRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: LessonVideoRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearch: ElasticsearchService,
        private readonly syncStateService: SyncStateService,
        private readonly lessonVideoResolver: LessonVideoResolverService,
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process()
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.lessonVideos.runtime
        )
    }

    /**
     * Sync the lesson video to Elasticsearch.
     */
    async process() {
        // take the lesson video
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }

        const sourceUpdatedAt = lessonVideo.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.Elasticsearch,
                sourceType: SyncStateSourceType.LessonVideo,
                sourceId: this.request.id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainLessonVideo = lessonVideo.toPlain<LessonVideoEntity>()
            const locales = [Locale.Vi,
                Locale.En]

            for (const locale of locales) {
                // deep clone the plain object to avoid mutating the original
                const hydratedLessonVideo = _.cloneDeep(plainLessonVideo)

                this.lessonVideoResolver.transform(
                    hydratedLessonVideo,
                    locale,
                    hydratedLessonVideo.defaultLocale ?? Locale.En,
                )

                const dataToIndex = _.omit(
                    hydratedLessonVideo,
                    ["translations"],
                )

                // Use the original UUID for the 'id' field in the document body,
                // but use a composite key (uuid-locale) for the Elasticsearch document ID (_id).
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
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.LessonVideo,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
