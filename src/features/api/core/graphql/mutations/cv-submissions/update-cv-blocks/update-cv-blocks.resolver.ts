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
    UpdateCvBlocksRequest,
} from "./graphql-types/request"
import {
    UpdateCvBlocksResponse,
} from "./graphql-types/response"
import {
    UpdateCvBlocksService,
} from "./update-cv-blocks.service"

@Resolver()
/** GraphQL entry that authenticates before saving editor edits. */
export class UpdateCvBlocksResolver {
    constructor(
        private readonly updateCvBlocksService: UpdateCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV document updated successfully",
        [Locale.Vi]: "Cập nhật CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateCvBlocksResponse,
        {
            name: "updateCvBlocks",
            description: "Update a CV document (block editor autosave).",
        },
    )
    async execute(
        @Args("request")
            request: UpdateCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.updateCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
