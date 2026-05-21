/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Kiểm tra kết nối Postgres (pool mặc định ping master).
     * EN: Postgres connectivity probe (TypeORM ping uses the master).
     */
    @Get()
    @HealthCheck()/**
 * Logic — Xử lý nghiệp vụ `check` cho lab.
 * Code — `check()` — logic trong service/controller.
 * (EN Logic: Business handler `check` for the lab.)
 * (EN Code: `check()` — in-class handler logic.)
 */
    check(): ReturnType<TypeOrmHealthIndicator["check"]> {
        return this.health.check([() => this.db.pingCheck("postgres")])
    }
}
