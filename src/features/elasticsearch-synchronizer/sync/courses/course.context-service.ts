import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
    ModuleEntity,
    PricingPhaseEntity,
    QnaEntity
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    CourseRuntimeContextRequest,
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
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process()
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.courses.runtime
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
                },
            }
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
       const [pricingPhases, modules, livestreamSessions, qnas] =
         await Promise.all([
           this.entityManager.find(PricingPhaseEntity, {
             where: { courseId: course.id },
           }),
           this.entityManager.find(ModuleEntity, {
             where: { courseId: course.id },
             select: ['title'],
           }),
           this.entityManager.find(LivestreamSessionEntity, {
             where: { courseId: course.id, isOverridable: false },
           }),
           this.entityManager.find(QnaEntity, {
             where: { courseId: course.id },
           }),
         ]);

         const searchDocument = {
           id: course.id,
           displayId: course.displayId,
           slug: course.slug,
           title: course.title,
           description: course.description,
           coverImageUrl: course.coverImageUrl,
           originalPrice: course.originalPrice,
           defaultLocale: course.defaultLocale,
           orderIndex: course.orderIndex,

           // Flattening Modules
           moduleKeywords: modules.map((m) => m.title).join(' '),

           // Pricing
           pricing: pricingPhases.map((p) => ({
             phase: p.phase,
             price: p.price,
             slots: p.slotAvailable,
           })),

           // Livestream
           schedule: livestreamSessions.map((s) => ({
             day: s.dayOfWeek,
             start: s.startTime,
             end: s.expectedEndTime,
           })),

           // QNA & Value Props
           contentBoost: qnas.map((q) => q.question + ' ' + q.answer).join(' '),

           // Map Translations  
           translations: course.translations.map((t) => ({
             locale: t.locale,
             field: t.field,
             value: t.value,
           })),
         };
        await this.elasticsearch.indexEntity(
            CourseEntity,
            searchDocument
        )
    }
}
