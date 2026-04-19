import {
    BadRequestException,
} from "@nestjs/common"
import {
    ICqrsHandler,
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
    ChallengesResponseData,
} from "@features/api/graphql/queries/challenges/challenges/graphql-types"
import {
    ChallengesQuery,
} from "./challenges.query"

export class ChallengesHandler extends ICqrsHandler<ChallengesResponseData> {
    constructor(
        private readonly query: ChallengesQuery,
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected async validate(): Promise<void> {
        if (!this.query.params.request.moduleId?.trim()) {
            throw new BadRequestException("moduleId is required")
        }
    }

    protected async process(): Promise<ChallengesResponseData> {
        const {
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
        } = this.query.params

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
            search,
            searchFields: [
                "title^3",
                "description",
                "requirements",
            ],
        })

        const { data, count } = await this.elasticsearch.search<ChallengeEntity>(
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
