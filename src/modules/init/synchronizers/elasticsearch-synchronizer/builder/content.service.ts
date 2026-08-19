import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContentHydrationService,
} from "@modules/databases/postgresql/primary/hydration/content-hydration.service"
import {
    ContentResolverService,
} from "@modules/databases/postgresql/primary/resolvers/content-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"

@Injectable()
/**
 * Loads content (with references, code explainings, implementations) from PostgreSQL and
 * materializes **per-locale** plain objects (after `ContentResolverService`) for Elasticsearch JSON.
 */
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
                const localizedContent = structuredClone(hydratedContent)
                this.contentResolver.transform(
                    localizedContent,
                    locale,
                    defaultLocale,
                )
                // populate the ES completion field: the clean lesson title as the
                // suggest input, weighted by display order (earlier lesson = more
                // prominent) so the FST-backed autocomplete returns ranked titles.
                // the resolver already wrote the per-locale title back onto the row,
                // so no localized wrapper remains to strip -- just trim the label.
                const label = (localizedContent.title ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: [label],
                    weight: Math.max(1,
                        100 - (localizedContent.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        localizedContent,
                        {
                            // derive the challenge count LIVE from the loaded relation. The denormalized
                            // `num_challenges` column is not repopulated on reseed (stays stale / 0), so
                            // counting the hydrated challenges here keeps the ES doc accurate + reseed-safe.
                            numChallenges: localizedContent.challenges?.length ?? 0,
                            suggest,
                        },
                    ),
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
