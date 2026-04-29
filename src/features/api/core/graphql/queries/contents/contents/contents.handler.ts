import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ContentEntity,
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
    ContentsQuery,
} from "./contents.query"
import {
    ContentsResponseData,
} from "./graphql-types"

@QueryHandler(ContentsQuery)
@Injectable()
export class ContentsHandler
    extends ICQRSHandler<ContentsQuery, ContentsResponseData>
    implements IQueryHandler<ContentsQuery, ContentsResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: ContentsQuery,
    ): Promise<ContentsResponseData> {
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
                        "moduleId.keyword": moduleId,
                    },
                },
            ],
            search,
            searchFields: ["title^3",
                "description",
                "body"],
        })

        const response = await this.elasticsearch.client.search<ContentEntity>({
            index: this.elasticsearch.indicateName({
                entity: ContentEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as ContentEntity)
        return {
            count,
            data,
        }
    }
}
