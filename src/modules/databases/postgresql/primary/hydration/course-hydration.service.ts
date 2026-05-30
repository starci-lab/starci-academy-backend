import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AsyncService,
} from "@modules/mixin"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LivestreamSessionEntity,
    ModuleEntity,
    PrerequisiteEntity,
    PreviewContentEntity,
    PricingPhaseEntity,
    QnaEntity,
    ValuePropositionEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/exceptions"

@Injectable()
export class CourseHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly asyncService: AsyncService,
    ) { }

    async loadById(
        id: string,
    ): Promise<CourseEntity> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    metadata: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException({
                id,
            })
        }
        const hydratedCourse = course.toPlain<CourseEntity>()
        const [
            prerequisites,
            valuePropositions,
            qnas,
            pricingPhases,
            livestreamSessions,
            modules,
        ] = await Promise.all([
            this.entityManager.find(
                PrerequisiteEntity,
                {
                    where: {
                        course: {
                            id: hydratedCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                },
            ),
            this.entityManager.find(
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
            ),
            this.entityManager.find(
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
            ),
            this.entityManager.find(
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
            ),
            this.entityManager.find(
                LivestreamSessionEntity,
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
            ),
            this.entityManager.find(
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
            ),
        ])
        const hydratedModules = await this.asyncService.allMustDone(
            modules.map(
                async (module) => {
                    const hydratedModule = module.toPlain<ModuleEntity>()
                    const [
                        hydratedContents,
                        hydratedPreviewContents,
                    ] = await Promise.all([
                        this.entityManager.find(
                            ContentEntity,
                            {
                                where: {
                                    module: {
                                        id: hydratedModule.id,
                                    },
                                },
                                relations: {
                                    translations: true,
                                    challenges: {
                                        translations: true,
                                    },
                                },
                                order: {
                                    orderIndex: "ASC",
                                },
                            },
                        ),
                        this.entityManager.find(
                            PreviewContentEntity,
                            {
                                where: {
                                    module: {
                                        id: hydratedModule.id,
                                    },
                                },
                                relations: {
                                    translations: true,
                                },
                                order: {
                                    orderIndex: "ASC",
                                },
                            },
                        ),
                    ])
                    hydratedModule.contents = hydratedContents.map(
                        (content) => {
                            const hydratedContent = content.toPlain<ContentEntity>()
                            hydratedContent.challenges = content.challenges?.map(
                                (challenge) => challenge.toPlain<ChallengeEntity>(),
                            )
                            return hydratedContent
                        },
                    )
                    hydratedModule.previewContents = hydratedPreviewContents.map(
                        (previewContent) => previewContent.toPlain<PreviewContentEntity>(),
                    )
                    return hydratedModule
                },
            ),
        )
        hydratedCourse.prerequisites = prerequisites.map(
            (prerequisite) => prerequisite.toPlain<PrerequisiteEntity>(),
        )
        hydratedCourse.valuePropositions = valuePropositions.map(
            (valueProposition) => valueProposition.toPlain<ValuePropositionEntity>(),
        )
        hydratedCourse.qnas = qnas.map(
            (qna) => qna.toPlain<QnaEntity>(),
        )
        hydratedCourse.pricingPhases = pricingPhases.map(
            (pricingPhase) => pricingPhase.toPlain<PricingPhaseEntity>(),
        )
        hydratedCourse.livestreamSessions = livestreamSessions.map(
            (livestreamSession) => livestreamSession.toPlain<LivestreamSessionEntity>(),
        )
        hydratedCourse.modules = hydratedModules
        return hydratedCourse
    }
}
