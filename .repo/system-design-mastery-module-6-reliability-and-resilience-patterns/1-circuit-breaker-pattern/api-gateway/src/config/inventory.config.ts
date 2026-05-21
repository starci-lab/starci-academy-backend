/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface InventoryConfig {
    baseUrl: string
    timeoutMs: number
}

/**
 * Cấu hình endpoint Inventory Service cho API Gateway — namespace `inventory`.
 * (EN: Inventory Service endpoint config for API Gateway — `inventory` namespace.)
 */
export const inventoryConfig = registerAs(
    "inventory",
    (): InventoryConfig => ({
        baseUrl: process.env.INVENTORY_BASE_URL ?? "http://localhost:3001",
        timeoutMs: Number(process.env.INVENTORY_TIMEOUT_MS) || 2000,
    }),
)
