import {
    Injectable,
} from "@nestjs/common"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Queue,
} from "bullmq"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ProcessPersonalProjectPayload,
} from "@modules/integrations/bullmq/types/payloads/process-personal-project"
import SuperJSON from "superjson"
import {
    EntityManager,
} from "typeorm"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"
import type {
    EnqueueProcessPersonalProjectParams,
} from "../types/enqueue"

@Injectable()
/**
 * Service for enqueueing personal project grading jobs.
 */
export class EnqueueProcessPersonalProjectJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessPersonalProject].name)
        private readonly queue: Queue<string>,
    ) {}

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        {
            attemptId,
            branch,
            userId,
        }: EnqueueProcessPersonalProjectParams,
    ): Promise<JobEntity> {
        const payload: ProcessPersonalProjectPayload = {
            attemptId,
            branch: branch ?? "main",
        }

        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ProcessPersonalProject,
            maxSteps: 2,
            payload: this.superJson.stringify(payload),
        })

        void sleepEnqueueUxDelay().then(() =>
            this.queue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        ).catch((error) =>
            this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            }),
        )

        return job
    }
}
