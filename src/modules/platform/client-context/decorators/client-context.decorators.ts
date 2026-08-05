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
    DEVICE_FINGERPRINT_HEADER,
} from "../constants"
import type {
    ClientContext,
} from "../types"

/**
 * Resolves the underlying express request from either a GraphQL or REST
 * execution context.
 *
 * @param context - The Nest execution context.
 * @returns The express request.
 */
function resolveRequest(context: ExecutionContext): Request {
    // GraphQL stores the request on the gql context's `req`
    if (context.getType<string>() === "graphql") {
        return GqlExecutionContext.create(context).getContext<{ req: Request }>().req
    }
    // REST exposes it directly on the HTTP argument host
    return context.switchToHttp().getRequest<Request>()
}

/**
 * Normalizes a possibly-array header value to its first string entry.
 *
 * @param value - The raw header value (string, array, or undefined).
 * @returns The first string value, or null when absent.
 */
function firstHeader(value: string | Array<string> | undefined): string | null {
    // collapse array-valued headers to their first element
    const resolved = Array.isArray(value) ? value[0] : value
    // normalise missing/empty to null for consistent storage
    return resolved ?? null
}

/**
 * Injects {@link ClientContext} (IP, User-Agent, device fingerprint) extracted
 * from the request. Works in both GraphQL resolvers and REST controllers.
 *
 * @example
 * execute(\@ClientContextParam() client: ClientContext) { ... }
 */
export const ClientContextParam = createParamDecorator(
    (
        _data: unknown,
        context: ExecutionContext,
    ): ClientContext => {
        // resolve the express request regardless of transport
        const request = resolveRequest(context)
        // prefer the first X-Forwarded-For hop (real client behind proxies)
        const forwardedFor = firstHeader(request.headers["x-forwarded-for"])
        // X-Forwarded-For may be "client, proxy1, proxy2" -> take the first token
        const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0]?.trim() ?? null
            : request.ip ?? null
        // read the standard User-Agent header
        const userAgent = firstHeader(request.headers["user-agent"])
        // read the FE-supplied device fingerprint header
        const fingerprint = firstHeader(request.headers[DEVICE_FINGERPRINT_HEADER])
        // hand back the normalized bundle for the resolver to persist
        return {
            ipAddress,
            userAgent,
            fingerprint,
        }
    },
)
