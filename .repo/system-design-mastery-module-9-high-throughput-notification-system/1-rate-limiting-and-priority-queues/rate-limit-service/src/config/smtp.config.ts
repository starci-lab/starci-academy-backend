/**
 * Cấu hình namespace `smtp` — đọc biến môi trường trong factory registerAs.
 * (EN: Config namespace `smtp` — environment variables in registerAs factory.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface SmtpConfig { host: string; port: number; user: string; pass: string; from: string }

/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const smtpConfig = registerAs("smtp", (): SmtpConfig => ({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "noreply@starci-academy.dev",
}))
