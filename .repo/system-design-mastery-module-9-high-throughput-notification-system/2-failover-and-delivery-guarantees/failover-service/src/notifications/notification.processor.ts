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
import {
    NotificationEntity,
    NotificationStatus,
    NotificationChannel,
} from "../entities"
import { SmtpService } from "../smtp"
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
        private readonly smtpService: SmtpService,
    ) {
        super()
    }

    /**
     * Xử lý job — gửi qua SmtpService (auto failover primary → secondary).
     * Nếu cả 2 SMTP đều fail → ném lỗi → BullMQ retry với exponential backoff.
     * Khi hết retry → job chuyển sang trạng thái failed (DLQ).
     * (EN: Process job — send via SmtpService (auto failover primary → secondary).
     * If both SMTP fail → throw error → BullMQ retries with exponential backoff.
     * When retries exhausted → job moves to failed state (DLQ).)
     */
    async process(job: Job): Promise<void> {
        const { notificationId, userId, channel, content } = job.data
        this.logger.log(
            `Processing ${notificationId} — attempt ${job.attemptsMade + 1}/${job.opts?.attempts ?? "?"}`,
        )

        await this.repository.update(notificationId, {
            status: NotificationStatus.SENDING,
            retryCount: job.attemptsMade,
        })

        try {
            if (channel === NotificationChannel.EMAIL) {
                const result = await this.smtpService.sendMail(
                    `${userId}@example.com`,
                    `Notification for ${userId}`,
                    content,
                )
                await this.repository.update(notificationId, {
                    status: NotificationStatus.SENT,
                    sentAt: new Date(),
                    sentViaProvider: result.provider,
                    retryCount: job.attemptsMade,
                })
                this.logger.log(
                    `${notificationId} sent via ${result.provider} on attempt ${job.attemptsMade + 1}`,
                )
            } else {
                this.logger.log(`[MOCK ${channel.toUpperCase()}] → ${userId}: ${content}`)
                await this.repository.update(notificationId, {
                    status: NotificationStatus.SENT,
                    sentAt: new Date(),
                    sentViaProvider: "mock",
                    retryCount: job.attemptsMade,
                })
            }
        } catch (error) {
            this.logger.error(
                `${notificationId} failed on attempt ${job.attemptsMade + 1}: ${error.message}`,
            )
            // Cập nhật trạng thái — nếu đây là lượt cuối cùng, đánh dấu DLQ.
            // (EN: Update status — if this is the last attempt, mark as DLQ.)
            const isLastAttempt = job.attemptsMade + 1 >= (job.opts?.attempts ?? 1)
            await this.repository.update(notificationId, {
                status: isLastAttempt ? NotificationStatus.DLQ : NotificationStatus.FAILED,
                errorMessage: error.message,
                retryCount: job.attemptsMade + 1,
            })
            throw error
        }
    }
}
