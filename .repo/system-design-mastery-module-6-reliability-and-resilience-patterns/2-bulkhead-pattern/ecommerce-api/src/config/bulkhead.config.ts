/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface BulkheadConfig {
    historyConcurrencyLimit: number
    historyProcessingDelayMs: number
}

/**
 * Cấu hình Bulkhead cho luồng history — namespace `bulkhead`.
 * (EN: Bulkhead config for history flow — `bulkhead` namespace.)
 */
export const bulkheadConfig = registerAs(
    "bulkhead",
    (): BulkheadConfig => ({
        historyConcurrencyLimit: Number(process.env.HISTORY_CONCURRENCY_LIMIT) || 2,
        historyProcessingDelayMs: Number(process.env.HISTORY_PROCESSING_DELAY_MS) || 5000,
    }),
)
