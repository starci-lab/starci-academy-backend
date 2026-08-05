import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    MockInterviewGradingService,
} from "./grade-mock-interview-session-grading.service"
import {
    GradeMockInterviewSessionCommand,
} from "./grade-mock-interview-session.command"
import {
    MockInterviewGradeSessionData,
} from "./graphql-types/response"

@CommandHandler(GradeMockInterviewSessionCommand)
@Injectable()
/**
 * Runs the RAG-grounded whole-session grade and persists the attempt so
 * history queries do not re-score from the client transcript.
 */
export class GradeMockInterviewSessionHandler
    extends ICQRSHandler<GradeMockInterviewSessionCommand, MockInterviewGradeSessionData>
    implements ICommandHandler<GradeMockInterviewSessionCommand, MockInterviewGradeSessionData> {
    constructor(
        private readonly mockInterviewGradingService: MockInterviewGradingService,
    ) {
        super()
    }

    protected override async process(
        command: GradeMockInterviewSessionCommand,
    ): Promise<MockInterviewGradeSessionData> {
        const {
            request: {
                courseId,
                promptId,
                promptTitle,
                level,
                turns,
                sessionId,
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

        // delegate the RAG-grounded whole-session grade -> parse -> persist to the
        // domain service; the request's turns already carry the ordered transcript
        const result = await this.mockInterviewGradingService.grade({
            userId: user.id,
            courseId,
            promptId,
            promptTitle,
            level: level ?? null,
            turns,
            sessionId,
            locale: locale ?? Locale.En,
            selectedModel,
            selectedModelProvider,
        })

        // map the domain result 1:1 onto the GraphQL data shape
        return {
            overallScore: result.overallScore,
            verdict: result.verdict,
            phaseScores: result.phaseScores,
            attributeScores: result.attributeScores,
            strengths: result.strengths,
            gaps: result.gaps,
            followUpQuestion: result.followUpQuestion,
            matchedContentIds: result.matchedContentIds,
            questionReviews: result.questionReviews,
        }
    }
}
