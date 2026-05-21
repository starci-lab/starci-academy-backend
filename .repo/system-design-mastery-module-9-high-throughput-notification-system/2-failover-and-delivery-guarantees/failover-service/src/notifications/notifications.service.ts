/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name)

/**
 * Logic — Xử lý nghiệp vụ `dispatch` cho lab.
 * Code — `async dispatch()` — gọi dependency inject / client.
 * (EN Logic: Business handler `dispatch` for the lab.)
 * (EN Code: `async dispatch()` — uses injected deps / clients.)
 */
    async dispatch(dto: DispatchNotificationDto): Promise<NotificationEntity> {
        // Kiểm tra idempotency — nếu key đã tồn tại, trả về bản ghi cũ.
        // (EN: Idempotency check — if key exists, return existing record.)
        const existing = await this.repository.findOne({
            where: { idempotencyKey: dto.idempotencyKey },
        })
        if (existing) {
            this.logger.warn(`Duplicate idempotencyKey: ${dto.idempotencyKey} — returning existing`)
            throw new ConflictException({
                message: `Notification with idempotencyKey "${dto.idempotencyKey}" already exists`,
                existingId: existing.id,
                status: existing.status,
            })
        }

        const entity = this.repository.create({
            userId: dto.userId,
            channel: dto.channel,
            content: dto.content,
            idempotencyKey: dto.idempotencyKey,
            status: NotificationStatus.QUEUED,
        })
        const saved = await this.repository.save(entity)

        // Enqueue với exponential backoff retry.
        // (EN: Enqueue with exponential backoff retry.)
        await this.queue.add("dispatch-notification", {
            notificationId: saved.id,
            userId: saved.userId,
            channel: saved.channel,
            content: saved.content,
        }, {
            attempts: this.retryConfig.attempts,
            backoff: {
                type: "exponential",
                delay: this.retryConfig.delayMs,
            },
            removeOnComplete: true,
            removeOnFail: false, // Giữ lại job lỗi trong DLQ. (EN: Keep failed jobs in DLQ.)
        })

        this.logger.log(`Dispatched ${saved.id} with retry=${this.retryConfig.attempts}`)
        return saved
    }

/**
 * Logic — Đọc/truy vấn dữ liệu qua `findAll`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `findAll`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async findAll(): Promise<NotificationEntity[]> {
        return this.repository.find({ order: { createdAt: "DESC" } })
    }

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getDlqJobs`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getDlqJobs`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getDlqJobs(): Promise<Array<{ id: string; data; failedReason: string; attemptsMade: number }>> {
        const failedJobs = await this.queue.getFailed(0, 50)
        return failedJobs.map((job) => ({
            id: job.id,
            data: job.data,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
        }))
    }

/**
 * Logic — Đọc/truy vấn dữ liệu qua `getQueueStatus`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getQueueStatus`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getQueueStatus(): Promise<Record<string, number>> {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount(),
        ])
        return { waiting, active, completed, failed, delayed }
    }
}
