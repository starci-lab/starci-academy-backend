/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

export interface ConsulConfig {
    baseUrl: string
}

/**
 * Consul HTTP API endpoint config — `consul` namespace.
 */
export const consulConfig = registerAs(
    "consul",
    (): ConsulConfig => ({
        baseUrl: process.env.CONSUL_BASE_URL ?? "http://localhost:8500",
    }),
)
