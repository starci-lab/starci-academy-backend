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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    VerifyAvatarPresignUrlRequest,
} from "./graphql-types/request"
import {
    VerifyAvatarPresignUrlResponse,
    VerifyAvatarPresignUrlResponseData,
} from "./graphql-types/response"
import {
    VerifyAvatarPresignUrlService,
} from "./verify-avatar-presign-url.service"

@Resolver()
/**
 * Resolver confirming a direct avatar upload + persisting it (mutation-based,
 * mirrors the CV submission verify flow).
 */
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
        [Locale.Vi]: "Cập nhật ảnh đại diện thành công", // vn-ok: vi-locale string emitted to clients
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
