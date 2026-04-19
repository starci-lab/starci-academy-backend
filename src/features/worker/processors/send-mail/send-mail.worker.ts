import {
    BullQueueName,
    SendMailPayload,
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
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    MailcowService,
} from "./mailcow.service"

/**
 * BullMQ worker that drains the `send-mail` queue by handing payloads
 * to {@link MailcowService}. Job state is mirrored to the `jobs` table
 * via {@link JobActionService} so operators can inspect failures.
 */
@Worker(
    bullData[BullQueueName.SendMail].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
@Injectable()
export class SendMailWorker extends WorkerHost {
    private readonly logger = new Logger(SendMailWorker.name)

    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly mailcowService: MailcowService,
    ) {
        super()
    }

    /**
     * Entry point invoked by BullMQ for every queued send-mail job.
     * Throws to let BullMQ apply the configured retry policy.
     */
    async process(bullmqJob: Job<string>): Promise<void> {
        let payload: SendMailPayload | undefined

        try {
            payload = this.superJson.parse<SendMailPayload>(bullmqJob.data)

            const job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? "",
            })

            await this.mailcowService.send(payload)

            await this.jobActionService.completeJob({
                job,
            })

            this.logger.log(
                `Sent mail "${payload.subject}" to ${payload.to.map((r) => r.address).join(", ")}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to send mail (subject="${payload?.subject ?? "?"}"): ${
                    error instanceof Error ? error.message : String(error)
                }`,
            )
            throw error
        }
    }
}
