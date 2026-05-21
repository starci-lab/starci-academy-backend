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
 * Logic — Ghi/sự kiện mới qua `send`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `send`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    async send(dto: SendNotificationDto): Promise<NotificationEntity> {
        const priority = PRIORITY_MAP[dto.type] ?? 5

        // OTP bypass rate limit — tin nhắn khẩn cấp không bị chặn.
        // (EN: OTP bypasses rate limit — urgent messages are never blocked.)
        if (dto.type !== NotificationType.OTP) {
            const rl = await this.rateLimitService.consume(dto.userId, dto.channel)
            if (!rl.allowed) {
                const entity = this.repository.create({
                    userId: dto.userId,
                    channel: dto.channel,
                    type: dto.type,
                    content: dto.content,
                    status: NotificationStatus.RATE_LIMITED,
                    priority,
                    errorMessage: `Rate limited — retry after ${rl.retryAfterSeconds}s`,
                })
                await this.repository.save(entity)
                throw new HttpException({
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Rate limit exceeded for ${dto.userId}:${dto.channel}`,
                    remaining: rl.remaining,
                    retryAfterSeconds: rl.retryAfterSeconds,
                }, HttpStatus.TOO_MANY_REQUESTS)
            }
        }

        const entity = this.repository.create({
            userId: dto.userId,
            channel: dto.channel,
            type: dto.type,
            content: dto.content,
            status: NotificationStatus.QUEUED,
            priority,
        })
        const saved = await this.repository.save(entity)

        await this.queue.add("send-notification", {
            notificationId: saved.id,
            userId: saved.userId,
            channel: saved.channel,
            type: saved.type,
            content: saved.content,
        }, { priority })

        this.logger.log(
            `Queued [${dto.type}] priority=${priority} for ${saved.userId} via ${saved.channel}`,
        )
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

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getRateLimitStatus`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getRateLimitStatus`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getRateLimitStatus(userId: string, channel: string) {
        return this.rateLimitService.getStatus(userId, channel)
    }
}
