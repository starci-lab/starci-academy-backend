import type {
    AiMode,
    ModelProvider,
} from "@modules/databases"

/**
 * Auto lane — the balancer picks the model (load balancing); the user pins nothing.
 */
export interface AiJobSelectionAuto {
    /** Discriminant: free Auto lane (no user model pick). */
    mode: AiMode.Auto
}

/**
 * Premium lane — the user pins a concrete catalog model + provider to grade on.
 */
export interface AiJobSelectionPremium {
    /** Discriminant: paid Premium lane. */
    mode: AiMode.Premium
    /** Catalog model name the user picked (e.g. "gpt-4o"). */
    model: string
    /** Provider serving {@link AiJobSelectionPremium.model}. */
    provider: ModelProvider
}

/**
 * Discriminated AI lane + model pick carried on grading job payloads.
 *
 * Keyed on {@link AiMode}: `Auto` never carries a model (the balancer chooses),
 * while `Premium` always carries the user-picked `model` + `provider`.
 * This makes invalid combinations (Auto-with-model, Premium-without-model)
 * unrepresentable instead of relying on loose optional fields.
 */
export type AiJobSelection =
    | AiJobSelectionAuto
    | AiJobSelectionPremium
