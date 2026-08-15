/** Environment variable carrying the provider key used by harness SUT calls. */
export const HARNESS_OPENROUTER_API_KEY = "HARNESS_OPENROUTER_API_KEY"

/** Environment variable carrying the independently authorized judge key. */
export const HARNESS_OPENROUTER_JUDGE_API_KEY = "HARNESS_OPENROUTER_JUDGE_API_KEY"

/**
 * Read one required process-only harness credential.
 *
 * Values are trimmed and never included in errors. There is deliberately no
 * file, OAuth, production key-pool or sibling-variable fallback.
 */
const readRequiredCredential = (name: string): string => {
    const value = process.env[name]?.trim()
    if (!value) {
        throw new Error(`Missing required harness credential: ${name}`)
    }
    return value
}

/** Read the credential used by the model under test. */
export const readHarnessOpenRouterApiKey = (): string =>
    readRequiredCredential(HARNESS_OPENROUTER_API_KEY)

/** Read the separate credential used by the Luna judge. */
export const readHarnessOpenRouterJudgeApiKey = (): string =>
    readRequiredCredential(HARNESS_OPENROUTER_JUDGE_API_KEY)
