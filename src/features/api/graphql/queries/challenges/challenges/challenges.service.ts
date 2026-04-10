import {
    ChallengeEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    ExecuteParams,
} from "../../../../types"
import {
    ChallengesRequest,
    ChallengesResponseData
} from "./graphql-types"

/**
 * Lists module challenges from Elasticsearch for GraphQL.
 */
@Injectable()
export class ChallengesService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    async execute(
        {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search,
                },
            },
            locale,
        }: ExecuteParams<ChallengesRequest>,
    ): Promise<ChallengesResponseData> {
        const sort = sorts.map(s => ({
            [s.by]: {order: s.order.toLowerCase()},
        }))
        const query = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "moduleId.keyword": moduleId,
                    },
                },
                {
                    term: {
                        "locale": locale,
                    },
                },
            ],
            search,
            searchFields: ["title^3", "description", "requirements"],
        });

        const { data, count } = await this.elasticsearch.search<ChallengeEntity>(
            ChallengeEntity.name,
            {
                query,
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
