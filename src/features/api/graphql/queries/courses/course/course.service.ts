import {
    CourseEntity,
    InjectPrimaryPostgresqlEntityManager,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseRequest,
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
     * Entry: returns one course by primary id.
     *
     * @param request - Wrapper with course id
     * @param request.id - Course id
     * @throws {CourseNotFoundException} When no course exists for `id`.
     */
    async execute({
        id,
    }: CourseRequest): Promise<CourseEntity> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id,
                },
                relations: {
                    prerequisites: true,
                    qnas: true,
                    modules: {
                        generalContent: true,
                        advancedContent: true,
                    },
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id,
                }
            )
        }
        return course
    }
}
