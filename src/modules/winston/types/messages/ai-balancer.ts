/** AI Balancer log messages. */

export interface SeederFinishedMessage {
    /** Seeder name (e.g. "ai-models", "courses"). */
    seeder: string
    /** Rows upserted in this pass. */
    upserted: number
}

export interface AiBalancerKeysReloadedMessage {
    /** Provider whose keys were reloaded. */
    provider: string
    /** Total keys in the mount file after reload. */
    keysCount: number
    /** Path of the mount file. */
    keysFilePath: string
}

export interface AiBalancerKeyDisabledMessage {
    provider: string
    /** Last 4 chars of the key (rest masked). */
    keySuffix: string
    /** Consecutive failure count that triggered the disable. */
    failCount: number
    /** Reason / latest error message. */
    reason: string
}

export interface AiBalancerKeyRecoveredMessage {
    provider: string
    keySuffix: string
}

export interface AiBalancerKeyPickedMessage {
    provider: string
    keySuffix: string
    /** Total active keys for the provider at pick time. */
    activeKeysCount: number
}

export interface AiBalancerNoActiveKeyMessage {
    provider: string
    /** Total keys (any status) seen for the provider. */
    totalKeysCount: number
}
