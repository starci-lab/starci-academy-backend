import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
    FindOptionsOrder,
} from "typeorm"
import {
    CoursesRequest,
    CoursesResponseData,
} from "./graphql-types"
import {
    envConfig 
} from "@modules/env"
import {
    CourseTransformerService,
} from "../../../utils"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Loads courses from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CoursesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseTransformer: CourseTransformerService,
    ) {}

    /**
     * Entry: returns a page of courses ordered by sort request.
     *
     * @param params - The parameters for the courses service.
     * @param params.locale - The locale to use for the translations.
     * @param params.request - Pagination and sort options
     * @param params.request.filters.limit - Number of courses to return
     * @param params.request.filters.pageNumber - Page number
     * @param params.request.filters.sorts - Sorts
     * @param params.request.filters.sorts.by - Sort by
     * @param params.request.filters.sorts.order - Sort order
     * @returns Paginated courses
     */
    async execute({
        request: {
            filters: {
                limit = envConfig().services.api.pagination.page.limit,
                pageNumber = 0,
                sorts,
            },
        },
        locale,
    }: ExecuteParams<CoursesRequest>): Promise<CoursesResponseData> {
        const order: FindOptionsOrder<CourseEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by] = sort.order
        }
        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            CourseEntity,
            {
                order,
                relations: {
                    pricingPhases: true,
                    valuePropositions: true,
                },
                take: limit,
                skip: pageNumber * limit,
            },
        )
        return {
            count,
            data: data.map((course) => this.courseTransformer.transform(
                course,
                locale
            )
            ),
        }
    }
}
