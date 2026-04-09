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
    PricingPhaseEntity
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
import { CourseNotFoundException } from "@modules/exceptions"

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
            envConfig().services.cdnSynchronizer.syncIntervalMs.courses.runtime
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
        const hydratedCourse = course.toPlain<CourseEntity>()  
        // take the pricing phases
        const pricingPhases = await this.entityManager.find(
            PricingPhaseEntity,
            {
                where: {
                    courseId: this.request.id,
                },
            }
        )
        hydratedCourse.pricingPhases = pricingPhases
        await this.elasticsearch.indexEntity(
            CourseEntity,
            hydratedCourse
        )
    }
}
