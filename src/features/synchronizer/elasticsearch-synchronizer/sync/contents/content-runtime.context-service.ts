import {
    ContentEntity,
    ContentReferenceEntity,
    ContentResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import {
    ElasticsearchService 
} from "@modules/elasticsearch"
import {
    envConfig 
} from "@modules/env"
import {
    ContentNotFoundException
} from "@modules/exceptions"
import {
    AsyncService,
} from "@modules/mixin"
import {
    Inject,
    Injectable,
    Scope,
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import _ from "lodash"
import {
    EntityManager
} from "typeorm"
import type {
    ContentRuntimeContextRequest
} from "./types"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ContentRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: ContentRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearch: ElasticsearchService,
        private readonly syncStateService: SyncStateService,
        private readonly contentResolver: ContentResolverService,
    ) {}

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process(),
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.contents.runtime,
        )
    }

    /**
     * Sync the content to the CDN.
     */
    async process() {

        // take the content
        const content = await this.entityManager.findOne(
            ContentEntity, 
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )

        if (!content) {
            throw new ContentNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
        const sourceUpdatedAt = content.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.Elasticsearch,
                sourceType: SyncStateSourceType.Content,
                sourceId: this.request.id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainContent = content.toPlain<ContentEntity>()
            // take all references related to the content
            const references = await this.entityManager.find(
                ContentReferenceEntity, 
                {
                    where: {
                        content: {
                            id: plainContent.id,
                        },
                    },
                    select: {
                        id: true,
                        alias: true,
                        url: true,
                        orderIndex: true
                    }
                }
            )

            const hydratedReferences = references?.map((reference) =>
                reference.toPlain<ContentReferenceEntity>(),
            )

            plainContent.references = hydratedReferences

            const locales = [Locale.Vi,
                Locale.En]

            await Promise.all(locales.map(async (locale) => {
                const hydratedContent = _.cloneDeep(plainContent)

                this.contentResolver.transform(
                    hydratedContent,
                    locale,
                    hydratedContent.defaultLocale ?? Locale.En,
                )

                const dataToIndex = _.omit(
                    hydratedContent,
                    ["translations"],
                )

                const indexedData = {
                    ...dataToIndex,
                    locale,
                }

                // Index each locale separately with a composite ID
                await this.elasticsearch.indexEntity(
                    ContentEntity,
                    indexedData,
                    `${hydratedContent.id}-${locale}`,
                )
            }))

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Content,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Content,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
