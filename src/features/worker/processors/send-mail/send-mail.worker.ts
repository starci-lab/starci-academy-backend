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
    MailerService,
} from "@nestjs-modules/mailer"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"

/**
 * BullMQ worker that drains the `send-mail` queue by handing payloads
 * to `MailerService` (Nest Mailer -> nodemailer -> Brevo SMTP relay).
 * Job state is mirrored to the `jobs` table
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
        private readonly mailerService: MailerService,
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

            await this.mailerService.sendMail({
                from: payload.from
                    ? this.formatAddress(payload.from)
                    : undefined,
                to: payload.to.map((r) => this.formatAddress(r)),
                cc: payload.cc?.map((r) => this.formatAddress(r)),
                bcc: payload.bcc?.map((r) => this.formatAddress(r)),
                replyTo: payload.replyTo
                    ? this.formatAddress(payload.replyTo)
                    : undefined,
                subject: payload.subject,
                text: payload.text,
                html: payload.html,
                template: payload.template,
                context: payload.context,
                headers: payload.headers,
                attachments: payload.attachments?.map((attachment) => ({
                    filename: attachment.filename,
                    contentType: attachment.contentType,
                    cid: attachment.cid,
                    content: attachment.contentBase64
                        ? Buffer.from(attachment.contentBase64,
                            "base64")
                        : undefined,
                    path: attachment.path,
                    href: attachment.href,
                })),
            })

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

    private formatAddress(recipient: SendMailPayload["to"][number]): string {
        return recipient.name
            ? `"${recipient.name.replace(/"/g,
                "'")}" <${recipient.address}>`
            : recipient.address
    }
}
