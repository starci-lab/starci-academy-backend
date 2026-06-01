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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ContentReactionsRequest,
    ContentReactionsResponse,
} from "./graphql-types"
import {
    ContentReactionsService,
} from "./content-reactions.service"

@Resolver()
export class ContentReactionsResolver {
    constructor(
        private readonly contentReactionsService: ContentReactionsService,
    ) {}

    /**
     * Returns the aggregate reaction summary for a content the current user is enrolled in.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reactions fetched successfully",
        [Locale.Vi]: "Lấy cảm xúc thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentReactionsResponse,
        {
            name: "contentReactions",
            description: "Returns the aggregate reaction summary for a content.",
        },
    )
    async execute(
        @Args("request")
            request: ContentReactionsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.contentReactionsService.execute({
            request,
            user,
        })
    }
}
