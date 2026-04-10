import {
    envConfig 
} from "@modules/env"
import {
    AsyncService
} from "@modules/mixin"
import {
    Inject,
    Injectable,
    Scope
} from "@nestjs/common"
import {
    REQUEST 
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
} from "@modules/databases"
import _ from "lodash"
import {
    CourseTransformerService
} from "@features/api/graphql/utils"
import {
    EntityManager
} from "typeorm"
import {
    ElasticsearchService
} from "@modules/elasticsearch"
import type {
    CourseRuntimeContextRequest
} from "./types"
import { 
    CourseNotFoundException 
} from "@modules/exceptions"

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
        private readonly elasticsearch: ElasticsearchService,
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
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.courses.runtime,
        )
    }

    /**
     * Sync the course to Elasticsearch.
     */
    async process() {
        // take the course
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

        const plainCourse = course.toPlain<CourseEntity>()

        // 1. Prerequisites
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
        const hydreatedPrerequisites = prerequisites?.map((prerequisites) => {
            return prerequisites.toPlain<PrerequisiteEntity>()
        })

        
        // 2. Value Propositions (Need alias for contentBoost, then map to ID)
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
        const hydratedValuePropositionProps = valuePropositions?.map((valueProposition) => {
            return valueProposition.toPlain<ValuePropositionEntity>()
        })

        // 3. QnAs (Need question/answer for contentBoost, then map to ID)
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
        const hydratedQnas = qnas?.map((qna) => {
            return qna.toPlain<QnaEntity>()
        })

        // 4. Pricing Phases (ID only)
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
        const hydratedPricingPhases = pricingPhases?.map((pricingPhase) => {
            return pricingPhase.toPlain<PricingPhaseEntity>()
        })

        // 5. Livestream Sessions (ID only)
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
        const hydratedLivestreamSessions = livestreamSessions?.map((livestreamSession) => {
            return livestreamSession.toPlain<LivestreamSessionEntity>()
        })

        // 6. Modules (Need title for moduleKeywords, then map to ID)
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
        const hydratedModules = modules?.map((module) => {
            return module.toPlain<ModuleEntity>()
        })

        plainCourse.prerequisites = hydreatedPrerequisites
        plainCourse.valuePropositions = hydratedValuePropositionProps
        plainCourse.qnas = hydratedQnas
        plainCourse.pricingPhases = hydratedPricingPhases
        plainCourse.livestreamSessions = hydratedLivestreamSessions
        plainCourse.modules = hydratedModules

        const locales = [Locale.Vi, Locale.En]
        await Promise.all(locales.map(async (locale) => {
            // Clone the course tree and attach the relations needed for transformation
            const hydratedCourse = _.cloneDeep(plainCourse)

            // Transform for the current locale to get translated values for keywords
            this.courseTransformer.transform(
                hydratedCourse,
                locale,
            )

            const { translations, ...dataToIndex } = hydratedCourse

            const indexedData = {
                ...dataToIndex,
                locale,
                prerequisites: hydratedCourse.prerequisites?.map(p => ({ id: p.id })),
                valuePropositions: hydratedCourse.valuePropositions?.map(v => ({ id: v.id })),
                qnas: hydratedCourse.qnas?.map(q => ({ id: q.id })),
                pricingPhases: hydratedCourse.pricingPhases?.map(p => ({ id: p.id })),
                livestreamSessions: hydratedCourse.livestreamSessions?.map(l => ({ id: l.id })),
                modules: hydratedCourse.modules?.map(m => ({ id: m.id })),
            }

            await this.elasticsearch.indexEntity(
                CourseEntity,
                indexedData,
                `${hydratedCourse.id}-${locale}`,
            )
        }))
    }
}
