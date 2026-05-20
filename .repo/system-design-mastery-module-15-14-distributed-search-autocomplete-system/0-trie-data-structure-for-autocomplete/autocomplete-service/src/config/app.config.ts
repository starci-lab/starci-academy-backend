import {
    registerAs,
} from "@nestjs/config"

export interface AppConfig {
    port: number
}

/**
 * Cấu hình runtime tối thiểu cho service demo.
 * (EN: Minimal runtime configuration for the demo service.)
 */
export const appConfig = registerAs("app", (): AppConfig => ({
    port: Number(process.env.PORT ?? 3000),
}))
