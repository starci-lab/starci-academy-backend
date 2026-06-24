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
    CommunityPostNodeObject,
} from "../../../shared/community"
import {
    SetCommunityPostPinnedRequest,
    SetCommunityPostPinnedResponse,
} from "./graphql-types"
import {
    SetCommunityPostPinnedService,
} from "./set-community-post-pinned.service"

@Resolver()
export class SetCommunityPostPinnedResolver {
    constructor(
        private readonly setCommunityPostPinnedService: SetCommunityPostPinnedService,
    ) {}

    /**
     * Pins/unpins a community post (founder-only; enforced in the domain service).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Post pin updated successfully",
        [Locale.Vi]: "Cập nhật ghim bài thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetCommunityPostPinnedResponse,
        {
            name: "setCommunityPostPinned",
            description: "Pins/unpins a community post (founder-only).",
        },
    )
    async execute(
        @Args("request")
            request: SetCommunityPostPinnedRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CommunityPostNodeObject> {
        return this.setCommunityPostPinnedService.execute({
            request,
            user,
        })
    }
}
