/**
 * Sentry instrument — initialize SDK before NestFactory runs.
 * Logic: Sentry must hook into Node runtime as early as possible to capture all exceptions/traces.
 * Code: `Sentry.init()` reads env directly because ConfigModule does not exist yet.
 */
import * as Sentry from "@sentry/nestjs"

// Only initialize when SENTRY_DSN is configured (skip if empty — not mandatory for lab).
const dsn = process.env.SENTRY_DSN
if (dsn) {
    Sentry.init({
        dsn,
        // Trace sample rate — 1.0 = 100% (lab only; production should be < 0.1).
        tracesSampleRate: 1.0,
    })
}
