import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    GraphQLContextMissingRequestException,
} from "@modules/platform/exceptions/errors/keycloak/graphql-context-missing-request"
import {
    KeycloakAuthHeaderInvalidFormatException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-auth-header-invalid-format"
import {
    KeycloakTokenInactiveException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-inactive"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import type {
    KeycloakGraphQLContext,
} from "../types/guard"

@Injectable()
/**
 * Like {@link KeycloakAuthGraphQLGuard}, but allows requests without `Authorization` (`req.user` unset).
 * If a Bearer token is present, it must be valid.
 */
export class KeycloakOptionalAuthGraphQLGuard {
    constructor(
        private readonly keycloakJwksService: KeycloakJwksService,
        private readonly userService: UserService,
        private readonly sessionService: SessionService,
        private readonly cookieService: CookieService,
    ) {}

    /**
     * @inheritdoc
     */
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const gqlContext = GqlExecutionContext.create(context)
            .getContext<KeycloakGraphQLContext>()
        const request = gqlContext.req
        if (!request) {
            throw new GraphQLContextMissingRequestException({
            })
        }
        const authHeader = request.headers["authorization"]
        if (!authHeader || typeof authHeader !== "string") {
            return true
        }
        const [
            scheme,
            token,
        ] = authHeader.split(
            " ",
        )
        if (scheme !== "Bearer" || !token) {
            throw new KeycloakAuthHeaderInvalidFormatException({
            })
        }
        const verified = await this.keycloakJwksService.verifyAccessToken(
            token,
        )
        if (!verified.active || !verified.sub) {
            throw new KeycloakTokenInactiveException({
            })
        }
        const keycloakId = verified.sub
        const sessionId = this.cookieService.getCookie(
            request,
            CookieName.SessionId,
        )
        await this.sessionService.assertCurrent({
            userId: keycloakId,
            sessionId,
        })
        const user = await this.userService.getUserByKeycloakId(keycloakId)
        request.user = user
        return true
    }
}
