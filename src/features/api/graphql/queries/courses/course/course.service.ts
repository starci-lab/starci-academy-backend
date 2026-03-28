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
    CourseInput,
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
     * @param input - Wrapper with course id
     * @param input.filters.id - Course id
     */
    async execute({
        filters: {
            id,
        },
    }: CourseInput): Promise<CourseResponseData> {
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
