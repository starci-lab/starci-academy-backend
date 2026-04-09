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
    LessonVideoEntity,
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    LessonVideoRuntimeContextRequest,
} from "./types"
import { LessonVideoNotFoundException } from "@modules/exceptions"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class LessonVideoRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: LessonVideoRuntimeContextRequest,
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
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.lessonVideos.runtime
        )
    }

    /**
     * Sync the lesson video to Elasticsearch.
     */
    async process() {
        // take the lesson video
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }

        const hydratedLessonVideo = lessonVideo.toPlain<LessonVideoEntity>();
        
        await this.elasticsearch.indexEntity(
            LessonVideoEntity,
            hydratedLessonVideo,
        );
    }
}
