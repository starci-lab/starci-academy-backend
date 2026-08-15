import {
    HARNESS_OPENROUTER_API_KEY,
    HARNESS_OPENROUTER_JUDGE_API_KEY,
    readHarnessOpenRouterApiKey,
    readHarnessOpenRouterJudgeApiKey,
} from "./harness-credentials"

describe("harness credentials",
    () => {
        const originalSutKey = process.env[HARNESS_OPENROUTER_API_KEY]
        const originalJudgeKey = process.env[HARNESS_OPENROUTER_JUDGE_API_KEY]

        afterEach(() => {
            if (originalSutKey === undefined) {
                delete process.env[HARNESS_OPENROUTER_API_KEY]
            } else {
                process.env[HARNESS_OPENROUTER_API_KEY] = originalSutKey
            }
            if (originalJudgeKey === undefined) {
                delete process.env[HARNESS_OPENROUTER_JUDGE_API_KEY]
            } else {
                process.env[HARNESS_OPENROUTER_JUDGE_API_KEY] = originalJudgeKey
            }
        })

        it.each([
            {
                name: HARNESS_OPENROUTER_API_KEY,
                read: readHarnessOpenRouterApiKey,
            },
            {
                name: HARNESS_OPENROUTER_JUDGE_API_KEY,
                read: readHarnessOpenRouterJudgeApiKey,
            },
        ])("reads and trims $name independently",
            ({
                name,
                read,
            }) => {
                process.env[name] = "  secret-value  "
                expect(read()).toBe("secret-value")
            })

        it.each([
            undefined,
            "",
            "   ",
        ])("rejects a missing or blank SUT credential without leaking a value",
            (value) => {
                if (value === undefined) {
                    delete process.env[HARNESS_OPENROUTER_API_KEY]
                } else {
                    process.env[HARNESS_OPENROUTER_API_KEY] = value
                }
                expect(readHarnessOpenRouterApiKey)
                    .toThrow(`Missing required harness credential: ${HARNESS_OPENROUTER_API_KEY}`)
            })

        it.each([
            undefined,
            "",
            "   ",
        ])("rejects a missing or blank judge credential without falling back to the SUT key",
            (value) => {
                process.env[HARNESS_OPENROUTER_API_KEY] = "sut-secret-must-not-be-used"
                if (value === undefined) {
                    delete process.env[HARNESS_OPENROUTER_JUDGE_API_KEY]
                } else {
                    process.env[HARNESS_OPENROUTER_JUDGE_API_KEY] = value
                }
                expect(readHarnessOpenRouterJudgeApiKey)
                    .toThrow(`Missing required harness credential: ${HARNESS_OPENROUTER_JUDGE_API_KEY}`)
            })
    })
