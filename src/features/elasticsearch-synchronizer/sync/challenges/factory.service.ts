import {
    ChallengeEntity,
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases"
import {
    Injectable, OnApplicationBootstrap 
} from "@nestjs/common"
import {
    EntityManager 
} from "typeorm"
import {
    ContextIdFactory 
} from "@nestjs/core"
import {
    ModuleRef 
} from "@nestjs/core"
import {
    ChallengeRuntimeContextRequest 
} from "./types"
import {
    ChallengeRuntimeContextService 
} from "./runtime.context-service"
import {
    envConfig 
} from "@modules/env"
import {
    sleep 
} from "@modules/common"

@Injectable()
export class ChallengeFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all challenges ids and sync them to S3.
     */
    async onApplicationBootstrap() {
        // take all challenges ids
        const challenges = await this.entityManager.find(
            ChallengeEntity,
            {
                select: {
                    id: true,
                }
            }
        )
        // calculate the delay per sync
        const syncIntervalMs = envConfig().services.cdnSynchronizer.syncIntervalMs.challenges
        const syncSpacingMs = syncIntervalMs.factory / challenges.length
        for (const { id } of challenges) {
            // create the context id
            const contextId = ContextIdFactory.create()
            // register the request by context id
            this.moduleRef.registerRequestByContextId<ChallengeRuntimeContextRequest>(
                {
                    id, 
                }, // fake request object
                contextId,
            )
            // resolve the service
            const service = await this.moduleRef.resolve(
                ChallengeRuntimeContextService,
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