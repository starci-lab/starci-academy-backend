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
    TailorCvBlocksRequest,
    TailorCvBlocksResponse,
} from "./graphql-types"
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
