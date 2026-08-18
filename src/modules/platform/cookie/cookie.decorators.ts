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
import {
    CookieName
} from "./enums"
import type {
    GraphQLContextParams,
} from "./types/graphql-context"

/**
 * Inject the cookie from the request.
 * @param data - The name of the cookie.
 * @param context - The execution context.
 * @returns The cookie from the request.
 */
export const GraphQLCookie = createParamDecorator(
    (data: CookieName, context: ExecutionContext) => {
        const gql = GqlExecutionContext.create(context).getContext<GraphQLContextParams>()
        const request = gql.req
        return request.cookies?.[data.toString()]
    },
)

/**
 * Inject the cookie from the request.
 * @param data - The name of the cookie.
 * @param context - The execution context.
 * @returns The cookie from the request.
 */
export const RestCookie = createParamDecorator(
    (data: CookieName, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<Request>()
        return request.cookies?.[data.toString()]
    },
)