import type {
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import type {
    AiJobSelection,
} from "../types"

/** Loose model-pick fields carried on a GraphQL input (mirrors the submit-challenge shape). */
export interface FlatAiSelectionFields {
    /** Concrete model the learner picked; absent → balancer picks. */
    selectedModel?: string
    /** Provider serving the picked model; required together with `selectedModel`. */
    selectedModelProvider?: ModelProvider
}

/**
 * Maps the loose `selectedModel` / `selectedModelProvider` fields carried on a
 * GraphQL mutation input into the {@link AiJobSelection} the business layer
 * expects.
 *
 * A model + provider pins that model; neither → undefined (the caller treats
 * undefined as "balancer picks"). The downstream
 * `resolveGradingInvokeOptions` / `GradingLaneValidationService.validate` calls
 * re-validate the pairing against the catalog, so this only shapes the object.
 *
 * @param fields - The loose model-pick fields from the mutation input.
 * @returns The selection, or undefined when no model was pinned.
 * @throws AiByokInvalidException when a model is supplied without its provider (or vice-versa).
 */
export function flatFieldsToAiJobSelection(
    fields: FlatAiSelectionFields,
): AiJobSelection | undefined {
    const {
        selectedModel,
        selectedModelProvider,
    } = fields
    // nothing pinned → let the caller apply the balancer default
    if (!selectedModel && !selectedModelProvider) {
        return undefined
    }
    // a model pin requires both the model AND its provider together
    if (!selectedModel || !selectedModelProvider) {
        throw new AiByokInvalidException({
            reason: "a pinned model requires both a model and a provider",
        })
    }
    return {
        model: selectedModel,
        provider: selectedModelProvider,
    }
}
