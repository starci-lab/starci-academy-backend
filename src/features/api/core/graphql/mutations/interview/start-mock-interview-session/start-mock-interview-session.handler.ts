import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Locale,
    MOCK_INTERVIEW_SESSION_DURATION_MS,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    MockInterviewSessionDrawService,
} from "./start-mock-interview-session-draw.service"
import {
    StartMockInterviewSessionCommand,
} from "./start-mock-interview-session.command"
import {
    StartMockInterviewSessionData,
} from "./graphql-types"

@CommandHandler(StartMockInterviewSessionCommand)
@Injectable()
/**
 * Draws and persists the prompt/topics server-side so later grading trusts
 * the stored session, not whatever the client claims it was asked.
 */
export class StartMockInterviewSessionHandler
    extends ICQRSHandler<StartMockInterviewSessionCommand, StartMockInterviewSessionData>
    implements ICommandHandler<StartMockInterviewSessionCommand, StartMockInterviewSessionData> {
    constructor(
        private readonly mockInterviewSessionDrawService: MockInterviewSessionDrawService,
    ) {
        super()
    }

    protected override async process(
        command: StartMockInterviewSessionCommand,
    ): Promise<StartMockInterviewSessionData> {
        const {
            request: {
                courseId,
                level,
                mode,
                lang,
                langs,
                questionCount,
                kinds,
                countsToReadiness,
                name,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // delegate the per-mode draw (capstone-first/classic-fallback for
        // "design", progress-aware flashcard-seed draw with per-question random
        // kind for "qna") to the domain service; the returned identity is
        // persisted as a session row so gradeMockInterviewSession can trust it
        // over whatever the client sends
        const result = await this.mockInterviewSessionDrawService.draw({
            userId: user.id,
            courseId,
            level,
            mode,
            lang,
            langs,
            locale: locale ?? Locale.En,
            questionCount,
            kinds,
            countsToReadiness,
            name,
        })

        // map the domain result 1:1 onto the GraphQL data shape
        return {
            sessionId: result.sessionId,
            promptId: result.promptId,
            promptTitle: result.promptTitle,
            difficulty: result.difficulty,
            source: result.source,
            level: result.level,
            mode: result.mode,
            seedTopics: result.seedTopics.map((topic) => ({
                ...topic,
                givenCodes: topic.givenCodes ?? [],
            })),
            deadlineAt: new Date(result.createdAt.getTime() + MOCK_INTERVIEW_SESSION_DURATION_MS).toISOString(),
        }
    }
}
