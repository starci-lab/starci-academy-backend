import {
    CourseEntity,
    CourseResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
    Locale,
    ModuleEntity,
    PrerequisiteEntity,
    PricingPhaseEntity,
    QnaEntity,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
    ValuePropositionEntity,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import _ from "lodash"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "../elasticsearch.service"

/**
 * Indexes a course and related graph to Elasticsearch (Vi + En), with sync-state guards.
 * Shared by the Elasticsearch synchronizer runtime and the sync-elasticsearch Bull worker.
 */
@Injectable()
export class ElasticsearchEntityCoursesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearch: ElasticsearchService,
        private readonly syncStateService: SyncStateService,
        private readonly courseResolver: CourseResolverService,
    ) {
    }

    /**
     * Load the course, optionally skip via sync state, then index all locales.
     */
    async indexById(
        id: string,
    ): Promise<void> {
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
                },
            )
        }

        const sourceUpdatedAt = course.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.Elasticsearch,
                sourceType: SyncStateSourceType.Course,
                sourceId: id,
                sourceUpdatedAt,
            },
        )
        if (!shouldSync) {
            return
        }

        try {
            const plainCourse = course.toPlain<CourseEntity>()

            const prerequisites = await this.entityManager.find(
                PrerequisiteEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            const hydratedPrerequisites = prerequisites?.map(
                (
                    prerequisite,
                ) => prerequisite.toPlain<PrerequisiteEntity>(),
            )

            const valuePropositions = await this.entityManager.find(
                ValuePropositionEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
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
            const hydratedValuePropositionProps = valuePropositions?.map(
                (
                    valueProposition,
                ) => valueProposition.toPlain<ValuePropositionEntity>(),
            )

            const qnas = await this.entityManager.find(
                QnaEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
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
            const hydratedQnas = qnas?.map(
                (
                    qna,
                ) => qna.toPlain<QnaEntity>(),
            )

            const pricingPhases = await this.entityManager.find(
                PricingPhaseEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    select: {
                        id: true,
                        phase: true,
                        price: true,
                        slotAvailable: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            const hydratedPricingPhases = pricingPhases?.map(
                (
                    pricingPhase,
                ) => pricingPhase.toPlain<PricingPhaseEntity>(),
            )

            const livestreamSessions = await this.entityManager.find(
                LivestreamSessionEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    select: {
                        id: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            const hydratedLivestreamSessions = livestreamSessions?.map(
                (
                    livestreamSession,
                ) => livestreamSession.toPlain<LivestreamSessionEntity>(),
            )

            const modules = await this.entityManager.find(
                ModuleEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
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
            const hydratedModules = modules?.map(
                (
                    module,
                ) => module.toPlain<ModuleEntity>(),
            )

            plainCourse.prerequisites = hydratedPrerequisites
            plainCourse.valuePropositions = hydratedValuePropositionProps
            plainCourse.qnas = hydratedQnas
            plainCourse.pricingPhases = hydratedPricingPhases
            plainCourse.livestreamSessions = hydratedLivestreamSessions
            plainCourse.modules = hydratedModules

            const locales = [
                Locale.Vi,
                Locale.En,
            ]
            await Promise.all(
                locales.map(
                    async (
                        locale,
                    ) => {
                        const hydratedCourse = _.cloneDeep(
                            plainCourse,
                        )

                        this.courseResolver.transform(
                            hydratedCourse,
                            locale,
                        )

                        const dataToIndex = _.omit(
                            hydratedCourse,
                            ["translations"],
                        )

                        const indexedData = {
                            ...dataToIndex,
                            locale,
                            prerequisites: hydratedCourse.prerequisites?.map(
                                p => ({
                                    id: p.id, 
                                }),
                            ),
                            valuePropositions: hydratedCourse.valuePropositions?.map(
                                v => ({
                                    id: v.id, 
                                }),
                            ),
                            qnas: hydratedCourse.qnas?.map(
                                q => ({
                                    id: q.id, 
                                }),
                            ),
                            pricingPhases: hydratedCourse.pricingPhases?.map(
                                p => ({
                                    id: p.id, 
                                }),
                            ),
                            livestreamSessions: hydratedCourse.livestreamSessions?.map(
                                l => ({
                                    id: l.id, 
                                }),
                            ),
                            modules: hydratedCourse.modules?.map(
                                m => ({
                                    id: m.id, 
                                }),
                            ),
                        }

                        await this.elasticsearch.indexEntity(
                            CourseEntity,
                            indexedData,
                            `${hydratedCourse.id}-${locale}`,
                        )
                    },
                ),
            )

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Course,
                    sourceId: id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.Elasticsearch,
                    sourceType: SyncStateSourceType.Course,
                    sourceId: id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
