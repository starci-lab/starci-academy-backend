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
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UserEntity,
    Locale,
} from "@modules/databases"
import {
    ConnectGithubAccountInput,
    ConnectGithubAccountResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Kết nối tài khoản GitHub thành công",
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
