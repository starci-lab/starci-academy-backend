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
import type {
    UserEntity,
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
    @GraphQLSuccessMessage("Me fetched successfully")
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => MeResponse,
        {
            description: "Returns the authenticated user (Bearer access token).",
        })
    async me(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UserEntity> {
        return this.meService.execute(
            {
                user,
            }
        )
    }
}
