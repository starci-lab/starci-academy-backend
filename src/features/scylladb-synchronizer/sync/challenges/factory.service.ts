import {
    ChallengeEntity,
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
    ChallengeRuntimeContextRequest,
} from "./types"
import {
    ChallengeRuntimeContextService,
} from "./runtime.context-service"
import {
    envConfig,
} from "@modules/env"
import {
    sleep,
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
     * On application bootstrap, take all challenge ids and sync them to ScyllaDB.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {
            const challenges = await this.entityManager.find(
                ChallengeEntity,
                {
                    select: {
                        id: true,
                    },
                },
            )
            const syncIntervalMs = envConfig().services.scylladbSynchronizer.syncIntervalMs.challenges
            const count = challenges.length || 1
            const syncSpacingMs = syncIntervalMs.factory / count

            for (const { id } of challenges) {
                const contextId = ContextIdFactory.create()

                this.moduleRef.registerRequestByContextId<ChallengeRuntimeContextRequest>(
                    {
                        id,
                    },
                    contextId,
                )

                const service = await this.moduleRef.resolve(
                    ChallengeRuntimeContextService,
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
