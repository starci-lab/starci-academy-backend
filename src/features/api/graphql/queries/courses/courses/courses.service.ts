import {
    CourseEntity,
    InjectPrimaryPostgresqlEntityManager,
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

/**
 * Loads courses from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CoursesService {
    constructor(
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Entry: returns a page of courses ordered by sort request.
     *
     * @param request - Pagination and sort options
     * @param request.filters.limit - Number of courses to return
     * @param request.filters.pageNumber - Page number
     * @param request.filters.sorts - Sorts
     * @param request.filters.sorts.by - Sort by
     * @param request.filters.sorts.order - Sort order
     * @returns Paginated courses
     */
    async execute({
        filters: {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts,
        },
    }: CoursesRequest): Promise<CoursesResponseData> {
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
            data,
        }
    }
}
