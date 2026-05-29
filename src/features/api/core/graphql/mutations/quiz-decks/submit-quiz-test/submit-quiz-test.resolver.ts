import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    QuizTestGradingService,
} from "@modules/bussiness"
import {
    SubmitQuizTestData,
    SubmitQuizTestRequest,
    SubmitQuizTestResponse,
} from "./graphql-types"

/**
 * Grades a Test-mode submission of a deck: auto-grades the multiple-choice
 * answers and folds each outcome into the learner's SM-2 schedule.
 */
@Resolver()
export class SubmitQuizTestResolver {
    constructor(
        private readonly quizTestGradingService: QuizTestGradingService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Test graded successfully",
        [Locale.Vi]: "Chấm bài kiểm tra thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitQuizTestResponse,
        {
            name: "submitQuizTest",
            description: "Grades a Test-mode submission and updates SM-2 progress.",
        },
    )
    async execute(
        @Args("request")
            request: SubmitQuizTestRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SubmitQuizTestData> {
        // grade answers against option correctness + update SM-2 per card
        return this.quizTestGradingService.gradeTest(
            {
                userId: user.id,
                quizDeckId: request.quizDeckId,
                answers: request.answers,
            },
        )
    }
}
