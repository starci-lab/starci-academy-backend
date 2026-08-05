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
    RenderCvBlocksRequest,
    RenderCvBlocksResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Kết xuất CV thành công",
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
