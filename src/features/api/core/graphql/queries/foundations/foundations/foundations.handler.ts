import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    FoundationEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    estypes,
} from "@elastic/elasticsearch"
import {
    SortOrder,
} from "@modules/api"
import {
    FoundationsQuery,
} from "./foundations.query"
import {
    FoundationsFilters,
    FoundationsResponseData,
    FoundationsSortBy,
} from "./graphql-types"

/**
 * Handles the foundations query (Elasticsearch, filtered by category).
 */
@QueryHandler(FoundationsQuery)
@Injectable()
export class FoundationsHandler
    extends ICQRSHandler<FoundationsQuery, FoundationsResponseData>
    implements IQueryHandler<FoundationsQuery, FoundationsResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: FoundationsQuery,
    ): Promise<FoundationsResponseData> {
        const {
            request: {
                categoryId,
                filters,
            },
            locale,
        } = query.params
        const resolvedFilters: FoundationsFilters = filters ?? {
            sorts: [
                {
                    by: FoundationsSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
        }
        const {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts = [
                {
                    by: FoundationsSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            search,
        } = resolvedFilters

        const sort = sorts.map((sortItem) => ({
            [sortItem.by]: {
                order: sortItem.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "categoryId.keyword": categoryId,
                    },
                },
            ],
            search,
            searchFields: [
                "title^3",
                "description^2",
                "author",
                "value",
            ],
        })

        const response = await this.elasticsearch.client.search<FoundationEntity>({
            index: this.elasticsearch.indicateName({
                entity: FoundationEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map(
            (hit) => hit._source as FoundationEntity,
        )

        return {
            count,
            data,
        }
    }
}
