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
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UserEntity,
} from "@modules/databases"
import {
    GetSubmitCvPresignedUrlRequest,
    GetSubmitCvPresignedUrlResponse,
} from "./graphql-types"
import {
    GetSubmitCvPresignedUrlService,
} from "./get-submit-cv-presigned-url.service"

/**
 * Resolver for getting a pre-signed URL to upload a CV (Query-based).
 */
@Resolver()
export class GetSubmitCvPresignedUrlResolver {
    constructor(
        private readonly getPresignedUrlService: GetSubmitCvPresignedUrlService,
    ) {}

    /**
     * Prepares a CV submission by creating a pending record and returning an upload URL.
     * @param user - Authenticated user.
     * @param request - Request containing fileName.
     * @returns Pre-signed URL and submission record ID.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => GetSubmitCvPresignedUrlResponse,
        {
            name: "getSubmitCvPresignedUrl",
            description: "Get a time-limited pre-signed URL for uploading a CV file via PUT.",
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
            request: GetSubmitCvPresignedUrlRequest,
    ): Promise<GetSubmitCvPresignedUrlResponse> {
        return this.getPresignedUrlService.execute(
            {
                user,
                request,
            },
        )
    }
}
