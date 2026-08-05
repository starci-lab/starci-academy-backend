import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    Injectable,
} from "@nestjs/common"
import {
    parseChallengeEvaluation,
} from "./utils"

@Injectable()
/**
 * Nest injectable wrapper for parsing challenge grading JSON from the LLM.
 */
export class ChallengeEvaluationParseService {
    /**
     * @param text - Raw model output.
     * @returns Parsed challenge evaluation with an integer-normalized total score.
     */
    parse(
        text: string,
    ): ChallengeEvaluation {
        return parseChallengeEvaluation(text)
    }
}
