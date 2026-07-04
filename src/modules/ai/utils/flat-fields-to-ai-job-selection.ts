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
    /** Concrete model the learner picked (Premium only). */
    selectedModel?: string
    /** Provider serving the picked model (Premium only). */
    selectedModelProvider?: ModelProvider
}

/**
 * Maps the loose `mode` / `selectedModel` / `selectedModelProvider`
 * fields carried on a GraphQL mutation input into the discriminated
 * {@link AiJobSelection} the business layer expects.
 *
 * Mirrors the submit-challenge flow: `Auto` (or absent mode) carries no model;
 * `Premium` requires a model + provider. The downstream
 * `resolveGradingInvokeOptions` / `GradingLaneValidationService.validate` calls
 * re-validate the pairing against the catalog, so this only shapes the union.
 *
 * @param fields - The loose lane fields from the mutation input.
 * @returns The discriminated selection, or undefined when no lane was supplied
 *   (the caller treats undefined as the Auto default).
 * @throws AiByokInvalidException when a Premium lane omits its model or provider.
 */
export function flatFieldsToAiJobSelection(
    fields: FlatAiSelectionFields,
): AiJobSelection | undefined {
    const {
        mode,
        selectedModel,
        selectedModelProvider,
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
    // Premium → requires a concrete model + provider pairing
    if (!selectedModel || !selectedModelProvider) {
        throw new AiByokInvalidException({
            reason: `${mode} lane requires a model and provider`,
        })
    }
    return {
        mode: AiMode.Premium,
        model: selectedModel,
        provider: selectedModelProvider,
    }
}
