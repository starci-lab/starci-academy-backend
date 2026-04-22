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
    executeElasticScyllaFallback,
} from "../../utils/read-policy-fallback.util"

@QueryHandler(ChallengesQuery)
@Injectable()
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

        const sort = sorts.map((s) => ({
            [s.by]: {
                order: s.order.toLowerCase(),
            },
        }))

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "contentId.keyword": contentId,
                    },
                },
                {
                    term: {
                        locale,
                    },
                },
            ],
            searchFields: ["title^3",
                "description"],
        })

        const {
            data,
            count,
        } = await executeElasticScyllaFallback({
            elasticsearch: () => this.elasticsearch.search<ChallengeEntity>(
                ChallengeEntity.name,
                {
                    query: esQuery,
                    sort,
                    from: pageNumber * limit,
                    size: limit,
                },
            ),
        })

        return {
            count,
            data,
        }
    }
}
