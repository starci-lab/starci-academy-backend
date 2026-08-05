import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CvBlocksDocument,
    MyCvBlocksResponse,
} from "./graphql-types/response"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
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
