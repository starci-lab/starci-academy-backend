import {
    CourseEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig 
} from "@modules/env"
import {
    ExecuteParams,
} from "../../../../types"
import {
    CoursesRequest,
    CoursesResponseData,
} from "./graphql-types"

/**
 * Loads courses from Elasticsearch for GraphQL.
 */
@Injectable()
export class CoursesService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Entry: returns a page of courses ordered by sort request from Elasticsearch.
     *
     * @param params - The parameters for the courses service.
     * @returns Paginated courses
     */
    async execute(
        {
            request: {
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search
                },
            },
            locale,
        }: ExecuteParams<CoursesRequest>,
    ): Promise<CoursesResponseData> {
        const sort = sorts.map(s => ({
            [s.by]: {order: s.order.toLowerCase()},
        }))
        const query = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "locale": locale,
                    },
                },
            ],
            search,
            searchFields: ["title^3", "description"],
        })

        const {data, count} = await this.elasticsearch.search<CourseEntity>(
            CourseEntity.name,
            {
                query,
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
