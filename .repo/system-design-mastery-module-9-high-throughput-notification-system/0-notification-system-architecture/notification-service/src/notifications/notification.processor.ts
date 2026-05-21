/**
 * BullMQ processor — worker lấy job từ queue và gửi SMTP.
 * (EN: BullMQ processor — worker dequeues jobs and sends SMTP.)
 */
import {
    Processor,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Logger,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    ConfigService,
} from "@nestjs/config"
import {
    Job,
} from "bullmq"
import * as nodemailer from "nodemailer"
import {
    NotificationEntity,
    NotificationStatus,
    NotificationChannel,
} from "."
import type {
    SmtpConfig,
} from "../config"
import {
    NOTIFICATION_QUEUE,
} from "."

/**
 * Dữ liệu job trong hàng đợi BullMQ.
 * (EN: Job data payload in the BullMQ queue.)
 */
interface NotificationJobData {
    notificationId: string
    userId: string
    channel: NotificationChannel
    content: string
}

/**
 * BullMQ Worker — consume job từ hàng đợi, gửi email qua Nodemailer,
 * và cập nhật trạng thái vào DB.
 * (EN: BullMQ Worker — consumes jobs from queue, sends email via Nodemailer,
 * and updates status in DB.)
 */
@Processor(NOTIFICATION_QUEUE)
/**
 * Class `NotificationProcessor` — thành phần lab (controller/service/module).
 * (EN: Class `NotificationProcessor` — lesson lab component.)
 */
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name)
    private transporter: nodemailer.Transporter

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repository: Repository<NotificationEntity>,
        private readonly configService: ConfigService,
    ) {
        super()
        const smtp = this.configService.getOrThrow<SmtpConfig>("smtp")
        // Tạo Nodemailer transporter — nếu user/pass rỗng thì bỏ qua auth (MailHog).
        // (EN: Create Nodemailer transporter — skip auth if user/pass empty (MailHog).)
        this.transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: false,
            ...(smtp.user
                ? { auth: { user: smtp.user, pass: smtp.pass } }
                : {}),
        })
    }

    /**
     * Xử lý từng job: cập nhật trạng thái SENDING → gửi email → cập nhật SENT.
     * Nếu lỗi, cập nhật FAILED và ném lại để BullMQ retry.
     * (EN: Process each job: update status SENDING → send email → update SENT.
     * On error, update FAILED and rethrow for BullMQ retry.)
     */
    async process(job: Job<NotificationJobData>): Promise<void> {
        const { notificationId, userId, channel, content } = job.data
        this.logger.log(
            `Processing job ${job.id} — notification ${notificationId} via ${channel}`,
        )

        // Cập nhật trạng thái sang SENDING.
        // (EN: Update status to SENDING.)
        await this.repository.update(notificationId, {
            status: NotificationStatus.SENDING,
        })

        try {
            if (channel === NotificationChannel.EMAIL) {
                const smtp = this.configService.getOrThrow<SmtpConfig>("smtp")
                await this.transporter.sendMail({
                    from: smtp.from,
                    to: `${userId}@example.com`,
                    subject: `Notification for ${userId}`,
                    text: content,
                })
            } else {
                // SMS và Push: log giả lập — trong production sẽ gọi API nhà cung cấp.
                // (EN: SMS and Push: mock log — in production would call provider API.)
                this.logger.log(
                    `[MOCK ${channel.toUpperCase()}] Sent to ${userId}: ${content}`,
                )
            }

            // Cập nhật trạng thái SENT + thời gian gửi.
            // (EN: Update status to SENT + sent timestamp.)
            await this.repository.update(notificationId, {
                status: NotificationStatus.SENT,
                sentAt: new Date(),
            })

            this.logger.log(`✅ Notification ${notificationId} sent successfully`)
        } catch (error) {
            // Cập nhật trạng thái FAILED + lưu thông báo lỗi.
            // (EN: Update status to FAILED + store error message.)
            await this.repository.update(notificationId, {
                status: NotificationStatus.FAILED,
                errorMessage: error.message ?? "Unknown error",
            })
            this.logger.error(
                `❌ Notification ${notificationId} failed: ${error.message}`,
            )
            throw error // BullMQ sẽ retry tự động. (EN: BullMQ will auto-retry.)
        }
    }
}
