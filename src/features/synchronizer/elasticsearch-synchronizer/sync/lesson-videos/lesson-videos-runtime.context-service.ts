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
    ElasticsearchEntityLessonVideosService,
} from "@modules/elasticsearch"
import type {
    LessonVideoRuntimeContextRequest,
} from "./types"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class LessonVideoRuntimeContextService {
    constructor(
        @Inject(REQUEST)
        private readonly request: LessonVideoRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearchEntityLessonVideos: ElasticsearchEntityLessonVideosService,
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
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.lessonVideos.runtime
        )
    }

    /**
     * Sync the lesson video to Elasticsearch.
     */
    async process() {
        await this.elasticsearchEntityLessonVideos.indexById(
            this.request.id,
        )
    }
}
