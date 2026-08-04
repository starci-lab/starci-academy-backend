import {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import type {
    AiEntitlementService,
} from "../ai-entitlement.service"
import type {
    AiJobSelection,
} from "../types"
import {
    GRADING_FLOOR_CATEGORY,
    resolveGradingChain,
} from "./resolve-grading-chain"

/** Params for {@link resolveGradingInvokeOptions}. */
export interface ResolveGradingInvokeOptionsParams {
    /** Submitter whose entitlement gates the requested lane + tier ceiling. */
    userId: string
    /** The user's model pick from the job payload (absent → balancer picks). */
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
    /** User-pinned model (System Manual — an explicit model pick). */
    model?: string
    /** Provider for {@link ResolveGradingInvokeOptionsResult.model}. */
    provider?: ModelProvider
}

/**
 * Map a job's {@link AiJobSelection} + difficulty + user entitlement to
 * {@link AiInvokeService.invoke} args — the ONE shared grading routing.
 *
 * Grading runs ONLY on the System pool. Two selection paths:
 * - **pinned model** → a user-pinned model + provider (gated on the unlock).
 *   This is the ONLY way to reach the frontier model.
 * - **balancer** (default, no pin) → {@link GRADING_FLOOR_CATEGORY}, whatever
 *   the task's difficulty; within that category the balancer tries the
 *   highest-weight (cheapest, roomiest) model first. Nothing automatic
 *   escalates past it.
 *
 * @param params - user id, selection, entitlement service.
 * @returns the invoke args.
 * @throws AiModeNotEntitledException when a pinned/premium-only run is not entitled.
 */
export async function resolveGradingInvokeOptions(
    {
        userId,
        selection,
        aiEntitlementService,
        allowFreeAuto = true,
        floor,
        ceil,
    }: ResolveGradingInvokeOptionsParams,
): Promise<ResolveGradingInvokeOptionsResult> {
    // premium-only content (no free Auto) or a pinned model → require unlock
    // (paid OR enrolled — the StarCi rule; throws for an unentitled user, no
    // silent downgrade). Enrolled learners may pin a higher model too.
    const hasPinnedModel = Boolean(selection?.model && selection?.provider)
    const requiresPaid = !allowFreeAuto
    if (hasPinnedModel || requiresPaid) {
        await aiEntitlementService.assertCanUsePaidModels({
            userId,
        })
    }

    // a pinned model (user picked a concrete model + provider) wins
    if (hasPinnedModel && selection?.model && selection.provider) {
        return {
            model: selection.model,
            provider: selection.provider,
        }
    }

    // floor → climb chain, clamped to the tier ceiling (and the user `ceil` cap)
    const tierCategories = await aiEntitlementService.resolveTierCategories({
        userId,
    })
    // explicit `floor` wins; otherwise every automatic grading run — any
    // difficulty, any surface — starts (and ends) on the same grading category.
    // The frontier model is reached only by pinning it above.
    const effectiveFloor = floor ?? GRADING_FLOOR_CATEGORY
    return {
        categories: resolveGradingChain({
            floor: effectiveFloor,
            tierCategories,
            ceil,
        }),
    }
}
