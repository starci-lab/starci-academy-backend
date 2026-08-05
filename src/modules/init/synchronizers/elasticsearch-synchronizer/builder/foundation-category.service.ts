import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FoundationCategoryHydrationService,
} from "@modules/databases/postgresql/primary/hydration/foundation-category-hydration.service"
import {
    FoundationCategoryResolverService,
} from "@modules/databases/postgresql/primary/resolvers/foundation-category-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a foundation category and indexes **per-locale** ES docs. Suggest
 * strips the Vietnamese-locale Foundation title prefix so autocomplete matches the tech
 * name learners type.
 */
export class ElasticsearchFoundationCategoryBuildService {
    constructor(
        private readonly foundationCategoryHydration: FoundationCategoryHydrationService,
        private readonly foundationCategoryResolver: FoundationCategoryResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByCategoryId(
        categoryId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FoundationCategoryEntity>>> {
        const hydratedCategory = await this.foundationCategoryHydration.loadById(
            categoryId,
        )
        return Object.values(Locale).map(
            (locale) => {
                const localizedCategory = _.cloneDeep(hydratedCategory)
                this.foundationCategoryResolver.transform(
                    localizedCategory,
                    locale,
                )
                // populate the ES completion field: the bare tech name as the
                // suggest input, weighted by display order (earlier = more popular)
                // so the FST-backed autocomplete returns clean, ranked suggestions.
                const label = (localizedCategory.title ?? "")
                    .replace(/^Nền tảng\s+/i, // vn-ok: matches vi-locale category title prefix at runtime
                        "")
                    .replace(/\s+Foundation$/i,
                        "")
                    .trim()
                const suggest = {
                    input: label.length > 0 ? [label] : [],
                    weight: Math.max(1,
                        100 - (localizedCategory.orderIndex ?? 0)),
                }
                return {
                    locale,
                    entity: Object.assign(
                        localizedCategory,
                        {
                            suggest,
                        },
                    ),
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByCategoryId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: FoundationCategoryEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
