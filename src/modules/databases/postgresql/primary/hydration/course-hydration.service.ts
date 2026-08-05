import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AsyncService,
} from "@modules/lib/mixin/async.service"
import {
    ChallengeEntity,
} from "../entities/challenge.entity"
import {
    ContentEntity,
} from "../entities/content.entity"
import {
    CourseEntity,
} from "../entities/course.entity"
import {
    LivestreamSessionEntity,
} from "../entities/livestream-session.entity"
import {
    ModuleEntity,
} from "../entities/module.entity"
import {
    PrerequisiteEntity,
} from "../entities/prerequisite.entity"
import {
    PreviewContentEntity,
} from "../entities/preview-content.entity"
import {
    PricingPhaseEntity,
} from "../entities/pricing-phase.entity"
import {
    QnaEntity,
} from "../entities/qna.entity"
import {
    ValuePropositionEntity,
} from "../entities/value-proposition.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"

@Injectable()
/**
 * Loads a course graph (modules, pricing, livestreams, QnA, ...) for CDN/API
 * so downstream resolvers share one relation contract instead of N+1 joins.
 */
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
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
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
                                    sortIndex: "ASC",
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
                                    sortIndex: "ASC",
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
