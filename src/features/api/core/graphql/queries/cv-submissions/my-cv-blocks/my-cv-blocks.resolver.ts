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
    CvBlocksDocument,
    MyCvBlocksResponse,
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
    MyCvBlocksService,
} from "./my-cv-blocks.service"

@Resolver()
/**
 * Resolver for the signed-in user's CV documents (block editor).
 */
export class MyCvBlocksResolver {
    constructor(
        private readonly myCvBlocksService: MyCvBlocksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV documents fetched successfully",
        [Locale.Vi]: "Lấy danh sách CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCvBlocksResponse,
        {
            name: "myCvBlocks",
            description: "Returns the current user's CV documents (block editor), most recently updated first.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<CvBlocksDocument>> {
        return this.myCvBlocksService.execute(
            {
                request: {
                },
                locale,
                user,
            },
        )
    }
}
