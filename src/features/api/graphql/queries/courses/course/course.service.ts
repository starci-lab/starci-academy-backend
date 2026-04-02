import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
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
import {
    ExecuteParams,
} from "../../../../types"
import {
    CourseTransformerService,
} from "../../../utils"

/**
 * Loads a single course from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CourseService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseTransformer: CourseTransformerService,
    ) { }

    /**
     * Entry: returns one course by primary id.
     *
     * @param request - Wrapper with course id
     * @param request.id - Course id
     * @throws {CourseNotFoundException} When no course exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<CourseRequest>,
    ): Promise<CourseEntity> {
        const {
            id,
            displayId,
        } = request
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    ...(id && {
                        id 
                    }),
                    ...(displayId && {
                        displayId 
                    }),
                },
                /**
                 * Nested relations load children in one query tree (not entity `cascade`,
                 * which only applies to persist operations).
                 */
                relations: {
                    translations: true,
                    prerequisites: {
                        translations: true,
                    },
                    valuePropositions: {
                        translations: true,
                    },
                    qnas: {
                        translations: true,
                    },
                    pricingPhases: true,
                    modules: {
                        translations: true,
                        previewContents: {
                            translations: true,
                        },
                    },
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    ...(
                        id && {
                            id 
                        }
                    ),
                    ...(
                        displayId && {
                            displayId 
                        }
                    ),
                }
            )
        }
        for (const mod of course.modules ?? []) {
            mod.contents = []
            mod.lessonVideos = []
            mod.challenges = []
        }
        return this.courseTransformer.transform(
            course,
            locale,
        )
    }
}
