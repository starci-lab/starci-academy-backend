import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import OpenAI from "openai"
import {
    AxiosService,
} from "@modules/axios"
import {
    ModelProvider,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KeyStatus,
} from "../enums"
import type {
    KeyState,
    PingKeyParams,
    PingKeyResult,
} from "../types"
import {
    KeyStoreService,
} from "./key-store.service"

/** Max chars stored in winston log for an error message (avoid leaking giant payloads). */
const ERROR_MESSAGE_MAX_LEN = 200

/**
 * Periodic health checker for the AI Balancer key pool.
 *
 * Two concerns:
 *
 * 1. **Active keys** — periodically ping every active key with a zero-token
 *    endpoint (e.g. OpenAI `/v1/models`). If a key fails the failure counter
 *    on its {@link KeyState} is incremented; reaching
 *    `failureThresholdToDisable` flips it to `Disabled`.
 *
 * 2. **Disabled keys** — once `recoveryWaitMs` has elapsed since
 *    `disabledAt` the key is re-pinged. A successful ping restores it to
 *    `Active` and resets the failure counter.
 *
 * Scheduling — owned by this service, not Nest's `@Cron` / `@Interval`:
 *
 *   T+0                  Boot. `onModuleInit` picks a random jitter
 *                        `delay = Math.random() * intervalMs` and schedules a
 *                        one-shot `setTimeout`.
 *   T+delay              First sweep fires; then `setInterval(intervalMs)`
 *                        is armed for steady-state polling.
 *   T+delay+N·iMs        Recurring sweeps (N = 1, 2, …).
 *   shutdown             `onModuleDestroy` clears both timers.
 *
 * Why random jitter (not fixed delay):
 *
 * - N pods booting together would otherwise all hit the provider at the
 *   same instant ("thundering herd"). Random jitter in `[0, intervalMs)`
 *   spreads the burst across one full period.
 *
 * Why plain timers instead of `@Interval`:
 *
 * - Compose jitter one-shot + recurring cleanly.
 * - Deterministic cleanup on shutdown / Jest.
 * - No coupling to `SchedulerRegistry` for a per-instance job.
 *
 * Tunables live in `envConfig().aiBalancer`.
 */
@Injectable()
export class KeyHealthService implements OnModuleInit, OnModuleDestroy {
    /** Handle for the initial `setTimeout` — cleared if shutdown lands first. */
    private initialDelayHandle: NodeJS.Timeout | null = null
    /** Handle for the recurring `setInterval` — cleared on shutdown. */
    private intervalHandle: NodeJS.Timeout | null = null

