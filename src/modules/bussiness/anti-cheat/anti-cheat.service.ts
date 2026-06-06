import {
    Injectable,
} from "@nestjs/common"
import type {
    EvaluateCodingTelemetryParams,
    EvaluateCodingTelemetryResult,
} from "./types"

/** Score at or above which a submission is flagged for human review. */
const FLAG_THRESHOLD = 60

/** Hard cap so any single heuristic can't push the score past 100. */
const MAX_SCORE = 100

/**
 * Heuristic anti-AI / anti-cheat scoring for coding submissions.
 *
 * Pure, stateless logic: given client behavioural telemetry and the final code
 * length, it estimates how likely the solution was pasted from an AI tool
 * rather than authored in the editor. It never blocks a submission — it only
 * produces a score + flag for downstream review.
 *
 * @example
 * const { suspicionScore, flagged } = antiCheatService.evaluate({ telemetry, codeLength })
 */
@Injectable()
export class AntiCheatService {
    /**
     * Evaluates cheat likelihood from telemetry + code length.
     *
     * @param params - The client telemetry and final code length.
     * @returns The aggregate score, flag, and contributing reasons.
     *
     * @example
     * antiCheatService.evaluate({ telemetry: { pasteCount: 4 }, codeLength: 800 })
     */
    evaluate({ telemetry, codeLength }: EvaluateCodingTelemetryParams): EvaluateCodingTelemetryResult {
        // no telemetry → nothing to score; treat as not suspicious (old clients)
        if (!telemetry) {
            return {
                suspicionScore: 0,
                flagged: false,
                reasons: [],
            }
        }
        // accumulate score + reasons across independent heuristics
        let score = 0
        const reasons: Array<string> = []
        // destructure with safe fallbacks so missing fields contribute nothing
        const {
            pasteCount = 0,
            pasteSizeMax = 0,
            keystrokeCount = 0,
            tabBlurCount = 0,
            timeOpenToSubmitMs = 0,
        } = telemetry

        // repeated pasting is a weak signal of copying answer fragments
        if (pasteCount > 3) {
            score += 25
            reasons.push(`high paste count (${pasteCount})`)
        }
        // a single paste covering most of the final code = whole-solution paste
        if (codeLength > 0 && pasteSizeMax >= codeLength * 0.6) {
            score += 30
            reasons.push("a single paste covers the majority of the solution")
        }
        // far fewer keystrokes than characters means the code wasn't typed
        if (codeLength > 0 && keystrokeCount < codeLength * 0.3) {
            score += 25
            reasons.push("keystrokes far below code length (code likely not typed)")
        }
        // submitting non-trivial code almost instantly is implausible to author
        if (codeLength > 200 && timeOpenToSubmitMs > 0 && timeOpenToSubmitMs < 15_000) {
            score += 20
            reasons.push("non-trivial solution submitted within 15s of opening")
        }
        // frequent focus loss suggests switching to an external AI tab
        if (tabBlurCount > 5) {
            score += 15
            reasons.push(`frequent tab focus loss (${tabBlurCount})`)
        }

        // clamp into [0, 100] so the score stays a stable percentage
        const suspicionScore = Math.min(score,
            MAX_SCORE)
        // flag once the aggregate crosses the review threshold
        return {
            suspicionScore,
            flagged: suspicionScore >= FLAG_THRESHOLD,
            reasons,
        }
    }
}
