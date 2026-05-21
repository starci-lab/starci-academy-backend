/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface ConsulConfig {
    baseUrl: string
}

/**
 * Cấu hình endpoint Consul HTTP API — namespace `consul`.
 * (EN: Consul HTTP API endpoint config — `consul` namespace.)
 */
export const consulConfig = registerAs(
    "consul",
    (): ConsulConfig => ({
        baseUrl: process.env.CONSUL_BASE_URL ?? "http://localhost:8500",
    }),
)
