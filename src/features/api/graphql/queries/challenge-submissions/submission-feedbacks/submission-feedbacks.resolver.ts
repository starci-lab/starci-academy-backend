import {
    Args,
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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    SubmissionFeedbacksService,
} from "./submission-feedbacks.service"
import { 
    SubmissionFeedbacksResponse,
    SubmissionFeedbacksRequest, 
    SubmissionFeedbacksResponseData 
} from "./graphql-types"

@Resolver()
export class SubmissionFeedbacksResolver {
    constructor(
        private readonly submissionFeedbacksService: SubmissionFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Submission feedbacks fetched successfully",
        [Locale.Vi]: "Lấy danh sách submission feedback thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SubmissionFeedbacksResponse,
        {
            name: "submissionFeedbacks",
            description: "Returns a paginated list of submission feedbacks, optionally filtered by attempt ID.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: SubmissionFeedbacksRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<SubmissionFeedbacksResponseData> {
        return this.submissionFeedbacksService.execute(
            {
                request,
                locale,
            },
        )
    }
}
