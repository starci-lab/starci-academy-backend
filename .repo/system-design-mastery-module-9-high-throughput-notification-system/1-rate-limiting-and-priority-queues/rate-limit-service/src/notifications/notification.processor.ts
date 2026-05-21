/**
 * BullMQ processor — worker lấy job từ queue và gửi SMTP.
 * (EN: BullMQ processor — worker dequeues jobs and sends SMTP.)
 */
import {
    Processor,
    WorkerHost,
} from "@nestjs/bullmq"
import { Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Job } from "bullmq"
import { MailerService } from "@nestjs-modules/mailer"
import {
    NotificationEntity,
    NotificationStatus,
    NotificationChannel,
} from "."
import { NOTIFICATION_QUEUE } from "."

@Processor(NOTIFICATION_QUEUE)
/**
 * Class `NotificationProcessor` — thành phần lab (controller/service/module).
 * (EN: Class `NotificationProcessor` — lesson lab component.)
 */
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name)

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repository: Repository<NotificationEntity>,
        private readonly mailerService: MailerService,
    ) {
        super()
    }

/**
 * Logic — xử lý demo cho `process`.
 * (EN: Logic — demo handler for `process`.)
 */
    async process(job: Job): Promise<void> {
        const { notificationId, userId, channel, type, content } = job.data
        this.logger.log(
            `Processing [${type}] priority=${job.opts?.priority ?? "?"} — ${notificationId}`,
        )

        await this.repository.update(notificationId, { status: NotificationStatus.SENDING })

        try {
            if (channel === NotificationChannel.EMAIL) {
                await this.mailerService.sendMail({
                    to: `${userId}@example.com`,
                    subject: `[${String(type).toUpperCase()}] Notification`,
                    text: content,
                })
            } else {
                this.logger.log(`[MOCK ${channel.toUpperCase()}] → ${userId}: ${content}`)
            }

            await this.repository.update(notificationId, {
                status: NotificationStatus.SENT,
                sentAt: new Date(),
            })
            this.logger.log(`${notificationId} sent`)
        } catch (error) {
            await this.repository.update(notificationId, {
                status: NotificationStatus.FAILED,
                errorMessage: error.message,
            })
            throw error
        }
    }
}
