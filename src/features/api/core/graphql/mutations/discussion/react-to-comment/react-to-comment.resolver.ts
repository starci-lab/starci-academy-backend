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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ReactionSummaryObject,
} from "../../../shared/discussion/object-types/reaction-summary.object"
import {
    ReactToCommentRequest,
} from "./graphql-types/request"
import {
    ReactToCommentResponse,
} from "./graphql-types/response"
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
        [Locale.Vi]: "Cập nhật cảm xúc thành công", // vn-ok: vi-locale string emitted to clients
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
