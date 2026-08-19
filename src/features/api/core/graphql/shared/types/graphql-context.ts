import type {
    Request,
    Response,
} from "express"
import type {
    KeycloakAuthGuardRequest,
} from "@modules/integrations/keycloak/types/guard"

/**
 * GraphQL execution context shape exposed by Apollo's NestJS driver, carrying
 * both the underlying Express request and response -- needed by any resolver
 * that attaches an HTTP-only cookie or reads request metadata (User-Agent,
 * client IP) as a side effect of the mutation.
 */
export interface GraphQLContextParams {
    /** The underlying Express request for the current GraphQL operation. */
    req: Request
    /** The underlying Express response, used to attach/clear cookies. */
    res: Response
}

/**
 * GraphQL execution context shape for a resolver that only needs the
 * Keycloak-augmented request (realm roles, introspected token) and never
 * touches the response -- unlike `GraphQLContextParams`, `req` is required
 * because the guard on these resolvers always populates it.
 */
export interface GraphQLKeycloakContextParams {
    /** The Keycloak-augmented Express request for the current GraphQL operation. */
    req: KeycloakAuthGuardRequest
}
