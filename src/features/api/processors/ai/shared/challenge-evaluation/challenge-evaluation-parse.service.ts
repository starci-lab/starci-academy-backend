import type {
    ChallengeEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/challenge-evaluation"
import {
    Injectable,
} from "@nestjs/common"
import {
    parseChallengeEvaluation,
    type ParseChallengeEvaluationOptions,
} from "./utils/parse-challenge-evaluation"

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
        options?: ParseChallengeEvaluationOptions,
    ): ChallengeEvaluation {
        return parseChallengeEvaluation(text,
            options)
    }
}
