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
    CommentsPageObject,
} from "../../../shared/discussion/object-types/comments-page.object"
import {
    ContentCommentsRequest,
} from "./graphql-types/request"
import {
    ContentCommentsResponse,
} from "./graphql-types/response"
import {
    ContentCommentsService,
} from "./content-comments.service"

@Resolver()
/** GraphQL resolver for the `contentComments` query. */
export class ContentCommentsResolver {
    constructor(
        private readonly contentCommentsService: ContentCommentsService,
    ) {}

    /**
     * Lists comments (top-level or replies) for a content the current user is enrolled in.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Comments fetched successfully",
        [Locale.Vi]: "Lấy bình luận thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentCommentsResponse,
        {
            name: "contentComments",
            description: "Lists comments of a content (top-level, or replies of one parent).",
        },
    )
    async execute(
        @Args("request")
            request: ContentCommentsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommentsPageObject> {
        return this.contentCommentsService.execute({
            request,
            user,
        })
    }
}
