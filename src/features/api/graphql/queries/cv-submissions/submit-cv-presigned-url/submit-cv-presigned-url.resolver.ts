import {
} from "@modules/api"
import {
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseGuards,
} from "@nestjs/common"
import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    SubmitCvPresignedUrlRequest,
    SubmitCvPresignedUrlResponse,
} from "./graphql-types"
import {
    SubmitCvPresignedUrlService,
} from "./submit-cv-presigned-url.service"

/**
 * Resolver for getting a pre-signed URL to upload a CV (Query-based).
 */
@Resolver()
export class SubmitCvPresignedUrlResolver {
    constructor(
        private readonly PresignedUrlService: SubmitCvPresignedUrlService,
    ) {}

    /**
     * Prepares a CV submission by creating a pending record and returning an upload URL.
     * @param user - Authenticated user.
     * @param request - Request containing fileName.
     * @returns Pre-signed URL and submission record ID.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @Query(
        () => SubmitCvPresignedUrlResponse,
        {
            name: "SubmitCvPresignedUrl",
            description: " a time-limited pre-signed URL for uploading a CV file via PUT.",
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
            request: SubmitCvPresignedUrlRequest,
    ): Promise<SubmitCvPresignedUrlResponse> {
        return this.PresignedUrlService.execute(
            {
                user,
                request,
            },
        )
    }
}
