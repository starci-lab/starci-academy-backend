import type {
    ChallengeEvaluation,
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"


@Injectable()
export class ProcessGoogleDocsSubmissionParseService {
    parse(
        text: string,
    ): ChallengeEvaluation {
        try {
            return JSON.parse(text)
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error,
            })
        }
    }
}
