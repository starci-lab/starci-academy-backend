/** Inputs owned by the runtime/deploy boundary for Sentry initialization. */
export interface BuildSentryOptionsInput {
    dsn: string
    environment: string
    release?: string
}

/**
 * Build privacy- and quota-bounded Sentry options without initializing the SDK.
 * Errors remain enabled in every environment; performance traces are sampled
 * only in production, where they are operationally useful.
 */
export const buildSentryOptions = ({
    dsn,
    environment,
    release,
}: BuildSentryOptionsInput) => ({
    dsn,
    environment,
    release: release?.trim() || undefined,
    tracesSampleRate: environment === "production" ? 0.05 : 0,
    sendDefaultPii: false,
})
