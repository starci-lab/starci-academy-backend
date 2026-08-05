/** AI Balancer log messages. */

export interface SeederFinishedMessage {
    /** Seeder name (e.g. "ai-models", "courses"). */
    seeder: string
    /** Rows upserted in this pass. */
    upserted: number
}

/** Key store reread the mount file -- rotation now uses the new key set. */
export interface AiBalancerKeysReloadedMessage {
    /** Provider whose keys were reloaded. */
    provider: string
    /** Total keys in the mount file after reload. */
    keysCount: number
    /** Path of the mount file. */
    keysFilePath: string
}

/** A key crossed the failure threshold and is out of rotation until it recovers. */
export interface AiBalancerKeyDisabledMessage {
    provider: string
    /** Last 4 chars of the key (rest masked). */
    keySuffix: string
    /** Consecutive failure count that triggered the disable. */
    failCount: number
    /** Reason / latest error message. */
    reason: string
}

/** A previously disabled key succeeded again and is back in the rotation pool. */
export interface AiBalancerKeyRecoveredMessage {
    provider: string
    keySuffix: string
}

/** Rotation selected this key for the next call -- active count shows remaining headroom. */
export interface AiBalancerKeyPickedMessage {
    provider: string
    keySuffix: string
    /** Total active keys for the provider at pick time. */
    activeKeysCount: number
}

/**
 * Every key for the provider is disabled -- callers will fail until one recovers or is
 * reloaded.
 */
export interface AiBalancerNoActiveKeyMessage {
    provider: string
    /** Total keys (any status) seen for the provider. */
    totalKeysCount: number
}
