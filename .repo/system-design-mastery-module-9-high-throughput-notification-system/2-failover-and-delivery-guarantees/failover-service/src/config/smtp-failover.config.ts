/**
 * Cấu hình namespace `smtp-failover` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `smtp-failover` — environment variables in registerAs factory.)
 */
import { registerAs } from "@nestjs/config"

export interface SmtpFailoverConfig {
    primaryHost: string
    primaryPort: number
    secondaryHost: string
    secondaryPort: number
    from: string
}

/**
 * Cấu hình SMTP failover — 2 nhà cung cấp (primary + secondary).
 * (EN: SMTP failover config — 2 providers (primary + secondary).)
 */
export const smtpFailoverConfig = registerAs("smtpFailover", (): SmtpFailoverConfig => ({
    primaryHost: process.env.SMTP_PRIMARY_HOST ?? "localhost",
    primaryPort: Number(process.env.SMTP_PRIMARY_PORT) || 1025,
    secondaryHost: process.env.SMTP_SECONDARY_HOST ?? "localhost",
    secondaryPort: Number(process.env.SMTP_SECONDARY_PORT) || 1026,
    from: process.env.SMTP_FROM ?? "noreply@starci-academy.dev",
}))
