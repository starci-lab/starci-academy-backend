import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    UserService,
} from "@modules/bussiness/user"
import {
    GraphQLContextMissingRequestException,
    KeycloakAuthHeaderInvalidFormatException,
    KeycloakTokenInactiveException,
} from "@modules/exceptions"
import {
    KeycloakJwksService,
} from "../jwks.service"
import type {
    KeycloakAuthGuardRequest,
} from "../types"

/**
 * Like {@link KeycloakAuthGraphQLGuard}, but allows requests without `Authorization` (`req.user` unset).
 * If a Bearer token is present, it must be valid.
 */
@Injectable()
export class KeycloakOptionalAuthGraphQLGuard {
    constructor(
        private readonly keycloakJwksService: KeycloakJwksService,
        private readonly userService: UserService,
    ) {}

    /**
     * @inheritdoc
     */
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const gqlContext = GqlExecutionContext.create(context)
            .getContext<{
                req?: KeycloakAuthGuardRequest
            }>()
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
        const user = await this.userService.getUserByKeycloakId(keycloakId)
        request.user = user
        return true
    }
}
