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
import _ from "lodash"

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
        const hydratedCourse = _.cloneDeep(course)
        const prerequisites = await this.entityManager.find(
            PrerequisiteEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
            },
        )
        const hydratedPrerequisites = _.cloneDeep(prerequisites)
        hydratedCourse.prerequisites = hydratedPrerequisites
        const valuePropositions = await this.entityManager.find(
            ValuePropositionEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedValuePropositions = _.cloneDeep(valuePropositions)
        hydratedCourse.valuePropositions = hydratedValuePropositions
        const qnas = await this.entityManager.find(
            QnaEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedQnas = _.cloneDeep(qnas)
        hydratedCourse.qnas = hydratedQnas
        const pricingPhases = await this.entityManager.find(
            PricingPhaseEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedPricingPhases = _.cloneDeep(pricingPhases)
        hydratedCourse.pricingPhases = hydratedPricingPhases
        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                where: {
                    course: {
                        id: hydratedCourse.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedModules = _.cloneDeep(modules)
        for (const module of hydratedModules) {
            const previewContents = await this.entityManager.find(
                PreviewContentEntity,
                {
                    where: {
                        module: {
                            id: module.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            const hydratedPreviewContents = _.cloneDeep(previewContents)
            module.previewContents = hydratedPreviewContents
        }
        hydratedCourse.modules = _.cloneDeep(hydratedModules)
        return this.courseTransformer.transform(
            hydratedCourse,
            locale,
        )
    }
}
