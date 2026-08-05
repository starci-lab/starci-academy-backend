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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ConnectGithubAccountInput,
} from "./graphql-types/input"
import {
    ConnectGithubAccountResponse,
} from "./graphql-types/response"
import {
    ConnectGithubAccountService,
} from "./connect-github-account.service"

@Resolver()
/**
 * GraphQL mutation for connecting GitHub account to authenticated user.
 */
export class ConnectGithubAccountResolver {
    constructor(
        private readonly connectGithubAccountService: ConnectGithubAccountService,
    ) {}

    /**
     * Connect a GitHub account to the current user after verifying the username exists.
     *
     * @param user - Authenticated user from Keycloak
     * @param input - Input containing GitHub username to connect
     * @returns Updated user with connected GitHub account
     */
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "GitHub account connected successfully",
        [Locale.Vi]: "Kết nối tài khoản GitHub thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ConnectGithubAccountResponse,
        {
            name: "connectGithubAccount",
            description: "Connect GitHub account to the authenticated user after verifying the username exists.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "input",
            {
                description: "GitHub username to connect.",
            },
        )
            input: ConnectGithubAccountInput
    ): Promise<UserEntity> {
        return this.connectGithubAccountService.execute(user,
            input)
    }
}
