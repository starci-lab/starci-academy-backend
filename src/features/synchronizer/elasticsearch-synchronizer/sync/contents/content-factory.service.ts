import { 
    sleep
} from "@modules/common"
import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import { 
    envConfig
} from "@modules/env"
import { 
    Injectable,
    OnApplicationBootstrap 
} from "@nestjs/common"
import { 
    ContextIdFactory,
    ModuleRef 
} from "@nestjs/core"
import { 
    EntityManager 
} from "typeorm"
import { 
    ContentRuntimeContextRequest 
} from "./types"
import { 
    ContentRuntimeContextService 
} from "./content-runtime.context-service"

@Injectable()
export class ContentFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {}

    /**
     * On application bootstrap, take all contents ids and sync them to S3.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {    
            // take all contents ids
            const contents = await this.entityManager.find(ContentEntity,
                {
                    select: {
                        id: true,
                    },
                })
            // calculate the delay per sync
            const syncIntervalMs = envConfig().services.elasticsearchSynchronizer.syncIntervalMs.contents
            const syncSpacingMs = syncIntervalMs.factory / contents.length
            for (const { id } of contents) {
                // create the context id
                const contextId = ContextIdFactory.create()
                // register the request by context id
                this.moduleRef.registerRequestByContextId<ContentRuntimeContextRequest>(
                    {
                        id,
                    }, // fake request object
                    contextId,
                )
                // resolve the service
                const service = await this.moduleRef.resolve(
                    ContentRuntimeContextService,
                    contextId,
                    {
                        strict: false,
                    },
                )
                // execute the service
                await service.run()
                // sleep for the delay per sync
                await sleep(syncSpacingMs)
            }
        },
        0)
    }
}
