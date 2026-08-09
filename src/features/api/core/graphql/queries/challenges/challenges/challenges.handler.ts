import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
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
    ChallengesQuery,
} from "./challenges.query"
import {
    ChallengesResponseData,
} from "./graphql-types/response"
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

        // `title` is analysed `text` -- sort on its `keyword` sub-field or ES rejects the
        // search with `Fielddata is disabled on [title]`.
        const sort = sorts.map((sort) => ({
            [resolveSortField(sort.by)]: {
                order: sort.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        // contentId is mapped as a pure keyword -> query it directly (no `.keyword` subfield)
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
