import {
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    GraphQLContextMissingRequestException,
} from "@modules/platform/exceptions/errors/keycloak/graphql-context-missing-request"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractKeycloakAuthGuard
} from "./abstract"
import type {
    KeycloakAuthGuardRequest,
} from "../types/guard"

@Injectable()
/**
 * Keycloak auth for GraphQL resolvers (`Authorization` on `context.req`).
 */
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
