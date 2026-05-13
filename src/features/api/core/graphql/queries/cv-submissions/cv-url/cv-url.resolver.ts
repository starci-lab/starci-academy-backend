import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    CvUrlResponse,
    CvUrlViewData,
} from "./graphql-types"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    CvUrlService,
} from "./cv-url.service"

/**
 * Resolver for presigned CV view URL for the authenticated Keycloak user.
 */
@Resolver()
export class CvUrlResolver {
    constructor(
        private readonly cvUrlService: CvUrlService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV view URL fetched successfully",
        [Locale.Vi]: "Lấy URL xem CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CvUrlResponse,
        {
            name: "cvUrl",
            description: "Returns a time-limited URL to view the current user's latest CV file (MinIO presigned GET).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CvUrlViewData | null> {
        return this.cvUrlService.execute(
            {
                request: {
                },
                locale,
                user,
            },
        )
    }
}
