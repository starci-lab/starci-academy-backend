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
import type {
    Request,
} from "express"
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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ReactToContentRequest,
    ReactToContentResponse,
} from "./graphql-types"
import {
    ReactToContentService,
} from "./react-to-content.service"

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
        [Locale.Vi]: "Cập nhật cảm xúc thành công",
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
            context: {
                req: Request & { enrollmentId?: string }
            },
    ): Promise<ReactionSummaryObject> {
        return this.reactToContentService.execute({
            request,
            user,
            // course-scoped progress is keyed by enrollment (set by GraphQLEnrollmentGuard)
            enrollmentId: context.req.enrollmentId,
        })
    }
}
