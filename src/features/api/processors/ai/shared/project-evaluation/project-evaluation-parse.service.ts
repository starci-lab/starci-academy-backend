import type {
    ProjectEvaluation,
} from "@modules/bullmq"
import {
    Injectable,
} from "@nestjs/common"
import {
    parseProjectEvaluation,
} from "./utils"

@Injectable()
/**
 * Nest injectable wrapper for parsing milestone / project grading JSON from the LLM.
 */
export class ProjectEvaluationParseService {
    /**
     * @param text - Raw model output.
     * @returns Parsed project evaluation with an integer-normalized total score.
     */
    parse(
        text: string,
    ): ProjectEvaluation {
        return parseProjectEvaluation(text)
    }
}
