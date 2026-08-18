import {
    createParamDecorator,
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import type {
    Request,
} from "express"
import type {
    GraphQLContextParams,
} from "../types/graphql-context"

/**
 * Reads `Authorization: Bearer <jwt>` on the HTTP request (REST or GraphQL).
 */
export function extractBearerJwtFromAuthorizationHeader(
    authorization: Request["headers"]["authorization"],
): string | undefined {
    if (authorization === undefined || authorization === null) {
        return undefined
    }
    const header = Array.isArray(authorization)
        ? authorization[0]
        : authorization
    if (typeof header !== "string" || header.length === 0) {
        return undefined
    }
    const match = /^Bearer\s+(.+)$/iu.exec(
        header.trim()
    )
    return match?.[1]?.trim()
}

function resolveRequest(
    context: ExecutionContext,
): Request {
    if (context.getType<string>() === "graphql") {
        const gql = GqlExecutionContext.create(context).getContext<GraphQLContextParams>()
        return gql.req
    }
    return context.switchToHttp().getRequest<Request>()
}

/**
 * Injects the raw JWT string from `Authorization: Bearer`, or `undefined` if absent.
 */
export const BearerJwt = createParamDecorator(
    (
        _data: unknown,
        context: ExecutionContext,
    ): string | undefined => {
        const req = resolveRequest(context)
        return extractBearerJwtFromAuthorizationHeader(
            req.headers.authorization
        )
    },
)
