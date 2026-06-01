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
 * BYOK lane — the user pins a model + provider, invoked on the user's own key.
 */
export interface AiJobSelectionByok {
    /** Discriminant: bring-your-own-key lane. */
    mode: AiMode.Byok
    /** Model to invoke with the user's key. */
    model: string
    /** Provider serving {@link AiJobSelectionByok.model}. */
    provider: ModelProvider
    /** Optional one-shot inline key; omit to load the stored key at grade time. */
    apiKey?: string
}

/**
 * Discriminated AI lane + model pick carried on grading job payloads.
 *
 * Keyed on {@link AiMode}: `Auto` never carries a model (the balancer chooses),
 * while `Premium` and `Byok` always carry the user-picked `model` + `provider`.
 * This makes invalid combinations (Auto-with-model, Premium-without-model)
 * unrepresentable instead of relying on six loose optional fields.
 */
export type AiJobSelection =
    | AiJobSelectionAuto
    | AiJobSelectionPremium
    | AiJobSelectionByok
