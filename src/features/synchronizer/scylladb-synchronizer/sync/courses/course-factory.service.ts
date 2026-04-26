import {
    CourseEntity,
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
    CourseRuntimeContextRequest,
} from "./types"
import {
    CourseRuntimeContextService,
} from "./course-runtime.context-service"
import {
    envConfig,
} from "@modules/env"
import {
    sleep,
} from "@modules/common"

@Injectable()
export class CourseFactorySyncService implements OnApplicationBootstrap {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    /**
     * On application bootstrap, take all course ids and sync them to ScyllaDB.
     */
    onApplicationBootstrap() {
        setTimeout(async () => {
            const courses = await this.entityManager.find(
                CourseEntity,
                {
                    select: {
                        id: true,
                    },
                },
            )

            const syncIntervalMs = envConfig().services.scylladbSynchronizer.syncIntervalMs.courses
            const count = courses.length || 1
            const syncSpacingMs = syncIntervalMs.factory / count

            for (const { id } of courses) {
                const contextId = ContextIdFactory.create()

                this.moduleRef.registerRequestByContextId<CourseRuntimeContextRequest>(
                    {
                        id,
                    },
                    contextId,
                )

                const service = await this.moduleRef.resolve(
                    CourseRuntimeContextService,
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
