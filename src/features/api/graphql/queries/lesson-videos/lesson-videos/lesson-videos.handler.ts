import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    LessonVideoEntity,
    ScyllaDBService,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    ScyllaSyncTables,
} from "@features/scylladb-synchronizer/sync/tables"
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
    executeElasticScyllaFallback,
    searchScyllaLocalizedDocuments,
} from "../../utils/read-policy-fallback.util"

@QueryHandler(LessonVideosQuery)
@Injectable()
export class LessonVideosHandler
    extends ICQRSHandler<LessonVideosQuery, LessonVideosResponseData>
    implements IQueryHandler<LessonVideosQuery, LessonVideosResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly scylladb: ScyllaDBService,
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
            searchFields: ["title^3",
                "description",
                "caption"],
        })

        const {
            data,
            count,
        } = await executeElasticScyllaFallback({
            elasticsearch: () => this.elasticsearch.search<LessonVideoEntity>(
                LessonVideoEntity.name,
                {
                    query: esQuery,
                    sort,
                    from: pageNumber * limit,
                    size: limit,
                },
            ),
            scylladb: () => searchScyllaLocalizedDocuments<LessonVideoEntity>({
                scylladb: this.scylladb,
                tableName: ScyllaSyncTables.lessonVideos,
                locale,
                limit,
                pageNumber,
                sorts,
                search,
                searchFields: ["title",
                    "description",
                    "caption"],
                exactFilters: {
                    contentId,
                },
            }),
        })

        return {
            count,
            data,
        }
    }
}
