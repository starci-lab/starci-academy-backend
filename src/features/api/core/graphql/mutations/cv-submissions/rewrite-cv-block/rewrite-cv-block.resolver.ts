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
    RewriteCvBlockRequest,
} from "./graphql-types/request"
import {
    RewriteCvBlockResponse,
} from "./graphql-types/response"
import {
    RewriteCvBlockService,
} from "./rewrite-cv-block.service"

@Resolver()
/** GraphQL entry that authenticates before calling the rewrite model. */
export class RewriteCvBlockResolver {
    constructor(
        private readonly rewriteCvBlockService: RewriteCvBlockService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV block rewritten successfully",
        [Locale.Vi]: "Viết lại khối CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RewriteCvBlockResponse,
        {
            name: "rewriteCvBlock",
            description: "Rewrite / improve a single CV block, optionally grounded in a real capstone.",
        },
    )
    async execute(
        @Args("request")
            request: RewriteCvBlockRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.rewriteCvBlockService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
