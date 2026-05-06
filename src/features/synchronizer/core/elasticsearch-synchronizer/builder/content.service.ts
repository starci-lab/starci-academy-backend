import {
    ContentEntity,
    ContentReferenceEntity,
    ContentResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ContentNotFoundException,
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
 * Loads content (with references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ContentResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchContentBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentResolver: ContentResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed content tree.
     */
    async buildMultilingualByContentId(
        contentId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ContentEntity>>> {
        const hydratedContent = await this.loadHydratedContentPlain(
            contentId,
        )
        const defaultLocale = hydratedContent.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedContent = _.cloneDeep(hydratedContent)
                this.contentResolver.transform(
                    localizedContent,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedContent,
                }
            },
        )
    }

    /**
     * Loads the hydrated content plain object from PostgreSQL.
     * @param id - The content id.
     * @returns The hydrated content plain object.
     */
    private async loadHydratedContentPlain(
        id: string,
    ): Promise<ContentEntity> {
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
                }
            )
        }
        const hydratedContent = content.toPlain<ContentEntity>()
        const references = await this.entityManager.find(
            ContentReferenceEntity,
            {
                where: {
                    content: {
                        id: hydratedContent.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        hydratedContent.references = references.map(
            (
                reference,
            ) => reference.toPlain<ContentReferenceEntity>()
        )
        return hydratedContent
    }

    /**
     * Builds the index by content id.
     * @param id - The content id.
     * @returns The index by content id.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByContentId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: ContentEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
