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
    CreateCvBlocksRequest,
    CreateCvBlocksResponse,
} from "./graphql-types"
import {
    CreateCvBlocksService,
} from "./create-cv-blocks.service"

@Resolver()
export class CreateCvBlocksResolver {
    constructor(
        private readonly createCvBlocksService: CreateCvBlocksService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV document created successfully",
        [Locale.Vi]: "Tạo CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateCvBlocksResponse,
        {
            name: "createCvBlocks",
            description: "Create a new CV document (block editor).",
        },
    )
    async execute(
        @Args("request")
            request: CreateCvBlocksRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.createCvBlocksService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
