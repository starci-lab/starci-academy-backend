/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Gửi thông báo mới → tạo bản ghi + đẩy vào BullMQ queue.
     * (EN: Send a new notification → create record + push to BullMQ queue.)
     */
    @Post("send")
/**
 * Logic — xử lý demo cho `send`.
 * (EN: Logic — demo handler for `send`.)
 */
    async send(@Body() dto: SendNotificationDto: Promise<ReturnType<NotificationsService["send"]>> {
        return this.service.send(dto)
    }

    /**
     * Lấy toàn bộ log thông báo.
     * (EN: Get all notification logs.)
     */
    @Get()
/**
 * Logic — xử lý demo cho `findAll`.
 * (EN: Logic — demo handler for `findAll`.)
 */
    async findAll(: Promise<ReturnType<NotificationsService["findAll"]>> {
        return this.service.findAll()
    }

    /**
     * Kiểm tra trạng thái hàng đợi BullMQ (waiting, active, completed, failed, delayed).
     * (EN: Check BullMQ queue status (waiting, active, completed, failed, delayed).)
     */
    @Get("queue-status")
    async queueStatus(: Promise<ReturnType<NotificationsService["getQueueStatus"]>> {
        return this.service.getQueueStatus()
    }
