import {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import type {
    AiEntitlementService,
} from "../ai-entitlement.service"
import type {
    AiInvokeByok,
    AiJobSelection,
} from "../types"
import {
    gradingFloorForDifficulty,
    resolveGradingChain,
} from "./resolve-grading-chain"

/** Params for {@link resolveGradingInvokeOptions}. */
export interface ResolveGradingInvokeOptionsParams {
    /** Submitter whose entitlement gates the requested lane + tier ceiling. */
    userId: string
    /** The user's lane + model pick from the job payload (absent → Auto). */
    selection?: AiJobSelection
    /** Entitlement resolver injected by the caller (avoids circular DI). */
    aiEntitlementService: AiEntitlementService
    /**
     * Whether this content type may grade on the free Auto lane. Default `true`.
     * `false` for premium-only content (e.g. CV review): the run is gated on a
     * paid entitlement (unpaid users are rejected) and starts from a higher floor.
     */
    allowFreeAuto?: boolean
    /**
     * Task difficulty (easy/medium/hard/insane/expert) → the FLOOR category the
     * Auto chain starts from (easy→economy … insane→frontier). The chain then
     * climbs up to the user's tier ceiling. Omitted → economy floor.
     */
    difficulty?: string | null
    /**
     * Explicit FLOOR category override (wins over `difficulty`). Used by surfaces
     * that don't have a difficulty — e.g. the chatbot passes `Free`.
     */
    floor?: AiModelCategory | null
    /**
     * User-set per-feature ceiling cap (from settings config per hạng mục): the
     * chain never climbs past this, even within the plan ceiling. Omitted → only
     * the plan ceiling caps.
     */
    ceil?: AiModelCategory | null
}

/** Partial {@link AiInvokeParams} derived from entitlement + selection. */
export interface ResolveGradingInvokeOptionsResult {
    /** Single-category filter (unused by the climb chain; kept for compatibility). */
    category?: AiModelCategory
    /** Ordered category chain the Auto lane climbs (floor → tier ceiling). */
    categories?: Array<AiModelCategory>
    /**
     * BYOK descriptor — DORMANT for grading (BYOK removed from the grading flow;
     * `resolveGradingInvokeOptions` never sets this). Kept on the type for the AI
     * Lab playground, which will re-introduce BYOK later.
     */
    byok?: AiInvokeByok
    /** User-pinned model (System Manual — an explicit model pick). */
    model?: string
    /** Provider for {@link ResolveGradingInvokeOptionsResult.model}. */
    provider?: ModelProvider
}

/**
 * Map a job's {@link AiJobSelection} + difficulty + user entitlement to
 * {@link AiInvokeService.invoke} args — the ONE shared grading routing.
 *
 * Grading runs ONLY on the System pool (BYOK was removed from grading — it may
 * return later, scoped to the AI Lab playground). Two selection modes:
 * - **System Manual** → a user-pinned model (gated on a paid entitlement).
 * - **System Auto** (default) → the **floor→climb chain**: start at the difficulty
 *   floor, climb up to the tier ceiling, within each category the balancer tries
 *   highest-weight first. Free tier caps at Economy; paid tiers climb to Frontier.
 *
 * @param params - user id, selection, difficulty, entitlement service.
 * @returns the invoke args.
 * @throws AiModeNotEntitledException when a Premium/premium-only run is not entitled.
 */
export async function resolveGradingInvokeOptions(
    {
        userId,
        selection,
        aiEntitlementService,
        allowFreeAuto = true,
        difficulty,
        floor,
        ceil,
    }: ResolveGradingInvokeOptionsParams,
): Promise<ResolveGradingInvokeOptionsResult> {
    // premium-only content (no free Auto) or an explicit Premium pick → require a
    // paid entitlement (resolve throws for an unentitled user — no silent downgrade)
    const requiresPaid = !allowFreeAuto
    if (selection?.mode === AiMode.Premium || requiresPaid) {
        await aiEntitlementService.resolve({
            userId,
            requestedMode: AiMode.Premium,
        })
    }

    // explicit pinned model (user picked Premium + a concrete model) wins
    if (selection?.mode === AiMode.Premium && selection.model && selection.provider) {
        return {
            model: selection.model,
            provider: selection.provider,
        }
    }

    // floor → climb chain, clamped to the tier ceiling (and the user `ceil` cap)
    const tierCategories = await aiEntitlementService.resolveTierCategories({
        userId,
    })
    // explicit `floor` wins; else premium-only-without-difficulty (CV) starts
    // mid-ladder; else the difficulty floor
    const effectiveFloor = floor
        ?? (requiresPaid && !difficulty
            ? AiModelCategory.Balanced
            : gradingFloorForDifficulty(difficulty))
    return {
        categories: resolveGradingChain({
            floor: effectiveFloor,
            tierCategories,
            ceil,
        }),
    }
}
