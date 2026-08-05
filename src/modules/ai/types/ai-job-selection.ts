import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * The model pick carried on an AI job payload.
 *
 * A caller either **pins** a concrete catalog model (`model` + `provider`
 * together) or pins nothing (both absent) -- in which case the balancer picks
 * the model from the user's entitled category chain. Presence of `model` IS the
 * discriminant; there is no separate lane/mode label.
 */
export interface AiJobSelection {
    /** Catalog model name the user pinned (e.g. "gpt-4o"); absent -> balancer picks. */
    model?: string
    /** Provider serving {@link AiJobSelection.model}; required together with `model`. */
    provider?: ModelProvider
}
