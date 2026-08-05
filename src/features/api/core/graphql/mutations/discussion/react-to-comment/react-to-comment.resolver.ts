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
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ReactToCommentRequest,
    ReactToCommentResponse,
} from "./graphql-types"
import {
    ReactToCommentService,
} from "./react-to-comment.service"

@Resolver()
/** GraphQL resolver for the `reactToComment` mutation. */
export class ReactToCommentResolver {
    constructor(
        private readonly reactToCommentService: ReactToCommentService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a comment.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reaction updated successfully",
        [Locale.Vi]: "Cập nhật cảm xúc thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReactToCommentResponse,
        {
            name: "reactToComment",
            description: "Sets/changes/removes the current user's reaction on a comment.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToCommentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.reactToCommentService.execute({
            request,
            user,
        })
    }
}
