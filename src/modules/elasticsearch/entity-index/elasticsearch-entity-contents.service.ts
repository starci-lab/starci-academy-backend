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
    ContentNotFoundException,
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
 * Indexes a content row (with references) to Elasticsearch (Vi + En), with sync-state guards.
 */
@Injectable()
export class ElasticsearchEntityContentsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearch: ElasticsearchService,
        private readonly syncStateService: SyncStateService,
        private readonly contentResolver: ContentResolverService,
    ) {
    }

    /**
     * Load the content, optionally skip via sync state, then index all locales.
     */
    async indexById(
        id: string,
    ): Promise<void> {
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )

        if (!content) {
            throw new ContentNotFoundException(
                {
                    id,
                },
            )
        }
        const sourceUpdatedAt = content.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.Elasticsearch,
                sourceType: SyncStateSourceType.Content,
                sourceId: id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainContent = content.toPlain<ContentEntity>()
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
                        orderIndex: true, 
                    },
                },
            )

            const hydratedReferences = references?.map(
                (
                    reference,
                ) => reference.toPlain<ContentReferenceEntity>(),
            )

            plainContent.references = hydratedReferences

            const locales = [
                Locale.Vi,
                Locale.En,
            ]

            await Promise.all(
                locales.map(
                    async (
                        locale,
                    ) => {
                        const hydratedContent = _.cloneDeep(
                            plainContent,
                        )

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

                        await this.elasticsearch.indexEntity(
                            ContentEntity,
                            indexedData,
                            `${hydratedContent.id}-${locale}`,
                        )
                    },
                ),
            )

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Content,
                    sourceId: id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Content,
                    sourceId: id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
