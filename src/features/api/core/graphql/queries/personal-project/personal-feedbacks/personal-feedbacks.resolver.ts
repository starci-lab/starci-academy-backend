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
    PersonalProjectAttemptEntity,
} from "@modules/databases"
import {
    PersonalFeedbacksRequest,
    PersonalFeedbacksResponse,
} from "./graphql-types"
import {
    PersonalFeedbacksService,
} from "./personal-feedbacks.service"

@Resolver(() => PersonalProjectAttemptEntity)
export class PersonalFeedbacksResolver {
    constructor(
        private readonly service: PersonalFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Feedback history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử feedback thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => PersonalFeedbacksResponse,
        {
            name: "personalFeedbacks",
            description: "Fetch review attempt history with feedback for a personal project task.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Personal feedbacks lookup request.",
            },
        )
            request: PersonalFeedbacksRequest,
    ): Promise<Array<PersonalProjectAttemptEntity>> {
        return this.service.execute({
            enrollmentId: request.enrollmentId,
        })
    }
}
