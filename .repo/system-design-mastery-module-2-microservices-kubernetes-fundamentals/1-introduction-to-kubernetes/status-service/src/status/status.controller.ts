/**
 * Controller — routes delegate to service.
 */
 }

    /**
     * GET /api/status — Returns status and Pod hostname
     *
     * With multiple replicas, the Kubernetes Service distributes requests — `servedBy` varies
     */
    @Get("status")
/**
 * Logic — Return health and hostname for load-balancer demos.
 * Code — `os.hostname()` plus `{ status, servedBy, timestamp }`.
 */
    getStatus() {
        // delegate to service for JSON payload
        return this.statusService.getStatus()
    }
}
