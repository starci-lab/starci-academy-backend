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
    ActionType,
    JobEntity,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    bullData,
    BullQueueName,
    SendMailPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    sleepEnqueueUxDelay,
} from "./enqueue-ux-delay"

/**
 * Params accepted by {@link EnqueueSendMailJobService.enqueue}.
 *
 * Mirrors {@link SendMailPayload} — kept as a separate alias so we can
 * evolve the enqueue API (e.g. defaulting a `from` address) without
 * leaking transport concerns to callers.
 */
export type EnqueueSendMailParams = SendMailPayload

/**
 * Service for enqueuing a transactional email job onto the `send-mail`
 * BullMQ queue. The actual delivery happens in {@link SendMailWorker}
 * which relays through the Brevo SMTP gateway configured in env.
 */
@Injectable()
export class EnqueueSendMailJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SendMail].name)
        private readonly sendMailQueue: Queue<string>,
    ) {}

    /**
     * Persist a `jobs` row and push the payload to BullMQ.
     *
     * @param params - Mail envelope + content to send.
     * @returns The created {@link JobEntity} so callers can correlate logs.
     */
    async enqueue(
        params: EnqueueSendMailParams,
    ): Promise<JobEntity> {
        await sleepEnqueueUxDelay()
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            actionType: ActionType.SendMail,
            maxSteps: 1,
            payload: this.superJson.stringify(params satisfies SendMailPayload),
        })

        await this.sendMailQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )

        return job
    }
}
