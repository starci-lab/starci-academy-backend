import type {
    EntityManager,
} from "typeorm"
import type {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    AiSubTier,
} from "@modules/databases"

/** A user's resolved AI entitlement after lazy window reset. */
export interface AiEntitlement {
    /** Categories the user may invoke at this moment. */
    allowedCategories: Array<AiModelCategory>
    /** Remaining platform credits in the 5h window (tier overrides free base). */
    creditRemaining5h: number
    /** Remaining platform credits in the weekly window (tier overrides free base). */
    creditRemainingWeek: number
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
 * User-facing AI settings — the capabilities that gate which models the UI may
 * offer (unlock + active tier).
 */
export interface AiSettings {
    /** Whether the user may use paid-tier models (paid OR enrolled). */
    canPremium: boolean
    /** Active paid tier, or null on the free lane. */
    tier: AiSubTier | null
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
}

/** Params for {@link AiEntitlementService.consume}. */
export interface ConsumeEntitlementParams {
    /** Owner of the entitlement. */
    userId: string
    /** Credits to debit from the unified pool. */
    cost: number
    /** AI surface this charge is for (chatbot / grading / interview) — labels the history row. */
    surface: AiCeilSurface
    /** Concrete model that served, when known (e.g. Auto free-chain fallback); null/omit for a plain Auto pick with no attribution. */
    model?: string | null
    /** Provider of {@link model}. */
    provider?: string | null
    /** Model-recommendation tier billed (low / medium / high) for a Premium pick; null for Auto. */
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
    /** Model-recommendation tier billed (low / medium / high); null when unattributed. */
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

/** Params for {@link AiEntitlementService.grantBonusCredit}. */
export interface GrantBonusCreditParams {
    /** Owner of the entitlement. */
    userId: string
    /** Bonus credit to add to the 5h window. */
    amount5h: number
    /** Bonus credit to add to the weekly window. */
    amountWeek: number
    /** Share the caller's transaction (e.g. the reward-redemption txn). */
    entityManager: EntityManager
}

/** Result of {@link AiEntitlementService.grantBonusCredit}. */
export interface GrantBonusCreditResult {
    /** Post-grant bonus credit in the 5h window. */
    bonusCredit5h: number
    /** Post-grant bonus credit in the weekly window. */
    bonusCreditWeek: number
}

/** Params for {@link AiEntitlementService.resolveCeil}. */
export interface ResolveCeilParams {
    /** Owner of the ceiling overrides. */
    userId: string
    /** Surface to resolve the ceiling for; omit for just the global default. */
    surface?: AiCeilSurface
}

/** Params for {@link AiEntitlementService.setCeil}. */
export interface SetCeilParams {
    /** Owner of the ceiling overrides. */
    userId: string
    /** Surface to set the ceiling for; omit for the global default. */
    surface?: AiCeilSurface | null
    /** Ceiling category to set; null clears the override. */
    category?: AiModelCategory | null
}
