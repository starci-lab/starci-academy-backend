import {
    ProjectEvaluation 
} from "@modules/bullmq"
import {
    ParsingCriteriaResultsFromModelTextException 
} from "@modules/exceptions"
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
            return JSON.parse(text)
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text,
                originalError: error
            })
        }
    }
}