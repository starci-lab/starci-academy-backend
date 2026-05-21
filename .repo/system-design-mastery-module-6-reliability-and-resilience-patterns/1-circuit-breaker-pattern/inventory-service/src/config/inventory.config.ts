/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface InventoryBehaviorConfig {
    failureAfterSuccessCount: number
}

/**
 * Cấu hình hành vi giả lập lỗi của Inventory Service — namespace `inventory`.
 * (EN: Inventory Service simulated failure behavior config — `inventory` namespace.)
 */
export const inventoryConfig = registerAs(
    "inventory",
    (): InventoryBehaviorConfig => ({
        failureAfterSuccessCount: Number(process.env.FAILURE_AFTER_SUCCESS_COUNT) || 3,
    }),
)
