import {
    CourseEntity,
    InjectPrimaryPostgresqlEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseRequest,
    CourseResponseData,
} from "./graphql-types"

/**
 * Loads a single course from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CourseService {
    constructor(
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Entry: returns one course by primary id, or null when missing.
     *
     * @param request - Wrapper with course id
     * @param request.filters.id - Course id
     */
    async execute({
        id,
    }: CourseRequest): Promise<CourseResponseData> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id,
                },
            },
        )
        return {
            data: course,
        }
    }
}
