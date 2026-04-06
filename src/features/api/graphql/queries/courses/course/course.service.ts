import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
    PreviewContentEntity,
    PricingPhaseEntity,
    PrerequisiteEntity,
    QnaEntity,
    ValuePropositionEntity,
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
                        id,
                    }),
                    ...(displayId && {
                        displayId,
                    }),
                },
                relations: {
                    metadata: true,
                    translations: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    ...(
                        id && {
                            id,
                        }
                    ),
                    ...(
                        displayId && {
                            displayId,
                        }
                    ),
                },
            )
        }
        const courseId = course.id
        const prerequisites = await this.entityManager.find(
            PrerequisiteEntity,
            {
                where: {
                    courseId,
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const valuePropositions = await this.entityManager.find(
            ValuePropositionEntity,
            {
                where: {
                    courseId,
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const qnas = await this.entityManager.find(
            QnaEntity,
            {
                where: {
                    courseId,
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const pricingPhases = await this.entityManager.find(
            PricingPhaseEntity,
            {
                where: {
                    courseId,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                where: {
                    courseId,
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        for (const module of modules) {
            module.previewContents = await this.entityManager.find(
                PreviewContentEntity,
                {
                    where: {
                        moduleId: module.id,
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
        }
        course.prerequisites = prerequisites
        course.valuePropositions = valuePropositions
        course.qnas = qnas
        course.pricingPhases = pricingPhases
        course.modules = modules
        return this.courseTransformer.transform(
            course,
            locale,
        )
    }
}
