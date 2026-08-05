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
    RenderCvBlocksRequest,
} from "./graphql-types/request"
import {
    RenderCvBlocksResponse,
} from "./graphql-types/response"
import {
    RenderCvBlocksService,
} from "./render-cv-blocks.service"

@Resolver()
/** GraphQL entry that authenticates before exporting a CV document. */
export class RenderCvBlocksResolver {
    constructor(
        private readonly renderCvBlocksService: RenderCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV rendered successfully",
        [Locale.Vi]: "Kết xuất CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RenderCvBlocksResponse,
        {
            name: "renderCvBlocks",
            description: "Compile an owned CV document into a PDF (shared LaTeX template + tectonic).",
        },
    )
    async execute(
        @Args("request")
            request: RenderCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.renderCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
