/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

  /**
   * Kiểm tra sức khỏe ứng dụng cho Kubernetes liveness/readiness (EN: application health for Kubernetes liveness/readiness).
   * Dùng Terminus `HealthCheck` + `MemoryHealthIndicator` theo recipe NestJS (EN: uses Terminus recipe — https://docs.nestjs.com/recipes/terminus).
   *
   * @returns Kết quả health check JSON (HTTP 200 nếu pass, 503 nếu fail) (EN: health check JSON — HTTP 200 if pass, 503 if fail).
   */
  @Get()
  @HealthCheck()/**
 * Logic — Xử lý nghiệp vụ `check` cho lab.
 * Code — `check()` — logic trong service/controller.
 * (EN Logic: Business handler `check` for the lab.)
 * (EN Code: `check()` — in-class handler logic.)
 */
    check() {
    // Ngưỡng rộng để tránh false negative trên laptop/Minikube (EN: generous thresholds to avoid false negatives on dev clusters).
        const heapLimitBytes = 500 * 1024 * 1024
        const rssLimitBytes = 1500 * 1024 * 1024
        return this.health.check([
            () => this.memory.checkHeap("memory_heap",
                heapLimitBytes),
            () => this.memory.checkRSS("memory_rss",
                rssLimitBytes),
        ])
    }
}
