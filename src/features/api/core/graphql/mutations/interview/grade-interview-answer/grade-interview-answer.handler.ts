import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    InterviewGradingService,
} from "@modules/bussiness"
import {
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    GradeInterviewAnswerCommand,
} from "./grade-interview-answer.command"
import {
    InterviewGradeResultData,
} from "./graphql-types"

@CommandHandler(GradeInterviewAnswerCommand)
@Injectable()
export class GradeInterviewAnswerHandler
    extends ICQRSHandler<GradeInterviewAnswerCommand, InterviewGradeResultData>
    implements ICommandHandler<GradeInterviewAnswerCommand, InterviewGradeResultData> {
    constructor(
        private readonly interviewGradingService: InterviewGradingService,
    ) {
        super()
    }

    protected override async process(
        command: GradeInterviewAnswerCommand,
    ): Promise<InterviewGradeResultData> {
        const {
            request: {
                flashcardDeckId,
                flashcardCardId,
                interviewSessionId,
                transcript,
                mode,
                selectedModel,
                selectedModelProvider,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // delegate the stateless load → grade → parse to the domain service
        const result = await this.interviewGradingService.grade({
            userId: user.id,
            flashcardDeckId,
            flashcardCardId,
            interviewSessionId,
            transcript,
            locale: locale ?? Locale.En,
            mode,
            selectedModel,
            selectedModelProvider,
        })

        // map the domain result 1:1 onto the GraphQL data shape
        return {
            score: result.score,
            verdict: result.verdict,
            strengths: result.strengths,
            gaps: result.gaps,
            modelAnswerHint: result.modelAnswerHint,
            followUpQuestion: result.followUpQuestion,
        }
    }
}
