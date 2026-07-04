import type {
    AiCeilSurface,
    AiMode,
    AiModelCategory,
    AiModelTask,
    AiSubTier,
    ModelProvider,
} from "@modules/databases"

/** A user's resolved AI entitlement after lazy window reset. */
export interface AiEntitlement {
    /** Which lane the user is on right now. */
    mode: AiMode
    /** Categories the user may invoke at this moment. */
    allowedCategories: Array<AiModelCategory>
    /** Remaining platform credits in the 5h window (tier overrides free base). */
    creditRemaining5h: number
    /** Remaining platform credits in the weekly window (tier overrides free base). */
    creditRemainingWeek: number
    /** BYOK provider, or null when the user is not bringing their own key. */
    byokProvider: ModelProvider | null
}

/** Unified platform credit quota for one user, per window. */
export interface AiCreditQuota {
    /** Credit allowance in the 5h window (tier overrides free base). */
    limit5h: number
    /** Credits consumed in the current 5h window. */
    used5h: number
    /** Remaining credits in the 5h window (`limit − used`, floored at 0). */
    remaining5h: number
    /** Credit allowance in the weekly window (tier overrides free base). */
    limitWeek: number
    /** Credits consumed in the current weekly window. */
    usedWeek: number
    /** Remaining credits in the weekly window. */
    remainingWeek: number
}

/** Per-surface model ceiling the user set (null = inherit default / no cap). */
export interface AiCeilSnapshot {
    /** Global default ceiling (null = no cap → plan ceiling only). */
    default: AiModelCategory | null
    /** Hỏi AI khi đọc bài override (null = follow default). */
    chatbot: AiModelCategory | null
    /** Chấm bài override (null = follow default). */
    grading: AiModelCategory | null
    /** Phỏng vấn thử override (null = follow default). */
    interview: AiModelCategory | null
}

/** Full per-user quota snapshot for the UI (single pool + reset times). */
export interface AiQuotaSnapshot {
    /** Natural lane the user is on right now. */
    mode: AiMode
    /** Active paid tier, or null on the free lane. */
    tier: AiSubTier | null
    /** Unified platform credit quota (tier overrides free base). */
    credit: AiCreditQuota
    /** When the 5h window rolls over (counters reset to 0). */
    window5hResetAt: Date | null
    /** When the weekly window rolls over. */
    windowWeekResetAt: Date | null
    /** Categories the user's plan unlocks — the ceiling the user caps within. */
    allowedCategories: Array<AiModelCategory>
    /** Per-surface model ceiling the user set in settings (cost control). */
    ceil: AiCeilSnapshot
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
    /** Last 4 chars of the BYOK key (log-safe masked hint), or null when none. */
    byokKeyLast4: string | null
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
    /** Lane that ran — every lane except {@link AiMode.Byok} debits the pool (Byok is also skipped in history — it's the user's own key, not platform spend). */
    mode: AiMode
    /** Credits to debit from the unified pool (ignored for Byok). */
    cost: number
    /** AI surface this charge is for (chatbot / grading / interview) — labels the history row. */
    surface: AiCeilSurface
    /** Concrete model that served, when known (e.g. Auto free-chain fallback); null/omit for a plain Auto pick with no attribution. */
    model?: string | null
    /** Provider of {@link model}. */
    provider?: string | null
    /** Model-recommendation tier billed (low / medium / high) for a Premium pick; null for Auto/Byok. */
    recommendation?: string | null
    /** Finer-grained task (challenge_grading / task_grading / cv_generating / chatting / …) than {@link surface}. */
    task?: AiModelTask | null
    /** Prompt (input) tokens the model consumed, when known. */
    promptTokens?: number | null
    /** Completion (output) tokens the model produced, when known. */
    completionTokens?: number | null
    /** Number of balancer attempts needed to get a usable response, when known. */
    attempts?: number | null
}

/** Params for {@link AiEntitlementService.history}. */
export interface EntitlementHistoryParams {
    /** Owner of the entitlement. */
    userId: string
    /** Page size. */
    limit: number
    /** Rows to skip. */
    offset: number
}

/** One AI credit charge row for {@link AiEntitlementService.history}. */
export interface EntitlementHistoryItem {
    /** Charge row id. */
    id: string
    /** AI lane the charge was billed on (auto / premium). */
    mode: AiMode
    /** Premium tier billed (low / medium / high); null for auto. */
    recommendation: string | null
    /** Concrete model billed (e.g. gpt-5-mini); null when unattributed. */
    model: string | null
    /** Provider of the billed model. */
    provider: string | null
    /** Credits charged for this run. */
    credits: number
    /** When the charge was recorded. */
    createdAt: Date
    /** AI surface (chatbot / grading / interview) that triggered this charge. */
    surface: AiCeilSurface
}

/** A page of AI credit charge rows plus the total count. */
export interface EntitlementHistoryPage {
    /** The charge rows for the requested page, newest first. */
    items: Array<EntitlementHistoryItem>
    /** Total number of charge rows for the user (across all pages). */
    total: number
}
