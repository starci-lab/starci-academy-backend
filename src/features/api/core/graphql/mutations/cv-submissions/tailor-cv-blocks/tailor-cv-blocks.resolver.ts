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
    TailorCvBlocksRequest,
} from "./graphql-types/request"
import {
    TailorCvBlocksResponse,
} from "./graphql-types/response"
import {
    TailorCvBlocksService,
} from "./tailor-cv-blocks.service"

@Resolver()
/** GraphQL entry that authenticates before tailoring block wording toward a job description. */
export class TailorCvBlocksResolver {
    constructor(
        private readonly tailorCvBlocksService: TailorCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV tailored successfully",
        [Locale.Vi]: "Điều chỉnh CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => TailorCvBlocksResponse,
        {
            name: "tailorCvBlocks",
            description: "Tailor the whole CV blocks array toward a job description.",
        },
    )
    async execute(
        @Args("request")
            request: TailorCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.tailorCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
