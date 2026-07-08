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
    GraphQLLocale,
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
    CvGenerationListItem,
    MyCvGenerationsRequest,
    MyCvGenerationsResponse,
} from "./graphql-types"
import {
    MyCvGenerationsService,
} from "./my-cv-generations.service"

@Resolver()
export class MyCvGenerationsResolver {
    constructor(
        private readonly myCvGenerationsService: MyCvGenerationsService,
    ) { }

    /**
     * Paginated list of the current user's CV generation runs (newest first).
     * Each row exposes id / mode / status / createdAt / processedAt; requires
     * authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV generations fetched successfully",
        [Locale.Vi]: "Lấy danh sách CV đã tạo thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCvGenerationsResponse,
        {
            name: "myCvGenerations",
            description: "Paginated list of the current user's CV generation runs.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args(
            "request",
            {
                type: () => MyCvGenerationsRequest,
                nullable: true,
            },
        )
            request?: MyCvGenerationsRequest,
    ): Promise<Array<CvGenerationListItem>> {
        return this.myCvGenerationsService.execute(
            {
                request: request ?? {
                },
                locale,
                user,
            },
        )
    }
}
