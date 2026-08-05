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
    RewriteCvBlockRequest,
    RewriteCvBlockResponse,
} from "./graphql-types"
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
