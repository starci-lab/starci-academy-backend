import {
    ProjectEvaluation 
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException
} from "@modules/exceptions"
import {
    extractJsonBlock,
} from "@modules/ai"
import {
    Injectable
} from "@nestjs/common"


@Injectable()
export class ReviewMilestoneTaskParseService {
    /** Parse JSON text into ProjectEvaluation object */
    parse(
        text: string
    ) : ProjectEvaluation {
        try {
            return JSON.parse(extractJsonBlock(text))
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error
            })
        }
    }
}