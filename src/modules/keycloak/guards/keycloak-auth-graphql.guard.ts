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
} from "@modules/databases"
import {
    KeycloakJwksService,
} from "../jwks.service"
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
        @InjectPrimaryPostgresqlEntityManager()
        entityManager: EntityManager,
    ) {
        super(
            keycloakJwksService,
            entityManager,
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
            throw new UnauthorizedException("GraphQL context is missing HTTP request")
        }
        return gqlContext.req
    }
}
