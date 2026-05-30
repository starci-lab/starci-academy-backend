import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    extractJsonBlock,
} from "@modules/ai"
import {
    Injectable,
} from "@nestjs/common"


@Injectable()
export class ProcessGoogleDocsSubmissionParseService {
    parse(
        text: string,
    ): ChallengeEvaluation {
        try {
            return JSON.parse(extractJsonBlock(text))
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error,
            })
        }
    }
}
