import {
    AiMode,
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import type {
    AiEntitlementService,
} from "../ai-entitlement.service"
import type {
    AiInvokeByok,
    AiJobSelection,
} from "../types"
import {
    pickBestCategory,
} from "./pick-best-category"

/**
 * Categories the free Auto lane grades on. The balancer loops them by priority
 * (low→high): the self-hosted `local` Qwen (Free tier, 0 credit) sits at the
 * top and is tried first; when it is unreachable (host off) the loop falls
 * through to the Economy cloud models automatically. This is the no-plan tier
 * set — Balanced/Premium require an explicit Premium pick.
 */
const AUTO_GRADING_CATEGORIES = [
    AiModelCategory.Free,
    AiModelCategory.Economy,
]

/** Params for {@link resolveGradingInvokeOptions}. */
export interface ResolveGradingInvokeOptionsParams {
    /** Submitter whose entitlement gates the requested lane. */
    userId: string
    /** The user's lane + model pick from the job payload (absent → Auto). */
    selection?: AiJobSelection
    /** Entitlement resolver injected by the caller (avoids circular DI). */
    aiEntitlementService: AiEntitlementService
    /**
     * Whether this content type may grade on the free Auto lane (Qwen + economy).
     * Default `true`. Set `false` for premium-only content (e.g. CV review):
     * an absent/Auto pick is then forced onto the Premium lane, so a user with
     * no paid entitlement is rejected instead of grading free.
     */
    allowFreeAuto?: boolean
}

/** Partial {@link AiInvokeParams} derived from entitlement + selection. */
export interface ResolveGradingInvokeOptionsResult {
    /** Single-category filter for the Premium pooled invoke. */
    category?: AiModelCategory
    /** Multi-category set for the Auto lane (loops low→high within these tiers). */
    categories?: Array<AiModelCategory>
    /** BYOK descriptor when the user runs on their own key. */
    byok?: AiInvokeByok
    /** User-pinned model (Premium lane only). */
    model?: string
    /** Provider for {@link ResolveGradingInvokeOptionsResult.model}. */
    provider?: ModelProvider
}

/**
 * Map a job's {@link AiJobSelection} + user entitlement to {@link AiInvokeService.invoke} args.
 *
 * The lane is driven strictly by the user's `selection` — there is NO downgrade:
 * a Premium/BYOK pick the user is not entitled to throws (the entitlement resolver
 * rejects it), and a BYOK pick with no usable key throws. Only an absent or `Auto`
 * selection runs the load-balanced Economy lane.
 *
 * @param params - User id, selection, and entitlement service.
 * @returns Invoke args (`byok`, or `category` + optional pinned Premium model).
 * @throws AiModeNotEntitledException when the user is not entitled to the picked lane.
 * @throws AiByokInvalidException when a BYOK pick has no inline or stored key.
 */
export async function resolveGradingInvokeOptions(
    {
        userId,
        selection,
        aiEntitlementService,
        allowFreeAuto = true,
    }: ResolveGradingInvokeOptionsParams,
): Promise<ResolveGradingInvokeOptionsResult> {
    // absent pick or explicit Auto
    const wantsAuto = !selection || selection.mode === AiMode.Auto

    // free Auto lane (default): the balancer loops the Economy/complimentary
    // chain (local Qwen first → economy cloud fallback). Skipped for premium-only
    // content, which forces the Premium lane below.
    if (wantsAuto && allowFreeAuto) {
        return {
            categories: AUTO_GRADING_CATEGORIES,
        }
    }

    // a one-shot inline key only exists on a BYOK selection
    const inlineKey = selection?.mode === AiMode.Byok
        ? selection.apiKey?.trim()
        : undefined

    // premium-only content with an Auto/absent pick → require a paid entitlement
    // (resolve below throws for an unentitled user). Otherwise honor the pick.
    const requestedMode = (!wantsAuto && selection)
        ? selection.mode
        : AiMode.Premium

    // gate the requested lane — throws (no downgrade) when the user is not entitled
    const entitlement = await aiEntitlementService.resolve({
        userId,
        requestedMode,
        // an inline key lets BYOK run even without a stored subscription key
        ephemeralByok: selection?.mode === AiMode.Byok
            && Boolean(inlineKey),
    })

    // BYOK → bypass the pool and run on the user's own key (inline or stored)
    if (selection?.mode === AiMode.Byok) {
        // prefer the inline key; otherwise load the encrypted key on the subscription
        const key = inlineKey
            ?? await aiEntitlementService.getByokApiKey({
                userId,
            })
        // no usable key → fail loudly instead of silently dropping to Auto
        if (!key) {
            throw new AiByokInvalidException({
                reason: "no BYOK key on file — add a key in AI settings or pass apiKey",
            })
        }
        return {
            byok: {
                provider: selection.provider,
                model: selection.model,
                key,
            },
        }
    }

    // Premium (or premium-forced for premium-only content) → grade on the best
    // unlocked category, honoring the user's pinned model when they explicitly
    // picked Premium (an Auto/absent pick forced here has no pinned model)
    const pinned = selection?.mode === AiMode.Premium ? selection : undefined
    return {
        category: pickBestCategory(entitlement.allowedCategories),
        model: pinned?.model,
        provider: pinned?.provider,
    }
}
