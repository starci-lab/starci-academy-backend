import {
    envConfig,
} from "@modules/env"
import {
    AsyncService,
} from "@modules/mixin"
import {
    Inject,
    Injectable,
    Scope,
} from "@nestjs/common"
import {
    REQUEST,
} from "@nestjs/core"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
    ModuleEntity,
    PricingPhaseEntity,
    QnaEntity,
    Locale,
    ValuePropositionEntity,
    CourseEntity,
    PrerequisiteEntity,
    ScyllaDBService,
    SyncStateService,
    SyncStateSourceType,
    SyncStateTarget,
} from "@modules/databases"
import _ from "lodash"
import {
    CourseTransformerService,
} from "@features/api/graphql/utils"
import {
    EntityManager,
} from "typeorm"
import type {
    CourseRuntimeContextRequest,
} from "./types"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    ScyllaSyncTables,
} from "../tables"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class CourseRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: CourseRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly scylladb: ScyllaDBService,
        private readonly syncStateService: SyncStateService,
        private readonly courseTransformer: CourseTransformerService,
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => {
                        await this.process()
                    },
                )
            },
            envConfig().services.scylladbSynchronizer.syncIntervalMs.courses.runtime,
        )
    }

    /**
     * Sync the course to ScyllaDB.
     */
    async process() {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: this.request.id,
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
                    id: this.request.id,
                },
            )
        }

        const sourceUpdatedAt = course.updatedAt
        const shouldSync = await this.syncStateService.shouldSync(
            {
                target: SyncStateTarget.ScyllaDB,
                sourceType: SyncStateSourceType.Course,
                sourceId: this.request.id,
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
            const hydreatedPrerequisites = prerequisites?.map((prerequisite) => prerequisite.toPlain<PrerequisiteEntity>())

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
            const hydratedValuePropositionProps = valuePropositions?.map((valueProposition) => valueProposition.toPlain<ValuePropositionEntity>())

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
            const hydratedQnas = qnas?.map((qna) => qna.toPlain<QnaEntity>())

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
            const hydratedPricingPhases = pricingPhases?.map((pricingPhase) => pricingPhase.toPlain<PricingPhaseEntity>())

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
            const hydratedLivestreamSessions = livestreamSessions?.map((livestreamSession) => livestreamSession.toPlain<LivestreamSessionEntity>())

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
            const hydratedModules = modules?.map((module) => module.toPlain<ModuleEntity>())

            plainCourse.prerequisites = hydreatedPrerequisites
            plainCourse.valuePropositions = hydratedValuePropositionProps
            plainCourse.qnas = hydratedQnas
            plainCourse.pricingPhases = hydratedPricingPhases
            plainCourse.livestreamSessions = hydratedLivestreamSessions
            plainCourse.modules = hydratedModules

            const locales = [Locale.Vi,
                Locale.En]
            await Promise.all(locales.map(async (locale) => {
                const hydratedCourse = _.cloneDeep(plainCourse)

                this.courseTransformer.transform(
                    hydratedCourse,
                    locale,
                )

                const dataToIndex = _.omit(
                    hydratedCourse,
                    ["translations"],
                )
                const localizedDocument = {
                    ...dataToIndex,
                    locale,
                    prerequisites: hydratedCourse.prerequisites?.map((p) => ({
                        id: p.id 
                    })),
                    valuePropositions: hydratedCourse.valuePropositions?.map((v) => ({
                        id: v.id 
                    })),
                    qnas: hydratedCourse.qnas?.map((q) => ({
                        id: q.id 
                    })),
                    pricingPhases: hydratedCourse.pricingPhases?.map((p) => ({
                        id: p.id 
                    })),
                    livestreamSessions: hydratedCourse.livestreamSessions?.map((l) => ({
                        id: l.id 
                    })),
                    modules: hydratedCourse.modules?.map((m) => ({
                        id: m.id 
                    })),
                }

                await this.scylladb.upsertLocalizedDocument(
                    ScyllaSyncTables.courses,
                    hydratedCourse.id,
                    locale,
                    localizedDocument,
                )
            }))

            await this.syncStateService.markSynced(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.Course,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                },
            )
        } catch (error) {
            await this.syncStateService.markFailed(
                {
                    target: SyncStateTarget.ScyllaDB,
                    sourceType: SyncStateSourceType.Course,
                    sourceId: this.request.id,
                    sourceUpdatedAt,
                    error,
                },
            )
            throw error
        }
    }
}
