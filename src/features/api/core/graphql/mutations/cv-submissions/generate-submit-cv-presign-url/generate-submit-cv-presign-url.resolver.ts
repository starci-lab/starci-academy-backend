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
    GenerateSubmitCvPresignUrlRequest,
    GenerateSubmitCvPresignUrlResponse,
    GenerateSubmitCvPresignUrlResponseData,
} from "./graphql-types"
import {
    GenerateSubmitCvPresignUrlService,
} from "./generate-submit-cv-presign-url.service"
import {
    GraphQLSuccessMessage, GraphQLTransformInterceptor 
} from "@modules/api"

@Resolver()
/**
 * Resolver for getting a pre-signed URL to upload a CV (Mutation-based).
 */
export class GenerateSubmitCvPresignUrlResolver {
    constructor(
        private readonly presignedUrlService: GenerateSubmitCvPresignUrlService,
    ) {}

    /**
     * Prepares a CV submission by creating a pending record and returning an upload URL.
     * @param user - Authenticated user.
     * @param request - Request containing fileName.
     * @returns Pre-signed URL and submission record ID.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "Create CV submission request successfully",
        [Locale.Vi]: "Tạo yêu cầu nộp CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @Mutation(
        () => GenerateSubmitCvPresignUrlResponse,
        {
            name: "generateSubmitCvPresignUrl",
            description: "Generates a time-limited pre-signed URL for uploading a CV file via PUT.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "CV submission preparation input.",
            },
        )
            request: GenerateSubmitCvPresignUrlRequest,
    ): Promise<GenerateSubmitCvPresignUrlResponseData> {
        return this.presignedUrlService.execute(
            {
                user,
                request,
            },
        )
    }
}
