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
                return {
                    locale,
                    entity: localizedCategory,
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
