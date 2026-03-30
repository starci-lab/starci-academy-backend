import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    InjectPrimaryPostgresqlEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakJwksService,
} from "../jwks.service"
import type {
    KeycloakAuthGuardRequest,
} from "../types"
import type {
    EntityManager,
} from "typeorm"

/**
 * Like {@link KeycloakAuthGraphQLGuard}, but allows requests without `Authorization` (`req.user` unset).
 * If a Bearer token is present, it must be valid.
 */
@Injectable()
export class KeycloakOptionalAuthGraphQLGuard {
    constructor(
        private readonly keycloakJwksService: KeycloakJwksService,
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
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
            throw new UnauthorizedException(
                "GraphQL context is missing HTTP request",
            )
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
            throw new UnauthorizedException(
                "Invalid Authorization header format",
            )
        }
        const verified = await this.keycloakJwksService.verifyAccessToken(
            token,
        )
        if (!verified.active || !verified.sub) {
            throw new UnauthorizedException(
                "Invalid or inactive token",
            )
        }
        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: verified.sub,
                },
            },
        )
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    keycloakId: verified.sub,
                    username: verified.preferred_username,
                    email: verified.email,
                    avatar: verified.avatar,
                },
            )
            await this.entityManager.save(user)
        }
        request.user = user
        return true
    }
}
