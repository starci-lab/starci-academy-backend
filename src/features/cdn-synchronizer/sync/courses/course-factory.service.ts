import {
    sleep
} from "@modules/common"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager
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
    CourseRuntimeContextService
} from "./course-runtime.context-service"
import {
    CourseRuntimeContextRequest
} from "./types"

@Injectable()
export class CourseFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all courses ids and sync them to S3.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {    
            // take all courses ids
            const courses = await this.entityManager.find(
                CourseEntity,
                {
                    select: {
                        id: true,
                    }
                }
            )
            // calculate the delay per sync
            const syncIntervalMs = envConfig().services.cdnSynchronizer.syncIntervalMs.courses
            const syncSpacingMs = syncIntervalMs.factory / courses.length
            for (const { id } of courses) {
                // create the context id
                const contextId = ContextIdFactory.create()
                // register the request by context id
                this.moduleRef.registerRequestByContextId<CourseRuntimeContextRequest>(
                    {
                        id, 
                    }, // fake request object
                    contextId,
                )
                // resolve the service
                const service = await this.moduleRef.resolve(
                    CourseRuntimeContextService,
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
                }, 0);
    }
}