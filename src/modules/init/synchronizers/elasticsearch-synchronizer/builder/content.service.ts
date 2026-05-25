import {
    ContentEntity,
    ContentHydrationService,
    ContentResolverService,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

/**
 * Loads content (with references, code explainings, implementations) from PostgreSQL and
 * materializes **per-locale** plain objects (after `ContentResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchContentBuildService {
    constructor(
        private readonly contentHydration: ContentHydrationService,
        private readonly contentResolver: ContentResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed content tree.
     */
    async buildMultilingualByContentId(
        contentId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ContentEntity>>> {
        const hydratedContent = await this.contentHydration.loadById(
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
     * Builds the index by content id.
     * @param id - The content id.
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
