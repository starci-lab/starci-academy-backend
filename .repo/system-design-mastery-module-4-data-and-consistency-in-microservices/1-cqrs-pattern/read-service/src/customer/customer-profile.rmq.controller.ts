/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Consume profile-updated event and project it into Elasticsearch read model (VI: nhận event cập nhật hồ sơ và đồng bộ vào read model Elasticsearch).
     *
     * @param payload - Event payload from broker (VI: dữ liệu event lấy từ broker).
     * @returns Promise<void> - Completes when read model is upserted (VI: hoàn tất khi read model được upsert).
     */
    @EventPattern(CUSTOMER_PROFILE_EVENT)
    async handleProfileUpdated(
        @Payload() payload: { id: string; name: string; email: string },
    ) {
        try {
            // Log receive moment for consumer-side observability (VI: ghi log thời điểm nhận để quan sát phía consumer).
            this.logger.log(
                `Received "${CUSTOMER_PROFILE_EVENT}" for customer "${payload.id}"`,
            )
            // Persist projection so query-side data stays eventually consistent (VI: ghi projection để giữ nhất quán cuối cùng cho query side).
            await this.es.upsertCustomer(payload)
            // Log processed moment to measure consume-to-project latency (VI: ghi log xử lý xong để đo độ trễ từ consume đến projection).
            this.logger.log(
                `Processed "${CUSTOMER_PROFILE_EVENT}" for customer "${payload.id}"`,
            )
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }
}
