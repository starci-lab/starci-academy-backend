import {
    FoundationCategoryEntity,
    FoundationCategoryHydrationService,
    FoundationCategoryResolverService,
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

@Injectable()
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
                    .replace(/^Nền tảng\s+/i,
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
                    // suggest is an index-only field (not on the entity type) — cast so the
                    // generic indexer stores it while keeping the entity contract intact
                    entity: {
                        ...localizedCategory,
                        suggest,
                    } as unknown as FoundationCategoryEntity,
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
