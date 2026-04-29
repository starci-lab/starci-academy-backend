import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    LessonVideoEntity,
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
    LessonVideosQuery,
} from "./lesson-videos.query"
import {
    LessonVideosResponseData,
} from "./graphql-types"
import {
    estypes,
} from "@elastic/elasticsearch"

@QueryHandler(LessonVideosQuery)
@Injectable()
export class LessonVideosHandler
    extends ICQRSHandler<LessonVideosQuery, LessonVideosResponseData>
    implements IQueryHandler<LessonVideosQuery, LessonVideosResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: LessonVideosQuery,
    ): Promise<LessonVideosResponseData> {
        const {
            request: {
                contentId,
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
                        "contentId.keyword": contentId,
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
                "caption"],
        })

        const response = await this.elasticsearch.client.search<LessonVideoEntity>({
            index: this.elasticsearch.indicateName({
                entity: LessonVideoEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as LessonVideoEntity)

        return {
            count,
            data,
        }
    }
}
