/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /api/heavy — Thực hiện tác vụ nặng để stress CPU/RAM.
     * (EN: GET /api/heavy — Performs heavy task to stress CPU/RAM.)
     *
     * Logic — Dùng để minh họa sự khác biệt khi nâng cấp tài nguyên (Vertical) hoặc tăng số lượng node (Horizontal).
     * (EN Logic: Used to demonstrate difference when upgrading resources (Vertical) or increasing node count (Horizontal).)
     */
    @Get("heavy")
    handleHeavyTask(@Query("load") load: string) {
        const iterations = parseInt(load, 10) || 10000000
        return this.taskService.runHeavyCalculation(iterations)
    }

    /**
     * GET /api/status — Kiểm tra trạng thái và định danh node.
     * (EN: GET /api/status — Check status and node identity.)
     */
    @Get("status")
    /**
 * Logic — Trả health + hostname để demo load balancer / nhiều replica. Route `GET heavy`.
 * Code — `os.hostname()` + object `{ status, servedBy, timestamp }`. Handler gọi service.getStatus().
 * (EN Logic: Return health and hostname for load-balancer demos. Endpoint `GET heavy`.)
 * (EN Code: `os.hostname()` plus `{ status, servedBy, timestamp }`. Handler delegates to service.getStatus().)
 */
    getStatus(): ReturnType<TaskService["getStatus"]> {
        return this.taskService.getStatus()
    }
