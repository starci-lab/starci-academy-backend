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
    DeleteCvBlocksRequest,
    DeleteCvBlocksResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Xoá CV thành công",
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
