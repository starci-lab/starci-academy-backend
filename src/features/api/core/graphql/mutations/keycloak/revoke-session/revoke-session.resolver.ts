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
    SessionService,
} from "@modules/session"
import {
    RevokeSessionRequest,
    RevokeSessionResponse,
} from "./graphql-types"

@Resolver()
/**
 * GraphQL entry for logging out one other device. Auth is required; ownership
 * is enforced in SessionService so users cannot revoke each other's sessions.
 */
export class RevokeSessionResolver {
    constructor(
        private readonly sessionService: SessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Device logged out successfully",
        [Locale.Vi]: "Đã đăng xuất thiết bị thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RevokeSessionResponse,
        {
            name: "revokeSession",
            description: "Revokes one of the current user's logged-in device sessions; that device must re-authenticate.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "The session id of the device to log out.",
            },
        )
            request: RevokeSessionRequest,
    ): Promise<undefined> {
        // revoke the targeted session for the authenticated owner only -- the
        // service scopes the lookup by keycloakId so users can't revoke others'
        await this.sessionService.revokeSession({
            keycloakId: user.keycloakId,
            sessionId: request.sessionId,
        })
    }
}
