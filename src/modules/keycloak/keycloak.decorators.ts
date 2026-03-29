import {
    createParamDecorator,
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext 
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"

/**
 * Inject the Keycloak user.
 */
export const KeycloakRestUser = createParamDecorator(
    (_: unknown, context: ExecutionContext) => {
        // ctx.user is the user from the request
        const ctx = context.switchToHttp().getRequest()
        return ctx.user as UserEntity
    }
)

/**
 * Inject the Keycloak user.
 */
export const KeycloakGraphQLUser = createParamDecorator(
    (_: unknown, context: ExecutionContext) => {
        // ctx.user is the user from the request
        const ctx = GqlExecutionContext.create(context).getContext()
        const request = ctx.req
        return request.user as UserEntity
    }
)