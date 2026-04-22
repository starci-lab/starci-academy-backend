import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    CourseEntity,
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
    CoursesQuery,
} from "./courses.query"
import {
    CoursesResponseData,
} from "./graphql-types"

@QueryHandler(CoursesQuery)
@Injectable()
export class CoursesHandler
    extends ICQRSHandler<CoursesQuery, CoursesResponseData>
    implements IQueryHandler<CoursesQuery, CoursesResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
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
        } = await this.elasticsearch.search<CourseEntity>(
            CourseEntity.name,
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
