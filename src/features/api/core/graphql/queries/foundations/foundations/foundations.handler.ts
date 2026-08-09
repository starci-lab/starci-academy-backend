import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    ElasticsearchQueryBuilder,
} from "@modules/integrations/elasticsearch/utils/query-builder"
import {
    resolveSortField,
} from "@modules/integrations/elasticsearch/utils/sort"
import {
    envConfig,
} from "@modules/platform/env/config"
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
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
import {
    FoundationsQuery,
} from "./foundations.query"
import {
    FoundationsFilters,
    FoundationsSortBy,
} from "./graphql-types/request"
import {
    FoundationsResponseData,
} from "./graphql-types/response"

@QueryHandler(FoundationsQuery)
@Injectable()
/**
 * Handles the foundations query (Elasticsearch, filtered by category).
 */
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
                    by: FoundationsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
        }
        const {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts = [
                {
                    by: FoundationsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            search,
        } = resolvedFilters

        // `title` is analysed `text` -- sort on its `keyword` sub-field or ES rejects the
        // search with `Fielddata is disabled on [title]`.
        const sort = sorts.map((sortItem) => ({
            [resolveSortField(sortItem.by)]: {
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
