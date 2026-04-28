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

/**
 * Inject the cookie from the request.
 * @param data - The name of the cookie.
 * @param context - The execution context.
 * @returns The cookie from the request.
 */
export const Cookie = createParamDecorator(
    (data: CookieName, context: ExecutionContext) => {
        let request: Request

        if (context.getType<string>() === "graphql") {
            const gql = GqlExecutionContext.create(context).getContext<{
                req: Request
            }>()
            request = gql.req
        } else {
            request = context.switchToHttp().getRequest<Request>()
        }

        return request.cookies?.[data.toString()]
    },
)

/** @deprecated Use {@link Cookie} instead. */
export const GraphQLCookie = Cookie