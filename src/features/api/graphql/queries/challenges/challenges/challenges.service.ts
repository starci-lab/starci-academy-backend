import {
    ChallengeEntity,
    Locale
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
    ChallengeTransformerService,
} from "../../../utils"
import {
    ChallengesRequest,
    ChallengesResponseData
} from "./graphql-types"

/**
 * Lists module challenges from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class ChallengesService {
    constructor(
        private readonly challengeTransformer: ChallengeTransformerService,
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

        for (const challenge of data) {
          this.challengeTransformer.transform(
            challenge,
            locale,
            challenge.defaultLocale ?? Locale.En,
          );
        }

        return {
            count,
            data,
        }
    }
}
