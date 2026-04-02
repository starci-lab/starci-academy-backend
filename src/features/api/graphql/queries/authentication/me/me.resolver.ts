import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    UserEntity,
    Locale 
} from "@modules/databases"
import {
    MeResponse,
} from "./graphql-types"
import {
    MeService,
} from "./me.service"

@Resolver()
export class MeResolver {
    constructor(
        private readonly meService: MeService,
    ) {}

    /**
     * Returns the current user; creates a local row on first access when token is valid.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Me fetched successfully",
        [Locale.Vi]: "Lấy thông tin người dùng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => MeResponse,
        {
            name: "me",
            description: "Returns the authenticated user (Bearer access token).",
        })
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UserEntity> {
        return this.meService.execute(user)
    }
}
