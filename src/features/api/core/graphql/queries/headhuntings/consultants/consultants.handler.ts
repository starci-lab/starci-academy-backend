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
    ConsultantContactGateService,
} from "@modules/bussiness"
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
        private readonly consultantContactGateService: ConsultantContactGateService,
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
            user,
        } = query.params
        const resolvedFilters: ConsultantsFilters = filters ?? {
            sorts: [
                {
                    by: ConsultantsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
        }
        const {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts = [
                {
                    by: ConsultantsSortBy.SortIndex,
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
                        // companyId is mapped as a pure keyword → query it directly (no `.keyword` subfield)
                        companyId,
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

        // gate contact fields server-side by the viewer's best CV score, using
        // one score lookup for the whole page rather than per-consultant
        const bestCvScore = await this.consultantContactGateService.getBestCvScore({
            userId: user?.id,
        })
        this.consultantContactGateService.gateConsultants(
            data,
            bestCvScore,
        )

        return {
            count,
            data,
        }
    }
}
