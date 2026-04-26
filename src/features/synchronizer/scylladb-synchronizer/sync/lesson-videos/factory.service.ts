import {
    LessonVideoEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ContextIdFactory,
    ModuleRef,
} from "@nestjs/core"
import {
    LessonVideoRuntimeContextRequest,
} from "./types"
import {
    LessonVideoRuntimeContextService,
} from "./runtime.context-service"
import {
    envConfig,
} from "@modules/env"
import {
    sleep,
} from "@modules/common"

@Injectable()
export class LessonVideoFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all lesson video ids and sync them to ScyllaDB.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {
            const lessonVideos = await this.entityManager.find(
                LessonVideoEntity,
                {
                    select: {
                        id: true,
                    },
                },
            )

            const syncIntervalMs = envConfig().services.scylladbSynchronizer.syncIntervalMs.lessonVideos
            const count = lessonVideos.length || 1
            const syncSpacingMs = syncIntervalMs.factory / count

            for (const { id } of lessonVideos) {
                const contextId = ContextIdFactory.create()

                this.moduleRef.registerRequestByContextId<LessonVideoRuntimeContextRequest>(
                    {
                        id,
                    },
                    contextId,
                )

                const service = await this.moduleRef.resolve(
                    LessonVideoRuntimeContextService,
                    contextId,
                    {
                        strict: false,
                    },
                )

                await service.run()
                await sleep(syncSpacingMs)
            }
        },
        0)
    }
}
