import {
    AiMode,
    ModelProvider,
} from "@modules/databases"
import type {
    AiModelCategory,
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
 * Model pinned for grading on the free Auto lane. gpt-4o is a reliable code
 * reviewer — far fewer false "no evidence / no source" misses than the cheapest
 * Economy / free models the balancer would otherwise pick. Must stay an enabled
 * `ai_models` row (provider {@link AUTO_GRADING_PROVIDER}).
 */
const AUTO_GRADING_MODEL = "gpt-4o"

/** Provider serving {@link AUTO_GRADING_MODEL}. */
const AUTO_GRADING_PROVIDER = ModelProvider.OpenAI

/** Params for {@link resolveGradingInvokeOptions}. */
export interface ResolveGradingInvokeOptionsParams {
    /** Submitter whose entitlement gates the requested lane. */
    userId: string
    /** The user's lane + model pick from the job payload (absent → Auto). */
    selection?: AiJobSelection
    /** Entitlement resolver injected by the caller (avoids circular DI). */
    aiEntitlementService: AiEntitlementService
}

/** Partial {@link AiInvokeParams} derived from entitlement + selection. */
export interface ResolveGradingInvokeOptionsResult {
    /** Category filter for the auto/premium pooled invoke. */
    category?: AiModelCategory
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
    }: ResolveGradingInvokeOptionsParams,
): Promise<ResolveGradingInvokeOptionsResult> {
    // no pick or explicit Auto → grade on the pinned gpt-4o (capable code reviewer),
    // not the cheapest Economy / free model the balancer would otherwise pick
    if (!selection || selection.mode === AiMode.Auto) {
        return {
            model: AUTO_GRADING_MODEL,
            provider: AUTO_GRADING_PROVIDER,
        }
    }

    // a one-shot inline key only exists on a BYOK selection
    const inlineKey = selection.mode === AiMode.Byok
        ? selection.apiKey?.trim()
        : undefined

    // gate the requested lane — throws (no downgrade) when the user is not entitled
    const entitlement = await aiEntitlementService.resolve({
        userId,
        requestedMode: selection.mode,
        // an inline key lets BYOK run even without a stored subscription key
        ephemeralByok: selection.mode === AiMode.Byok
            && Boolean(inlineKey),
    })

    // BYOK → bypass the pool and run on the user's own key (inline or stored)
    if (selection.mode === AiMode.Byok) {
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

    // Premium → grade on the best unlocked category, honoring the user's pinned model
    return {
        category: pickBestCategory(entitlement.allowedCategories),
        model: selection.model,
        provider: selection.provider,
    }
}
