import {
    sleep,
} from "@modules/common"
import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    ContextIdFactory,
    ModuleRef,
} from "@nestjs/core"
import {
    EntityManager,
} from "typeorm"
import {
    ContentRuntimeContextRequest,
} from "./types"
import {
    ContentRuntimeContextService,
} from "./content-runtime.context-service"

@Injectable()
export class ContentFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all content ids and sync them to ScyllaDB.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {
            const contents = await this.entityManager.find(
                ContentEntity,
                {
                    select: {
                        id: true,
                    },
                },
            )

            const syncIntervalMs = envConfig().services.scylladbSynchronizer.syncIntervalMs.contents
            const count = contents.length || 1
            const syncSpacingMs = syncIntervalMs.factory / count

            for (const { id } of contents) {
                const contextId = ContextIdFactory.create()

                this.moduleRef.registerRequestByContextId<ContentRuntimeContextRequest>(
                    {
                        id,
                    },
                    contextId,
                )

                const service = await this.moduleRef.resolve(
                    ContentRuntimeContextService,
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
