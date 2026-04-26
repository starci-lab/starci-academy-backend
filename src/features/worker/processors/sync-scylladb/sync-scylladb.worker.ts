import {
    BullQueueName,
    SyncScyllaDBPayload,
    bullData,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ContextIdFactory,
    ModuleRef,
} from "@nestjs/core"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    ChallengeRuntimeContextService,
} from "@features/synchronizer/scylladb-synchronizer/sync/challenges/runtime.context-service"
import {
    ContentRuntimeContextService,
} from "@features/synchronizer/scylladb-synchronizer/sync/contents/content-runtime.context-service"
import {
    CourseRuntimeContextService,
} from "@features/synchronizer/scylladb-synchronizer/sync/courses/course-runtime.context-service"
import {
    LessonVideoRuntimeContextService,
} from "@features/synchronizer/scylladb-synchronizer/sync/lesson-videos/runtime.context-service"
import type {
    ChallengeRuntimeContextRequest,
} from "@features/synchronizer/scylladb-synchronizer/sync/challenges/types"
import type {
    ContentRuntimeContextRequest,
} from "@features/synchronizer/scylladb-synchronizer/sync/contents/types"
import type {
    CourseRuntimeContextRequest,
} from "@features/synchronizer/scylladb-synchronizer/sync/courses/types"
import type {
    LessonVideoRuntimeContextRequest,
} from "@features/synchronizer/scylladb-synchronizer/sync/lesson-videos/types"

@Worker(
    bullData[BullQueueName.SyncScyllaDB].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
@Injectable()
export class SyncScyllaDBWorker extends WorkerHost {
    private readonly logger = new Logger(SyncScyllaDBWorker.name)

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly moduleRef: ModuleRef,
    ) {
        super()
    }

    async process(bullmqJob: Job<string>): Promise<void> {
        let payload: SyncScyllaDBPayload | undefined
        let errorMessage = "Unknown sync-scylladb worker error"

        const job = await this.jobActionService.getJob({
            id: bullmqJob.id ?? "",
        })

        try {
            payload = this.superJson.parse<SyncScyllaDBPayload>(bullmqJob.data)

            await this.processSync(payload)

            await this.jobActionService.completeJob({
                job,
            })

            this.logger.log(
                `Synced ${payload.entityType}(${payload.id}) to ScyllaDB from queue`,
            )
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : String(error)
            await this.jobActionService.failJob({
                job,
                error: errorMessage,
            })
            this.logger.error(
                `Failed sync-scylladb for ${payload?.entityType ?? "unknown"}(${payload?.id ?? "unknown"}): ${errorMessage}`,
            )
            throw error
        }
    }

    private async processSync(payload: SyncScyllaDBPayload): Promise<void> {
        const contextId = ContextIdFactory.create()

        switch (payload.entityType) {
        case "course": {
            this.moduleRef.registerRequestByContextId<CourseRuntimeContextRequest>(
                {
                    id: payload.id,
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
            await service.process()
            return
        }
        case "challenge": {
            this.moduleRef.registerRequestByContextId<ChallengeRuntimeContextRequest>(
                {
                    id: payload.id,
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
            await service.process()
            return
        }
        case "content": {
            this.moduleRef.registerRequestByContextId<ContentRuntimeContextRequest>(
                {
                    id: payload.id,
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
            await service.process()
            return
        }
        case "lessonVideo": {
            this.moduleRef.registerRequestByContextId<LessonVideoRuntimeContextRequest>(
                {
                    id: payload.id,
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
            await service.process()
            return
        }
        default:
            throw new Error(`Unsupported sync-scylladb entity type: ${String(payload.entityType)}`)
        }
    }
}
