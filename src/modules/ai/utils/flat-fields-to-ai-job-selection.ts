import {
    AiMode,
} from "@modules/databases"
import type {
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import type {
    AiJobSelection,
} from "../types"

/** Loose AI-lane fields carried on a GraphQL input (mirrors the submit-challenge shape). */
export interface FlatAiSelectionFields {
    /** AI lane the learner picked (absent → Auto). */
    mode?: AiMode
    /** Concrete model the learner picked (Premium / BYOK only). */
    selectedModel?: string
    /** Provider serving the picked model (Premium / BYOK only). */
    selectedModelProvider?: ModelProvider
    /** One-shot inline BYOK key (BYOK only). */
    byokApiKey?: string
}

/**
 * Maps the loose `mode` / `selectedModel` / `selectedModelProvider` /
 * `byokApiKey` fields carried on a GraphQL mutation input into the discriminated
 * {@link AiJobSelection} the business layer expects.
 *
 * Mirrors the submit-challenge flow: `Auto` (or absent mode) carries no model;
 * `Premium` / `Byok` require a model + provider. The downstream
 * `resolveGradingInvokeOptions` / `GradingLaneValidationService.validate` calls
 * re-validate the pairing against the catalog, so this only shapes the union.
 *
 * @param fields - The loose lane fields from the mutation input.
 * @returns The discriminated selection, or undefined when no lane was supplied
 *   (the caller treats undefined as the Auto default).
 * @throws AiByokInvalidException when a Premium / BYOK lane omits its model or provider.
 */
export function flatFieldsToAiJobSelection(
    fields: FlatAiSelectionFields,
): AiJobSelection | undefined {
    const {
        mode,
        selectedModel,
        selectedModelProvider,
        byokApiKey,
    } = fields
    // no lane supplied → let the caller apply the Auto default
    if (mode === undefined) {
        return undefined
    }
    // Auto → the balancer picks the model; nothing to pin
    if (mode === AiMode.Auto) {
        return {
            mode: AiMode.Auto,
        }
    }
    // Premium / BYOK → both require a concrete model + provider pairing
    if (!selectedModel || !selectedModelProvider) {
        throw new AiByokInvalidException({
            reason: `${mode} lane requires a model and provider`,
        })
    }
    if (mode === AiMode.Premium) {
        return {
            mode: AiMode.Premium,
            model: selectedModel,
            provider: selectedModelProvider,
        }
    }
    // BYOK → carry the model/provider plus the inline key when supplied this run
    return {
        mode: AiMode.Byok,
        model: selectedModel,
        provider: selectedModelProvider,
        ...(byokApiKey !== undefined ? {
            apiKey: byokApiKey,
        } : {
        }),
    }
}
