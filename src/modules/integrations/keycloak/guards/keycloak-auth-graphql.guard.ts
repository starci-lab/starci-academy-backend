import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    GraphQLContextMissingRequestException,
} from "@modules/exceptions"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractKeycloakAuthGuard
} from "./abstract"
import type {
    KeycloakAuthGuardRequest,
} from "../types"

/**
 * Keycloak auth for GraphQL resolvers (`Authorization` on `context.req`).
 */
@Injectable()
export class KeycloakAuthGraphQLGuard extends AbstractKeycloakAuthGuard {
    constructor(
        keycloakJwksService: KeycloakJwksService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
        sessionService: SessionService,
        cookieService: CookieService,
    ) {
        super(
            keycloakJwksService,
            entityManager,
            sessionService,
            cookieService,
        )
    }

    /**
     * @inheritdoc
     */
    protected getRequest(context: ExecutionContext): KeycloakAuthGuardRequest {
        const gqlContext = GqlExecutionContext.create(context).getContext<{
            req?: KeycloakAuthGuardRequest 
        }>()
        if (!gqlContext.req) {
            throw new GraphQLContextMissingRequestException({
            })
        }
        return gqlContext.req
    }
}
