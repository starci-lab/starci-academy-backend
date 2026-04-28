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
    ContentsQuery,
} from "./contents.query"
import {
    ContentsResponseData,
} from "./graphql-types"
import {
    executeElasticScyllaFallback,
} from "../../utils/read-policy-fallback.util"

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
            searchFields: ["title^3",
                "description",
                "body"],
        })

        const {
            data,
            count,
        } = await executeElasticScyllaFallback({
            elasticsearch: () => this.elasticsearch.search<ContentEntity>(
                {
                    entityName: ContentEntity.name,
                    locale,
                    params: {
                        query: esQuery,
                        sort,
                        from: pageNumber * limit,
                        size: limit,
                    },
                },
            ),
        })
        return {
            count,
            data,
        }
    }
}
