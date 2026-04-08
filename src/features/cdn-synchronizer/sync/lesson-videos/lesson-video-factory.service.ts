import {
    sleep
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity
} from "@modules/databases"
import {
    envConfig
} from "@modules/env"
import {
    Injectable, OnApplicationBootstrap
} from "@nestjs/common"
import {
    ContextIdFactory,
    ModuleRef
} from "@nestjs/core"
import {
    EntityManager
} from "typeorm"
import { 
    LessonVideoRuntimeContextService 
} from "./lesson-video-runtime.context-service"
import {
    LessonVideoRuntimeContextRequest
} from "./types"

@Injectable()
export class LessonVideoFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all lesson videos ids and sync them to S3.
     */
    async onApplicationBootstrap() {
        // take all lesson videos ids
        const lessonVideos = await this.entityManager.find(
            LessonVideoEntity,
            {
                select: {
                    id: true,
                }
            }
        )
        // calculate the delay per sync
        const syncIntervalMs = envConfig().services.cdnSynchronizer.syncIntervalMs.lessons
        const syncSpacingMs = syncIntervalMs.factory / lessonVideos.length
        for (const { id } of lessonVideos) {
            // create the context id
            const contextId = ContextIdFactory.create()
            // register the request by context id
            this.moduleRef.registerRequestByContextId<LessonVideoRuntimeContextRequest>(
                {
                    id, 
                }, // fake request object
                contextId,
            )
            // resolve the service
            const service = await this.moduleRef.resolve(
                LessonVideoRuntimeContextService,
                contextId,
                {
                    strict: false 
                },
            )
            // execute the service
            await service.run()
            // sleep for the delay per sync
            await sleep(syncSpacingMs)
        }
    }
}