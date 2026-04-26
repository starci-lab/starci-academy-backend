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
    ElasticsearchEntityCoursesService,
} from "@modules/elasticsearch"
import type {
    CourseRuntimeContextRequest
} from "./types"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class CourseRuntimeContextService {
    constructor(
        @Inject(REQUEST)
        private readonly request: CourseRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearchEntityCourses: ElasticsearchEntityCoursesService,
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
        await this.elasticsearchEntityCourses.indexById(
            this.request.id,
        )
    }
}
