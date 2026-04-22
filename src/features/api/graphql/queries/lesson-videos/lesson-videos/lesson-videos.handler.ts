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
            search,
            searchFields: ["title^3", "description", "caption"],
        })

        const {
            data,
            count,
        } = await this.elasticsearch.search<LessonVideoEntity>(
            LessonVideoEntity.name,
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
