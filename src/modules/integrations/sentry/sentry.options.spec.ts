import {
    buildSentryOptions,
} from "./sentry.options"

describe("buildSentryOptions",
    () => {
        it("keeps production errors enabled while bounding traces and default PII",
            () => {
                expect(buildSentryOptions({
                    dsn: "https://public@example.ingest.sentry.io/1",
                    environment: "production",
                    release: "starci-api@abc123",
                })).toEqual({
                    dsn: "https://public@example.ingest.sentry.io/1",
                    environment: "production",
                    release: "starci-api@abc123",
                    tracesSampleRate: 0.05,
                    sendDefaultPii: false,
                })
            })

        it.each([
            "development",
            "test",
            "staging",
        ])(
            "disables performance traces outside production for %s",
            (environment) => {
                expect(buildSentryOptions({
                    dsn: "https://public@example.ingest.sentry.io/1",
                    environment,
                    release: "  ",
                })).toEqual(expect.objectContaining({
                    environment,
                    release: undefined,
                    tracesSampleRate: 0,
                    sendDefaultPii: false,
                }))
            },
        )
    })
