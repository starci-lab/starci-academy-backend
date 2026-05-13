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
    VerifySubmitCvPresignUrlRequest,
    VerifySubmitCvPresignUrlResponse,
    VerifySubmitCvPresignUrlResponseData,
} from "./graphql-types"
import {
    VerifySubmitCvPresignUrlService,
} from "./verify-submit-cv-presign-url.service"
import {
    GraphQLTransformInterceptor, GraphQLSuccessMessage 
} from "@modules/api"

/**
 * Resolver for verifying that a CV file was uploaded via the presigned URL.
 */
@Resolver()
export class VerifySubmitCvPresignUrlResolver {
    constructor(
        private readonly verifyService: VerifySubmitCvPresignUrlService,
    ) {}

    /**
     * Verifies that the CV file was uploaded to MinIO and updates the attempt status.
     * @param user - Authenticated user.
     * @param request - Request containing cvSubmissionAttemptId.
     * @returns Whether the file was uploaded and the status updated.
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "Verify CV upload successfully",
        [Locale.Vi]: "Xác thực CV tải lên thành công",
    })
    @Mutation(
        () => VerifySubmitCvPresignUrlResponse,
        {
            name: "verifySubmitCvPresignUrl",
            description: "Verifies that a CV file was uploaded via the presigned URL and updates the attempt status.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "CV upload verification input.",
            },
        )
            request: VerifySubmitCvPresignUrlRequest,
    ): Promise<VerifySubmitCvPresignUrlResponseData> {
        return this.verifyService.execute(
            {
                user,
                request,
            },
        )
    }
}
