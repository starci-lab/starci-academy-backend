/**
 * Cấu hình namespace `smtp` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `smtp` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface SmtpConfig {
    host: string
    port: number
    user: string
    pass: string
    from: string
}

/**
 * Cấu hình SMTP — namespace `smtp` cho ConfigService.
 * Trong Docker Compose dùng MailHog (port 1025, không cần auth).
 * Ngoài Compose dùng Ethereal Email hoặc SMTP thật.
 * (EN: SMTP config — `smtp` namespace for ConfigService.
 * Inside Docker Compose uses MailHog (port 1025, no auth needed).
 * Outside Compose uses Ethereal Email or real SMTP.)
 */
export const smtpConfig = registerAs(
    "smtp",
    (): SmtpConfig => ({
        host: process.env.SMTP_HOST ?? "localhost",
        port: Number(process.env.SMTP_PORT) || 1025,
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
        from: process.env.SMTP_FROM ?? "noreply@starci-academy.dev",
    }),
)
