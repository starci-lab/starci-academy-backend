import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    CourseEntity,
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
    CoursesQuery,
} from "./courses.query"
import {
    CoursesResponseData,
} from "./graphql-types"
import {
    executeElasticScyllaFallback,
    searchScyllaLocalizedDocuments,
} from "../../utils/read-policy-fallback.util"

@QueryHandler(CoursesQuery)
@Injectable()
export class CoursesHandler
    extends ICQRSHandler<CoursesQuery, CoursesResponseData>
    implements IQueryHandler<CoursesQuery, CoursesResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly scylladb: ScyllaDBService,
    ) {
        super()
    }

    protected override async process(
        query: CoursesQuery,
    ): Promise<CoursesResponseData> {
        const {
            request: {
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
                        locale,
                    },
                },
            ],
            search,
            searchFields: ["title^3",
                "description"],
        })

        const {
            data,
            count,
        } = await executeElasticScyllaFallback({
            elasticsearch: () => this.elasticsearch.search<CourseEntity>(
                CourseEntity.name,
                {
                    query: esQuery,
                    sort,
                    from: pageNumber * limit,
                    size: limit,
                },
            ),
            scylladb: () => searchScyllaLocalizedDocuments<CourseEntity>({
                scylladb: this.scylladb,
                tableName: ScyllaSyncTables.courses,
                locale,
                limit,
                pageNumber,
                sorts,
                search,
                searchFields: ["title",
                    "description"],
            }),
        })

        return {
            count,
            data,
        }
    }
}
