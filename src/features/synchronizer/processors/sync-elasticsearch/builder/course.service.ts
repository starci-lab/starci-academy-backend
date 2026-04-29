import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    CourseResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    LivestreamSessionEntity,
    Locale,
    ModuleEntity,
    PrerequisiteEntity,
    PreviewContentEntity,
    PricingPhaseEntity,
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
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    AsyncService 
} from "@modules/mixin"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"
/**
 * Loads the full course graph from PostgreSQL and materializes **per-locale** plain objects
 * (after `CourseResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchCourseBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseResolver: CourseResolverService,
        private readonly asyncService: AsyncService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed course tree.
     */
    async buildMultilingualByCourseId(
        courseId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<CourseEntity>>> {
        const hydratedCourse = await this.loadHydratedCoursePlain(
            courseId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const clonedCourse = _.cloneDeep(hydratedCourse)
                this.courseResolver.transform(
                    clonedCourse,
                    locale,
                )
                return {
                    locale,
                    entity: clonedCourse,
                }
            },
        )
    }
    /**
     * Loads the hydrated course plain object from PostgreSQL.
     * @param id - The course id.
     * @returns The hydrated course plain object.
     */
    private async loadHydratedCoursePlain(
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
            throw new CourseNotFoundException(
                {
                    id,
                }
            )
        }
        const hydratedCourse = course.toPlain<CourseEntity>()
        const prerequisites = await this.entityManager.find(
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
        )
        const hydratedPrerequisites = prerequisites.map(
            (
                prerequisite,
            ) => prerequisite.toPlain<PrerequisiteEntity>()
        )
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
        const hydratedValuePropositions = valuePropositions.map(
            (
                valueProposition,
            ) => valueProposition.toPlain<ValuePropositionEntity>()
        )
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
        const hydratedQnas = qnas.map(
            (
                qna,
            ) => qna.toPlain<QnaEntity>()
        )
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
        const hydratedPricingPhases = pricingPhases.map(
            (
                pricingPhase,
            ) => pricingPhase.toPlain<PricingPhaseEntity>()
        )
        hydratedCourse.pricingPhases = hydratedPricingPhases
        const livestreamSessions = await this.entityManager.find(
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
        )
        const hydratedLivestreamSessions = livestreamSessions.map(
            (
                livestreamSession,
            ) => livestreamSession.toPlain<LivestreamSessionEntity>()
        )
        hydratedCourse.livestreamSessions = hydratedLivestreamSessions
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
        const hydratedModules = await this.asyncService.allMustDone(
            modules.map(
                async (
                    module,
                ) => {
                    const hydratedModule = module.toPlain<ModuleEntity>()
                    const hydratedContents = await this.entityManager.find(
                        ContentEntity,
                        {
                            where: {
                                module: {
                                    id: hydratedModule.id,
                                },
                            },
                            relations: {
                                translations: true,
                                lessons: {
                                    translations: true,
                                },
                                challenges: {
                                    translations: true,
                                },
                            },
                            order: {
                                orderIndex: "ASC",
                            },
                        },
                    )
                    hydratedModule.contents = hydratedContents.map(
                        (
                            content,
                        ) => {
                            const hydratedContent = content.toPlain<ContentEntity>()
                            hydratedContent.lessons = content.lessons?.map(
                                (
                                    lessonVideo,
                                ) => lessonVideo.toPlain<LessonVideoEntity>()
                            )
                            hydratedContent.challenges = content.challenges?.map(
                                (
                                    challenge,
                                ) => challenge.toPlain<ChallengeEntity>()
                            )
                            return hydratedContent
                        },
                    )
                    const hydratedPreviewContents = await this.entityManager.find(
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
                    )
                    hydratedModule.previewContents = hydratedPreviewContents.map(
                        (
                            previewContent,
                        ) => previewContent.toPlain<PreviewContentEntity>()
                    )
                    return hydratedModule
                },
            ),
        )
        hydratedCourse.modules = hydratedModules
        return hydratedCourse
    }

    /**
     * Builds the index by course id.
     * @param id - The course id.
     * @returns The index by course id.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByCourseId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: CourseEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
