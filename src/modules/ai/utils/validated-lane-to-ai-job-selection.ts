import type {
    AiJobSelection,
} from "../types/ai-job-selection"
import type {
    ValidatedGradingLane,
} from "../types/grading"

/**
 * Maps a {@link ValidatedGradingLane} into the {@link AiJobSelection} carried on
 * grading job payloads -- simply carries the pinned model/provider the validator
 * resolved (or neither, when nothing was pinned and the balancer picks).
 *
 * @param lane - Output of {@link GradingLaneValidationService.validate}.
 * @returns The selection (pinned model + provider, or empty).
 */
export function validatedLaneToAiJobSelection(
    lane: ValidatedGradingLane,
): AiJobSelection {
    return {
        model: lane.gradingModel,
        provider: lane.gradingProvider,
    }
}
