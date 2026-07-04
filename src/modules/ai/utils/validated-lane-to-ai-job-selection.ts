import {
    AiMode,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import type {
    AiJobSelection,
    ValidatedGradingLane,
} from "../types"

/**
 * Maps a {@link ValidatedGradingLane} into the discriminated {@link AiJobSelection}
 * carried on grading job payloads.
 *
 * @param lane - Output of {@link GradingLaneValidationService.validate}.
 * @returns The lane-keyed selection (`Auto` has no model; `Premium` carries model + provider).
 * @throws AiByokInvalidException when a Premium lane is missing its model/provider
 *   (should never happen — the validator guarantees them).
 */
export function validatedLaneToAiJobSelection(
    lane: ValidatedGradingLane,
): AiJobSelection {
    // Premium → carry the catalog model the validator resolved.
    if (lane.mode === AiMode.Premium) {
        // defensive: the validator always sets these on a Premium lane
        if (!lane.gradingModel || !lane.gradingProvider) {
            throw new AiByokInvalidException({
                reason: "premium lane is missing a resolved model/provider",
            })
        }
        return {
            mode: AiMode.Premium,
            model: lane.gradingModel,
            provider: lane.gradingProvider,
        }
    }
    // Auto → load balancing picks the model; nothing to pin.
    return {
        mode: AiMode.Auto,
    }
}
