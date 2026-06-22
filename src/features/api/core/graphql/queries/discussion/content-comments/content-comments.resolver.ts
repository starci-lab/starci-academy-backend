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
    CommentsPageObject,
} from "../../../shared/discussion"
import {
    ContentCommentsRequest,
    ContentCommentsResponse,
} from "./graphql-types"
import {
    ContentCommentsService,
} from "./content-comments.service"

@Resolver()
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
        [Locale.Vi]: "Lấy bình luận thành công",
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
