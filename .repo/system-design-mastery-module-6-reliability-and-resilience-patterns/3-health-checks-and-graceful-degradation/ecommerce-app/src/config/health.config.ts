/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface HealthConfig {
    heapThresholdMb: number
    healthHeapThresholdBytes: number
    databaseStatus: "up" | "down"
}

/**
 * Cấu hình health/degradation — namespace `health`.
 * (EN: Health and degradation config — `health` namespace.)
 */
export const healthConfig = registerAs(
    "health",
    (): HealthConfig => ({
        heapThresholdMb: Number(process.env.DEGRADE_HEAP_THRESHOLD_MB) || 120,
        healthHeapThresholdBytes:
            Number(process.env.HEALTH_HEAP_THRESHOLD_BYTES)
            || 200 * 1024 * 1024,
        databaseStatus:
            process.env.DATABASE_HEALTH_STATUS === "down"
                ? "down"
                : "up",
    }),
)
