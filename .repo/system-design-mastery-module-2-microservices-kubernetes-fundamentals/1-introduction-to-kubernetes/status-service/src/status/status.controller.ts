/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
 }

    /**
     * GET /api/status — Trả về trạng thái và hostname Pod
     * (EN: GET /api/status — Returns status and Pod hostname)
     *
     * Khi có nhiều replica, Service Kubernetes phân phối request — `servedBy` sẽ thay đổi
     * (EN: With multiple replicas, the Kubernetes Service distributes requests — `servedBy` varies)
     */
    @Get("status")/**
 * Logic — Trả health + hostname để demo load balancer / nhiều replica.
 * Code — `os.hostname()` + object `{ status, servedBy, timestamp }`.
 * (EN Logic: Return health and hostname for load-balancer demos.)
 * (EN Code: `os.hostname()` plus `{ status, servedBy, timestamp }`.)
 */
    getStatus() {
        // Gọi service lấy payload JSON (EN: delegate to service for JSON payload)
        return this.statusService.getStatus()
    }
}
