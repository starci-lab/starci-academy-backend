/**
 * HTTP controller — health, stress memory, products (graceful degradation).
 * (EN: HTTP controller — health, stress, products endpoints.)
 */
import {
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
    HealthCheckError,
} from "@nestjs/terminus"
import {
    AppService,
} from "./app.service"
import type {
    HealthConfig,
} from "./config"

@Controller()
export class AppController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly memory: MemoryHealthIndicator,
        private readonly appService: AppService,
        private readonly configService: ConfigService,
    ) {}

    private get healthConfig(): HealthConfig {
        return this.configService.getOrThrow<HealthConfig>("health")
    }

    /**
     * Logic — kiểm tra DB up/down theo env (graceful degradation demo).
     * Code — nếu databaseStatus === 'down' → throw HealthCheckError.
     * (EN Logic: DB check from env for degradation demo.)
     * (EN Code: throw HealthCheckError when down.)
     */
    private checkDatabase() {
        if (this.healthConfig.databaseStatus === "down") {
            throw new HealthCheckError("database check failed", {
                database: { status: "down" as const },
            })
        }
        return { database: { status: "up" as const } }
    }

    /**
     * Logic — Terminus health: heap + simulated DB.
     * Code — @HealthCheck() → health.check([memory, checkDatabase]).
     * (EN Logic: Liveness/readiness via Terminus.)
     * (EN Code: HealthCheck indicator array.)
     */
    @Get("health")
    @HealthCheck()
    healthCheck() {
        return this.health.check([
            () => this.memory.checkHeap("memory_heap", this.healthConfig.healthHeapThresholdBytes),
            () => this.checkDatabase(),
        ])
    }

    /**
     * Logic — stress heap để demo health fail.
     * Code — delegate AppService.stressMemory().
     * (EN Logic: Stress heap for failing health demo.)
     * (EN Code: AppService.stressMemory().)
     */
    @Post("stress-memory")
    stressMemory() {
        return this.appService.stressMemory()
    }

    /**
     * Logic — products endpoint với graceful degradation.
     * Code — delegate AppService.products().
     * (EN Logic: Products with degradation path.)
     * (EN Code: AppService.products().)
     */
    @Get("products")
    products() {
        return this.appService.products()
    }
}
