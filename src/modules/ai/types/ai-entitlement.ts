import type {
    AiMode,
    AiModelCategory,
    AiSubTier,
    ModelProvider,
} from "@modules/databases"

/** A user's resolved AI entitlement after lazy window reset. */
export interface AiEntitlement {
    /** Which lane the user is on right now. */
    mode: AiMode
    /** Categories the user may invoke at this moment. */
    allowedCategories: Array<AiModelCategory>
    /** Remaining Auto uses ("lượt") in the 5h window. */
    autoRemaining5h: number
    /** Remaining Auto uses ("lượt") in the weekly window. */
    autoRemainingWeek: number
    /** Remaining Premium credits in the 5h window. */
    creditRemaining5h: number
    /** Remaining Premium credits in the weekly window. */
    creditRemainingWeek: number
    /** BYOK provider, or null when the user is not bringing their own key. */
    byokProvider: ModelProvider | null
}

/** Auto-lane ("lượt") quota for one user, per window. */
export interface AiAutoQuota {
    /** Max Auto uses allowed in the 5h window. */
    limit5h: number
    /** Auto uses consumed in the current 5h window. */
    used5h: number
    /** Remaining Auto uses in the 5h window (`limit − used`, floored at 0). */
    remaining5h: number
    /** Max Auto uses allowed in the weekly window. */
    limitWeek: number
    /** Auto uses consumed in the current weekly window. */
    usedWeek: number
    /** Remaining Auto uses in the weekly window. */
    remainingWeek: number
}

/** Premium-lane (credit) quota for one user, per window. */
export interface AiPremiumQuota {
    /** Credit cap in the 5h window (0 when no active tier). */
    limit5h: number
    /** Credits consumed in the current 5h window. */
    used5h: number
    /** Remaining credits in the 5h window. */
    remaining5h: number
    /** Credit cap in the weekly window (0 when no active tier). */
    limitWeek: number
    /** Credits consumed in the current weekly window. */
    usedWeek: number
    /** Remaining credits in the weekly window. */
    remainingWeek: number
}

/** Full per-user quota snapshot for the UI (both lanes + reset times). */
export interface AiQuotaSnapshot {
    /** Natural lane the user is on right now. */
    mode: AiMode
    /** Active paid tier, or null on the free lane. */
    tier: AiSubTier | null
    /** Free Auto-lane (complimentary) quota. */
    auto: AiAutoQuota
    /** Paid Premium-lane (credit) quota. */
    premium: AiPremiumQuota
    /** When the 5h window rolls over (counters reset to 0). */
    window5hResetAt: Date | null
    /** When the weekly window rolls over. */
    windowWeekResetAt: Date | null
}

/**
 * User-facing AI settings — the saved lane preference plus the capabilities
 * that gate which lanes the UI may offer. Never exposes the raw BYOK key.
 */
export interface AiSettings {
    /** Lane the user chose by default; null = follow natural order. */
    preferredMode: AiMode | null
    /** Lane the user actually runs on right now (preference, validated). */
    effectiveMode: AiMode
    /** Whether the paid Premium lane is currently usable. */
    canPremium: boolean
    /** Whether a BYOK key is on file (so the byok lane is selectable). */
    canByok: boolean
    /** Provider of the BYOK key on file, or null when none. */
    byokProvider: ModelProvider | null
    /** Whether an encrypted BYOK key is stored (key itself never leaves). */
    hasByokKey: boolean
    /** Active paid tier, or null on the free lane. */
    tier: AiSubTier | null
}

/** Params for {@link AiEntitlementService.updateSettings}. */
export interface UpdateAiSettingsParams {
    /** Owner of the entitlement. */
    userId: string
    /** Lane to make the user's default; omitted = leave the preference as-is. */
    mode?: AiMode
    /** BYOK provider to store (required alongside `byokApiKey`). */
    byokProvider?: ModelProvider
    /** Plaintext BYOK API key to encrypt + store. */
    byokApiKey?: string
    /** When true, wipe any stored BYOK key + provider. */
    clearByok?: boolean
}

/** Params for {@link AiEntitlementService.grantTier}. */
export interface GrantTierParams {
    /** Owner of the entitlement. */
    userId: string
    /** Paid tier to grant. */
    tier: AiSubTier
    /** Pending transaction to mark succeeded once the tier is granted. */
    transactionId: string
}

/** Params for {@link AiEntitlementService.resolve}. */
export interface ResolveEntitlementParams {
    /** Owner of the entitlement. */
    userId: string
    /**
     * Lane the caller picked when enqueuing the job. When omitted the natural
     * mode is used (byok → premium → auto, by capability). When set it is
     * validated against the user's capabilities and wins.
     */
    requestedMode?: AiMode
    /**
     * When true, {@link AiMode.Byok} is allowed without a stored subscription key
     * (the plaintext key is supplied on the job payload instead).
     */
    ephemeralByok?: boolean
}

/** Params for {@link AiEntitlementService.consume}. */
export interface ConsumeEntitlementParams {
    /** Owner of the entitlement. */
    userId: string
    /** Lane that ran — only {@link AiMode.Premium} debits the tier credit pool. */
    mode: AiMode
    /** Credits to debit from the Premium pool (ignored for Auto / Byok). */
    cost: number
}
