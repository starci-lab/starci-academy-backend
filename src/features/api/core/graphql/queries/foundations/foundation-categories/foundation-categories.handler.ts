import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    FoundationCategoryEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    FoundationCategoriesQuery,
} from "./foundation-categories.query"

/**
 * Lists foundation categories from Elasticsearch (locale index).
 */
@QueryHandler(FoundationCategoriesQuery)
@Injectable()
export class FoundationCategoriesHandler
    extends ICQRSHandler<FoundationCategoriesQuery, Array<FoundationCategoryEntity>>
    implements IQueryHandler<FoundationCategoriesQuery, Array<FoundationCategoryEntity>> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: FoundationCategoriesQuery,
    ): Promise<Array<FoundationCategoryEntity>> {
        const {
            locale,
        } = query.params

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
        })

        const response = await this.elasticsearch.client.search<FoundationCategoryEntity>({
            index: this.elasticsearch.indicateName({
                entity: FoundationCategoryEntity.name,
                locale,
            }),
            query: esQuery,
            sort: [
                {
                    orderIndex: {
                        order: "asc",
                    },
                },
            ],
            size: 1000,
        })

        return response.hits.hits.map(
            (hit) => hit._source as FoundationCategoryEntity,
        )
    }
}
