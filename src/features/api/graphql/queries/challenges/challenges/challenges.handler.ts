import {
    ICQRSHandler,
} from "@modules/bussiness"
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
                moduleId,
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
                        "moduleId.keyword": moduleId,
                    },
                },
                {
                    term: {
                        locale,
                    },
                },
            ],
            searchFields: ["title^3", "description"],
        })

        const {
            data,
            count,
        } = await this.elasticsearch.search<ChallengeEntity>(
            ChallengeEntity.name,
            {
                query: esQuery,
                sort,
                from: pageNumber * limit,
                size: limit,
            },
        )

        return {
            count,
            data,
        }
    }
}
