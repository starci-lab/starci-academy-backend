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
    CoursesInput,
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
     * Entry: returns a page of courses ordered by sort input.
     *
     * @param input - Pagination and sort options
     * @param input.filters.limit - Number of courses to return
     * @param input.filters.pageNumber - Page number
     * @param input.filters.sorts - Sorts
     * @param input.filters.sorts.by - Sort by
     * @param input.filters.sorts.order - Sort order
     * @returns Paginated courses
     */
    async execute({
        filters: {
            limit = envConfig().services.api.pagination.page.limit,
            pageNumber = 0,
            sorts,
        },
    }: CoursesInput): Promise<CoursesResponseData> {
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
