/**
 * Sentry instrument — khởi tạo SDK trước khi NestFactory chạy.
 * (EN: Sentry instrument — initialize SDK before NestFactory runs.)
 *
 * Logic — Sentry cần hook vào Node runtime sớm nhất có thể để bắt mọi exception/trace.
 * Code — `Sentry.init()` đọc env trực tiếp vì ConfigModule chưa tồn tại lúc này.
 * (EN Logic: Sentry must hook into Node runtime as early as possible to capture all exceptions/traces.)
 * (EN Code: `Sentry.init()` reads env directly because ConfigModule does not exist yet.)
 */
import * as Sentry from "@sentry/nestjs"

// Chỉ khởi tạo khi SENTRY_DSN được cấu hình (bỏ qua nếu trống — lab không bắt buộc).
// (EN: Only initialize when SENTRY_DSN is configured (skip if empty — not mandatory for lab).)
const dsn = process.env.SENTRY_DSN
if (dsn) {
    Sentry.init({
        dsn,
        // Tỉ lệ trace mẫu — 1.0 = 100% (chỉ lab; production nên < 0.1).
        // (EN: Trace sample rate — 1.0 = 100% (lab only; production should be < 0.1).)
        tracesSampleRate: 1.0,
    })
}
