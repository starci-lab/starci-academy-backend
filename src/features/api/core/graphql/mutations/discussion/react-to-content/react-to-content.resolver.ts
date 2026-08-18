import {
    Args,
    Context,
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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
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
    ReactToContentRequest,
} from "./graphql-types/request"
import {
    ReactToContentResponse,
} from "./graphql-types/response"
import {
    ReactToContentService,
} from "./react-to-content.service"
import type {
    GraphQLEnrollmentContextParams,
} from "../../../shared/types/graphql-enrollment-context"

@Resolver()
/** GraphQL resolver for the `reactToContent` mutation. */
export class ReactToContentResolver {
    constructor(
        private readonly reactToContentService: ReactToContentService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a content.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reaction updated successfully",
        [Locale.Vi]: "Cập nhật cảm xúc thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReactToContentResponse,
        {
            name: "reactToContent",
            description: "Sets/changes/removes the current user's reaction on a content.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToContentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Context()
            context: GraphQLEnrollmentContextParams,
    ): Promise<ReactionSummaryObject> {
        return this.reactToContentService.execute({
            request,
            user,
            // course-scoped progress is keyed by enrollment (set by GraphQLEnrollmentGuard)
            enrollmentId: context.req.enrollmentId,
        })
    }
}
