import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
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
    CreateCvBlocksRequest,
} from "./graphql-types/request"
import {
    CreateCvBlocksResponse,
} from "./graphql-types/response"
import {
    CreateCvBlocksService,
} from "./create-cv-blocks.service"

@Resolver()
/** GraphQL entry that authenticates before inserting a CV block document. */
export class CreateCvBlocksResolver {
    constructor(
        private readonly createCvBlocksService: CreateCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV document created successfully",
        [Locale.Vi]: "Tạo CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateCvBlocksResponse,
        {
            name: "createCvBlocks",
            description: "Create a new CV document (block editor).",
        },
    )
    async execute(
        @Args("request")
            request: CreateCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.createCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
