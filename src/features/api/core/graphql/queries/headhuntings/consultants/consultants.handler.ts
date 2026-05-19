import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ConsultantEntity,
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
    ConsultantsQuery,
} from "./consultants.query"
import {
    ConsultantsFilters,
    ConsultantsResponseData,
    ConsultantsSortBy,
} from "./graphql-types"

/**
 * Handles the Headhunters query (Elasticsearch, filtered by category).
 */
@QueryHandler(ConsultantsQuery)
@Injectable()
export class ConsultantsHandler
    extends ICQRSHandler<ConsultantsQuery, ConsultantsResponseData>
    implements IQueryHandler<ConsultantsQuery, ConsultantsResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: ConsultantsQuery,
    ): Promise<ConsultantsResponseData> {
        const {
            request: {
                companyId,
                filters,
            },
            locale,
        } = query.params
        const resolvedFilters: ConsultantsFilters = filters ?? {
            sorts: [
                {
                    by: ConsultantsSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
        }
        const {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts = [
                {
                    by: ConsultantsSortBy.OrderIndex,
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
                        "companyId.keyword": companyId,
                    },
                },
            ],
            search,
            searchFields: [
                "fullName^3",
                "description^2",
                "jobTitle",
                "linkedinUrl",
            ],
        })

        const response = await this.elasticsearch.client.search<ConsultantEntity>({
            index: this.elasticsearch.indicateName({
                entity: ConsultantEntity.name,
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
            (hit) => hit._source as ConsultantEntity,
        )

        return {
            count,
            data,
        }
    }
}
