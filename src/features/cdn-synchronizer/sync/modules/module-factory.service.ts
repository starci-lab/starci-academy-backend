import {
    sleep
} from "@modules/common";
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity
} from "@modules/databases";
import { envConfig } from "@modules/env";
import {
    Injectable,
    OnApplicationBootstrap
} from "@nestjs/common";
import {
    ContextIdFactory,
    ModuleRef
} from "@nestjs/core";
import {
    EntityManager
} from "typeorm";
import {
    RuntimeContextRequest
} from "../types";
import {
    ModuleRuntimeContextService
} from "./module-runtime.context-service";

@Injectable()
export class ModuleFactoryService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {}

    async onApplicationBootstrap() {
        // take all module ids
        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                select: {
                    id: true,
                }
            }
        )
        // calculate the delay per sync
        const syncIntervalMs = envConfig().services.cdnSynchronizer.syncIntervalMs.modules
        const syncSpacingMs = syncIntervalMs.factory / modules.length
        for (const { id } of modules) {
            // create the context id
            const contextId = ContextIdFactory.create()
            // register the request by context id
            this.moduleRef.registerRequestByContextId<RuntimeContextRequest>(
                {
                    id, 
                }, // fake request object
                contextId,
            )
            // resolve the service
            const service = await this.moduleRef.resolve(
                ModuleRuntimeContextService,
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

