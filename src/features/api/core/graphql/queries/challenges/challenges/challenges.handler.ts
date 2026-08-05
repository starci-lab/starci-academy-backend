import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ChallengeEntity,
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
    ChallengesQuery,
} from "./challenges.query"
import {
    ChallengesResponseData,
} from "./graphql-types"
import {
    estypes,
} from "@elastic/elasticsearch"

@QueryHandler(ChallengesQuery)
@Injectable()
/**
 * Paginated challenges for one content item, read from the locale Elasticsearch
 * index (not Postgres). `contentId` is a keyword term; title is boosted over
 * description in the shared search builder.
 */
export class ChallengesHandler
    extends ICQRSHandler<ChallengesQuery, ChallengesResponseData>
    implements IQueryHandler<ChallengesQuery, ChallengesResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: ChallengesQuery,
    ): Promise<ChallengesResponseData> {
        const {
            request: {
                contentId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        } = query.params

        const sort = sorts.map((sort) => ({
            [sort.by]: {
                order: sort.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        // contentId is mapped as a pure keyword → query it directly (no `.keyword` subfield)
                        contentId,
                    },
                },
            ],
            searchFields: [
                "title^3",
                "description"
            ],
        })

        const response = await this.elasticsearch.client.search<ChallengeEntity>({
            index: this.elasticsearch.indicateName({
                entity: ChallengeEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as ChallengeEntity)

        return {
            count,
            data,
        }
    }
}
