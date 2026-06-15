import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    VerifyAvatarPresignUrlRequest,
    VerifyAvatarPresignUrlResponse,
    VerifyAvatarPresignUrlResponseData,
} from "./graphql-types"
import {
    VerifyAvatarPresignUrlService,
} from "./verify-avatar-presign-url.service"

/**
 * Resolver confirming a direct avatar upload + persisting it (mutation-based,
 * mirrors the CV submission verify flow).
 */
@Resolver()
export class VerifyAvatarPresignUrlResolver {
    constructor(
        private readonly verifyAvatarPresignUrlService: VerifyAvatarPresignUrlService,
    ) {}

    /**
     * Verify the uploaded avatar object + persist its public URL on the user.
     *
     * @param user - authenticated user.
     * @param request - the uploaded object key from generateAvatarPresignUrl.
     * @returns whether the object existed + the persisted public URL.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "Avatar updated successfully",
        [Locale.Vi]: "Cập nhật ảnh đại diện thành công",
    })
    @Mutation(
        () => VerifyAvatarPresignUrlResponse,
        {
            name: "verifyAvatarPresignUrl",
            description: "Confirms a direct avatar upload and persists the avatar URL on the user.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Avatar verify input.",
            },
        )
            request: VerifyAvatarPresignUrlRequest,
    ): Promise<VerifyAvatarPresignUrlResponseData> {
        return this.verifyAvatarPresignUrlService.execute({
            user,
            request,
        })
    }
}
