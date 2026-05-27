import {
    Injectable,
} from "@nestjs/common"
import {
    KeyStatus,
} from "../enums"
import type {
    AcquiredKeyHandle,
    AcquireKeyParams,
    AcquireKeyResult,
    HealthSnapshotResult,
    KeyHealthInfo,
    KeyState,
    MarkFailureParams,
    MarkSuccessParams,
    ProviderHealthSnapshot,
} from "../types"
import {
    KeyHealthService,
} from "./key-health.service"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStoreService,
} from "./key-store.service"

/**
 * Public façade of the AI Balancer feature.
 *
 * Consumers use this single service for the full lifecycle of a key:
 *
 * 1. `acquire({ provider })` — get next active key + opaque handle.
 * 2. Call upstream provider with `value`.
 * 3. `markSuccess({ handle })` on 2xx, `markFailure({ handle, reason })` on
 *    quota / auth / network error.
 *
 * Internally delegates to {@link KeyStoreService} (where the pool lives),
 * {@link KeyRotatorService} (round-robin pick) and {@link KeyHealthService}
 * (failure counter, disable/recover transitions).
 *
 * @example
 * const { value, handle } = await balancer.acquire({ provider: ModelProvider.OpenAI })
 * try {
 *     const result = await callOpenAi(value, prompt)
 *     balancer.markSuccess({ handle })
 *     return result
 * } catch (err) {
 *     balancer.markFailure({ handle, reason: err.message })
 *     throw err
 * }
 */
@Injectable()
export class AiBalancerService {
    constructor(
        private readonly keyStoreService: KeyStoreService,
        private readonly keyRotatorService: KeyRotatorService,
        private readonly keyHealthService: KeyHealthService,
    ) { }

    /**
     * Pick the next active key for a provider.
     *
     * @param params - target provider
     * @returns Raw key value + opaque handle for later mark* calls
     * @throws NoActiveBalancerKeyException when no active key is available
     */
    async acquire({
        provider,
    }: AcquireKeyParams): Promise<AcquireKeyResult> {
        // delegate round-robin pick
        const {
            state,
        } = await this.keyRotatorService.next({
            provider,
        })

        return {
            value: state.value,
            handle: {
                provider: state.provider,
                keySuffix: state.keySuffix,
            },
        }
    }

    /**
     * Record a successful provider call against a previously-acquired key.
     *
     * Resets the failure counter so transient hiccups don't accumulate.
     */
    markSuccess({
        handle,
    }: MarkSuccessParams): void {
        const state = this.findState(handle)
        if (state) {
            this.keyHealthService.markSuccess(state)
        }
    }

    /**
     * Record a failed provider call. Pushes the key one step closer to
     * `Disabled`; when the threshold (env-configurable) is hit the health
     * service flips the state.
     */
    markFailure({
        handle,
        reason,
    }: MarkFailureParams): void {
        const state = this.findState(handle)
        if (state) {
            this.keyHealthService.markFailure(
                state,
                reason,
            )
        }
    }

    /**
     * Read-only snapshot of every provider's pool for admin UI / GraphQL.
     *
     * Never exposes raw key values — only the 4-char suffix.
     *
     * @returns Per-provider summary with total/active/disabled counts
     */
    healthSnapshot(): HealthSnapshotResult {
        const providers = this.keyStoreService.listProviders()
        const snapshots: Array<ProviderHealthSnapshot> = providers.map(({
            provider,
            keysFilePath,
        }) => {
            const pool = this.keyStoreService.getPool(provider)

            // tally counts
            const activeKeys = pool.filter((key) => key.status === KeyStatus.Active).length
            const disabledKeys = pool.filter((key) => key.status === KeyStatus.Disabled).length

            // strip raw `value` from each key
            const keys: Array<KeyHealthInfo> = pool.map((key) => ({
                provider: key.provider,
                keySuffix: key.keySuffix,
                status: key.status,
                failCount: key.failCount,
                lastUsedAt: key.lastUsedAt,
                lastHealthCheckAt: key.lastHealthCheckAt,
                disabledAt: key.disabledAt,
            }))

            return {
                provider,
                keysFilePath,
                totalKeys: pool.length,
                activeKeys,
                disabledKeys,
                keys,
            }
        })

        return {
            providers: snapshots,
        }
    }

    /**
     * Force a fresh load from disk (admin op when ops adds a key).
     */
    async reload(): Promise<void> {
        await this.keyStoreService.reloadAll()
    }

    /**
     * Look up the live `KeyState` reference from an opaque handle.
     *
     * Returns `undefined` when the key was removed (e.g. mount file edited)
     * between acquire and mark* — callers tolerate that silently.
     */
    private findState({
        provider,
        keySuffix,
    }: AcquiredKeyHandle): KeyState | undefined {
        return this.keyRotatorService.findBySuffix(
            provider,
            keySuffix,
        )
    }
}
