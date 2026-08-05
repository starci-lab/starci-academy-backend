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
    DeleteCvBlocksRequest,
} from "./graphql-types/request"
import {
    DeleteCvBlocksResponse,
} from "./graphql-types/response"
import {
    DeleteCvBlocksService,
} from "./delete-cv-blocks.service"

@Resolver()
/** GraphQL entry that authenticates before deleting a CV document. */
export class DeleteCvBlocksResolver {
    constructor(
        private readonly deleteCvBlocksService: DeleteCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV document deleted successfully",
        [Locale.Vi]: "Xoá CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteCvBlocksResponse,
        {
            name: "deleteCvBlocks",
            description: "Delete a CV document.",
        },
    )
    async execute(
        @Args("request")
            request: DeleteCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.deleteCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
