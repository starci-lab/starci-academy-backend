import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
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
    estypes,
} from "@elastic/elasticsearch"
import {
    CoursesQuery,
} from "./courses.query"
import {
    CoursesResponseData,
} from "./graphql-types/response"

@QueryHandler(CoursesQuery)
@Injectable()
/**
 * Handles the courses query.
 */
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

        // `title` is analysed `text` -- sort on its `keyword` sub-field or ES rejects the search
        // with `Fielddata is disabled on [title]`. This list sorts by title BY DEFAULT.
        const sort = sorts.map((sort) => ({
            [resolveSortField(sort.by)]: {
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
