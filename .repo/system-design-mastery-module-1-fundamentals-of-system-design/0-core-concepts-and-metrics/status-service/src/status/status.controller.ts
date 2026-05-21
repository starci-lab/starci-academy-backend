/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/status — Trả về trạng thái server kèm hostname container.
     * (EN: GET /api/status — Returns server status with container hostname.)
     *
     * Logic — Khi Nginx gọi các Node theo Round-robin, hostname trả về sẽ thay đổi.
     * (EN Logic: When Nginx calls Nodes via Round-robin, returned hostname will change.)
     */
    @Get("status")
    /**
 * Logic — Trả health + hostname để demo load balancer / nhiều replica.
 * Code — `os.hostname()` + object `{ status, servedBy, timestamp }`.
 * (EN Logic: Return health and hostname for load-balancer demos.)
 * (EN Code: `os.hostname()` plus `{ status, servedBy, timestamp }`.)
 */
    getStatus(): ReturnType<StatusService["getStatus"]> {
        return this.statusService.getStatus()
    }