    constructor(
        private readonly keyStoreService: KeyStoreService,
        private readonly axiosService: AxiosService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Schedule the initial sweep + recurring interval.
     *
     * Picks a **random jitter in `[0, intervalMs)`** so a fleet of pods
     * starting together don't all hit the provider at the same instant.
     * After the jitter fires the first sweep, `setInterval` takes over for
     * steady-state polling.
     */
    onModuleInit(): void {
        const {
            healthCheckIntervalMs,
        } = envConfig().aiBalancer

        // random jitter [0, intervalMs) — spreads pod boot across one full period
        const jitterMs = Math.floor(Math.random() * healthCheckIntervalMs)

        this.initialDelayHandle = setTimeout(
            () => {
                // initial sweep (don't await — caller is a timer callback)
                void this.runHealthCheck()

                // recurring sweeps after the first one
                this.intervalHandle = setInterval(
                    () => {
                        void this.runHealthCheck()
                    },
                    healthCheckIntervalMs,
                )
            },
            jitterMs,
        )
    }

    /**
     * Clear both timers so Jest / graceful shutdown don't leak.
     */
    onModuleDestroy(): void {
        if (this.initialDelayHandle) {
            clearTimeout(this.initialDelayHandle)
            this.initialDelayHandle = null
        }
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle)
            this.intervalHandle = null
        }
    }

    /**
     * One full pass — walk every provider in the pool and probe each key.
     *
     * Public so admin GraphQL / debug tooling can trigger a manual sweep
     * without waiting for the next tick.
     */
    async runHealthCheck(): Promise<void> {
        // walk every provider currently in the pool
        const providers = this.keyStoreService.listProviders()
        for (const { provider } of providers) {
            await this.checkProvider(provider)
        }
    }

    /**
     * Check every key of one provider.
     *
     * @param provider - target provider
     */
    async checkProvider(provider: ModelProvider): Promise<void> {
        const pool = this.keyStoreService.getPool(provider)
        for (const state of pool) {
            // active keys → ping; disabled keys → only ping if past recovery wait
            if (state.status === KeyStatus.Active) {
                await this.probeActive(state)
            } else if (state.status === KeyStatus.Disabled && this.isPastRecoveryWindow(state)) {
                await this.probeRecovery(state)
            }
        }
    }

    /**
     * Externally-callable mark-failure used by `AiBalancerService` when a real
     * request to the provider fails (e.g. 429 / 401). Increments `failCount`
     * and disables when threshold is reached.
     *
     * @param state - the picked key state mutated in place
     * @param reason - short error string captured from the failed call
     */
    markFailure(state: KeyState, reason: string): void {
        state.failCount += 1
        state.lastUsedAt = new Date()

        // reach threshold → flip to Disabled
        const {
            failureThresholdToDisable,
        } = envConfig().aiBalancer
        if (state.failCount >= failureThresholdToDisable) {
            this.disable(
                state,
                reason,
            )
        }
    }

    /**
     * Externally-callable mark-success used by `AiBalancerService` after a
     * successful provider call. Resets the failure counter on the key.
     */
    markSuccess(state: KeyState): void {
        state.failCount = 0
        state.lastUsedAt = new Date()
    }

    /**
     * Ping one key with a zero-token endpoint of the provider.
     *
     * @param params - provider + key value
     * @returns Whether the ping succeeded plus the captured error message on failure
     */
    async pingKey({
        provider,
        key,
    }: PingKeyParams): Promise<PingKeyResult> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.pingOpenAi(key)
        case ModelProvider.Gemini:
            return this.pingGemini(key)
        case ModelProvider.Claude:
            return this.pingClaude(key)
        default:
            return {
                success: false,
                errorMessage: `unsupported provider ${provider}`,
            }
        }
    }

    /**
     * Probe an active key. Failure increments `failCount`; reaching the
     * threshold disables the key. Success resets the counter.
     */
    private async probeActive(state: KeyState): Promise<void> {
        const result = await this.pingKey({
            provider: state.provider,
            key: state.value,
        })
        state.lastHealthCheckAt = new Date()

        if (result.success) {
            // success — reset counter, keep active
            state.failCount = 0
            return
        }

        // failure — increment, maybe disable
        state.failCount += 1
        const {
            failureThresholdToDisable,
        } = envConfig().aiBalancer
        if (state.failCount >= failureThresholdToDisable) {
            this.disable(
                state,
                result.errorMessage ?? "unknown ping failure",
            )
        }
    }

    /**
     * Probe a disabled key that has been parked for at least the recovery
     * wait. Success → flip back to Active + reset counter.
     */
    private async probeRecovery(state: KeyState): Promise<void> {
        // mark probing so concurrent rotation does not pick the key mid-test
        state.status = KeyStatus.Probing
        const result = await this.pingKey({
            provider: state.provider,
            key: state.value,
        })
        state.lastHealthCheckAt = new Date()

        if (result.success) {
            state.status = KeyStatus.Active
            state.failCount = 0
            state.disabledAt = null
            this.winstonService.log(
                WinstonLog.AiBalancerKeyRecovered,
                {
                    provider: state.provider,
                    keySuffix: state.keySuffix,
                },
            )
        } else {
            // still bad — leave disabled (revert from probing)
            state.status = KeyStatus.Disabled
        }
    }

    /**
     * Whether enough wall-clock has elapsed since `disabledAt` to retry the key.
     */
    private isPastRecoveryWindow(state: KeyState): boolean {
        if (!state.disabledAt) {
            return true
        }
        const {
            recoveryWaitMs,
        } = envConfig().aiBalancer
        return Date.now() - state.disabledAt.getTime() >= recoveryWaitMs
    }

    /**
     * Flip a key to Disabled, stamp `disabledAt`, log.
     */
    private disable(state: KeyState, reason: string): void {
        state.status = KeyStatus.Disabled
        state.disabledAt = new Date()
        this.winstonService.log(
            WinstonLog.AiBalancerKeyDisabled,
            {
                provider: state.provider,
                keySuffix: state.keySuffix,
                failCount: state.failCount,
                reason: reason.slice(
                    0,
                    ERROR_MESSAGE_MAX_LEN,
                ),
            },
        )
    }

    /**
     * Ping OpenAI with a given key — uses `/v1/models` (zero tokens).
     */
    private async pingOpenAi(key: string): Promise<PingKeyResult> {
        try {
            const client = new OpenAI({
                apiKey: key,
            })
            const models = await client.models.list()
            return {
                success: models.data.length > 0,
                errorMessage: null,
            }
        } catch (err) {
            return {
                success: false,
                errorMessage: this.toErrorMessage(err),
            }
        }
    }

    /**
     * Ping Gemini with a given key — uses `listModels` REST (zero tokens).
     */
    private async pingGemini(key: string): Promise<PingKeyResult> {
        try {
            const axios = this.axiosService.create({
                key: "ai-balancer-gemini-ping",
            })
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
            )
            return {
                success: response.status >= 200 && response.status < 300,
                errorMessage: null,
            }
        } catch (err) {
            return {
                success: false,
                errorMessage: this.toErrorMessage(err),
            }
        }
    }

    /**
     * Ping Anthropic Claude with a given key — uses `/v1/models` (zero tokens).
     */
    private async pingClaude(key: string): Promise<PingKeyResult> {
        try {
            const axios = this.axiosService.create({
                key: "ai-balancer-claude-ping",
            })
            const response = await axios.get(
                "https://api.anthropic.com/v1/models",
                {
                    headers: {
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    },
                },
            )
            return {
                success: response.status >= 200 && response.status < 300,
                errorMessage: null,
            }
        } catch (err) {
            return {
                success: false,
                errorMessage: this.toErrorMessage(err),
            }
        }
    }

    /**
     * Normalize an unknown thrown value into a short string.
     */
    private toErrorMessage(err: unknown): string {
        if (err instanceof Error) {
            return err.message.slice(
                0,
                ERROR_MESSAGE_MAX_LEN,
            )
        }
        return String(err).slice(
            0,
            ERROR_MESSAGE_MAX_LEN,
        )
    }
}
