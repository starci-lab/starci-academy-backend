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
    GenerateAvatarPresignUrlRequest,
    GenerateAvatarPresignUrlResponse,
    GenerateAvatarPresignUrlResponseData,
} from "./graphql-types"
import {
    GenerateAvatarPresignUrlService,
} from "./generate-avatar-presign-url.service"

@Resolver()
/**
 * Resolver minting a presigned avatar-upload URL (mutation-based, mirrors the
 * CV submission presign flow).
 */
export class GenerateAvatarPresignUrlResolver {
    constructor(
        private readonly generateAvatarPresignUrlService: GenerateAvatarPresignUrlService,
    ) {}

    /**
     * Generate a presigned PUT URL the client uploads the avatar directly to.
     *
     * @param user - authenticated user.
     * @param request - intended image content type.
     * @returns presigned URL + object key.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "Avatar upload URL generated successfully",
        [Locale.Vi]: "Tạo URL tải ảnh đại diện thành công",
    })
    @Mutation(
        () => GenerateAvatarPresignUrlResponse,
        {
            name: "generateAvatarPresignUrl",
            description: "Generates a time-limited pre-signed URL for uploading an avatar via PUT.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Avatar presign input.",
            },
        )
            request: GenerateAvatarPresignUrlRequest,
    ): Promise<GenerateAvatarPresignUrlResponseData> {
        return this.generateAvatarPresignUrlService.execute({
            user,
            request,
        })
    }
}
