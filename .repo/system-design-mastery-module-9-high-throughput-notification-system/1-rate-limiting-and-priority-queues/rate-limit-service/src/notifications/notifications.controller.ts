/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /** POST /api/notifications/send — Gửi thông báo (có rate limit + priority). */
    @Post("send")
/**
 * Logic — xử lý demo cho `send`.
 * (EN: Logic — demo handler for `send`.)
 */
    async send(@Body() dto: SendNotificationDto: Promise<ReturnType<NotificationsService["send"]>> {
        return this.service.send(dto)
    }

    /** GET /api/notifications — Danh sách log thông báo. */
    @Get()
/**
 * Logic — xử lý demo cho `findAll`.
 * (EN: Logic — demo handler for `findAll`.)
 */
    async findAll(: Promise<ReturnType<NotificationsService["findAll"]>> {
        return this.service.findAll()
    }

    /** GET /api/notifications/queue-status — Trạng thái hàng đợi BullMQ. */
    @Get("queue-status")
    async queueStatus(: Promise<ReturnType<NotificationsService["getQueueStatus"]>> {
        return this.service.getQueueStatus()
    }

    /**
     * GET /api/notifications/rate-limit-status?userId=xxx&channel=email
     * Kiểm tra trạng thái Token Bucket hiện tại.
     * (EN: Check current Token Bucket state.)
     */
    @Get("rate-limit-status")
/**
 * Logic — xử lý demo cho `rateLimitStatus`.
 * (EN: Logic — demo handler for `rateLimitStatus`.)
 */
    async rateLimitStatus(
        @Query("userId") userId: string,
        @Query("channel") channel: string,
    : ReturnType<NotificationsService["getRateLimitStatus"]> {
        return this.service.getRateLimitStatus(userId, channel)
    }
