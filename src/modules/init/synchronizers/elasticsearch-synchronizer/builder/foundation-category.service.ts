import {
    FoundationCategoryEntity,
    FoundationCategoryResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    FoundationCategoryNotFoundException,
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
 * Loads foundation categories from PostgreSQL and materializes per-locale plain objects for Elasticsearch.
 */
@Injectable()
export class ElasticsearchFoundationCategoryBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly foundationCategoryResolver: FoundationCategoryResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per {@link Locale} with the transformed category row.
     */
    async buildMultilingualByCategoryId(
        categoryId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FoundationCategoryEntity>>> {
        const hydratedCategory = await this.loadHydratedCategoryPlain(
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

    private async loadHydratedCategoryPlain(
        id: string,
    ): Promise<FoundationCategoryEntity> {
        const category = await this.entityManager.findOne(
            FoundationCategoryEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!category) {
            throw new FoundationCategoryNotFoundException({
                id,
            })
        }
        return category.toPlain<FoundationCategoryEntity>()
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
