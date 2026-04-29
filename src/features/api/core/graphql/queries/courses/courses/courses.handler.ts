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
    estypes,
} from "@elastic/elasticsearch"
import {
    CoursesQuery,
} from "./courses.query"
import {
    CoursesResponseData,
} from "./graphql-types"

/**
 * Handles the courses query.
 */
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

    /**
     * Processes the courses query.
     * @param query - The courses query.
     * @returns The courses response data.
     */
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

        const sort = sorts.map((sort) => ({
            [sort.by]: {
                order: sort.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            search,
            searchFields: [
                "title^3",
                "description"
            ],
        })

        const response = await this.elasticsearch.client.search<CourseEntity>({
            index: this.elasticsearch.indicateName({
                entity: CourseEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as CourseEntity)

        return {
            count,
            data,
        }
    }
}
