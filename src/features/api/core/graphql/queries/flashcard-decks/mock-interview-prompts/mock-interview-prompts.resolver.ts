import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    MockInterviewPromptsService,
} from "./mock-interview-prompts.service"
import {
    MockInterviewPromptsData,
    MockInterviewPromptsResponse,
} from "./graphql-types"

@Resolver()
/**
 * The mock-interview prompt bank for a course — the capstone systems the
 * learner can pick to work through. Enrolled-only (the interview spends AI
 * credits, same guard as the flashcard interview).
 */
export class MockInterviewPromptsResolver {
    constructor(
        private readonly mockInterviewPromptsService: MockInterviewPromptsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview prompts fetched successfully",
        [Locale.Vi]: "Lấy đề phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MockInterviewPromptsResponse,
        {
            name: "mockInterviewPrompts",
            description: "The course's mock interview prompt bank (capstone systems + curated classics).",
        },
    )
    async execute(
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose capstone systems seed the prompt bank.",
            })
            courseId: string,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MockInterviewPromptsData> {
        // fetch the course's capstone systems + curated classics, reframed as interview prompts
        const result = await this.mockInterviewPromptsService.list({
            courseId,
            locale,
        })
        // project to the GraphQL data shape (the interceptor wraps it in the envelope)
        return {
            prompts: result.prompts,
        }
    }
}
