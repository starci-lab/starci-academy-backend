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
    UpdateCvBlocksRequest,
    UpdateCvBlocksResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Cập nhật CV thành công",
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
