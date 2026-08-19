import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./monolithic-apollo-server.module-definition"
import {
    ApolloDriver,
    ApolloDriverConfig,
} from "@nestjs/apollo"
import {
    GraphQLModule,
} from "@nestjs/graphql"
import {
    ApolloServerPluginLandingPageLocalDefault,
} from "@apollo/server/plugin/landingPage/default"
import type {
    ApolloServerPlugin,
} from "@apollo/server"
import type {
    GraphQLFormattedError,
} from "graphql"
import {
    AbstractException,
} from "@modules/platform/exceptions/errors/abstract"
import type {
    ApolloHttpExtension,
} from "../types/graphql-response"

/**
 * Reads the `extensions.http.status` Apollo convention (set by `formatError`
 * below, per https://www.apollographql.com/docs/apollo-server/data/errors#setting-http-status-code)
 * off the response's errors and applies it as the ACTUAL HTTP status --
 * `formatError` alone can only shape the error body, not the transport status.
 * When multiple errors disagree, the highest status wins (an unambiguous
 * failure outranks a partial one). No qualifying error -> leaves Apollo's
 * default (200), which is correct for a request that otherwise succeeded.
 */
const httpStatusFromExceptionsPlugin: ApolloServerPlugin = {
    async requestDidStart() {
        return {
            async willSendResponse(requestContext) {
                const { response } = requestContext
                if (response.body.kind !== "single") {
                    return
                }
                const errors = response.body.singleResult.errors
                if (!errors || errors.length === 0) {
                    return
                }
                const statuses = errors
                    .map((error) => {
                        const http = error.extensions?.http as ApolloHttpExtension | undefined
                        return http?.status
                    })
                    .filter((status): status is number => typeof status === "number")
                if (statuses.length === 0) {
                    return
                }
                response.http.status = Math.max(...statuses)
            },
        }
    },
}

@Module({
})
/**
 * The production GraphQL HTTP server: auto-schema, sandbox landing, and
 * AbstractException -> `extensions.http.status` so auth failures are not 200.
 * Disables Nest's `autoTransformHttpErrors` because that plugin forces 200
 * whenever `data` is present (including `data: null`).
 */
export class MonolithicApolloServerModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE) {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            imports: [
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    playground: false,
                    autoSchemaFile: true,
                    // @nestjs/apollo's default `createPreserveHttpStatusPlugin` forces the
                    // HTTP status back to 200 whenever the response has a `data` key at
                    // all (even `data: null`) -- which clobbers our own status mapping for
                    // every guard/auth failure (those responses ARE `{data: null, errors}`).
                    // Disabling this also turns off Nest's auto-mapping of raw Nest
                    // `HttpException`s to GraphQL codes, but every exception in this repo
                    // now throws `AbstractException` (never a raw HttpException) in
                    // GraphQL context, so that auto-mapping had nothing left to do anyway.
                    autoTransformHttpErrors: false,
                    plugins: [
                        ApolloServerPluginLandingPageLocalDefault(),
                        httpStatusFromExceptionsPlugin,
                    ],
                    // resolvers: {
                    //     JSON: GraphQLJSON,
                    // },
                    context: ({ req, res }) => ({
                        req,
                        res,
                    }),
                    // stamp the exception's stable `code` + the real HTTP status (Apollo's
                    // `extensions.http.status` convention) onto every AbstractException
                    // error -- `httpStatusFromExceptionsPlugin` above reads the latter to
                    // set the actual transport status; `code` matching (not status alone)
                    // stays the FE's primary signal since GraphQL responses can carry
                    // multiple errors with different severities
                    formatError: (formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError => {
                        const original = (error as {
                            originalError?: unknown
                        })?.originalError ?? error
                        if (original instanceof AbstractException) {
                            return {
                                ...formattedError,
                                extensions: {
                                    ...formattedError.extensions,
                                    code: original.code,
                                    http: {
                                        status: original.httpStatus ?? 500,
                                    },
                                },
                            }
                        }
                        // any OTHER error (graphql-js's own execution errors -- e.g. "Cannot
                        // return null for non-nullable field", resolver throws not wrapped in
                        // AbstractException, etc.) is by definition an UNEXPECTED server bug,
                        // never the client's fault -- default it to 500 too, so
                        // `httpStatusFromExceptionsPlugin` above surfaces it as a real 5xx on
                        // the wire instead of silently staying 200. Teacher 2026-07-11: return
                        // 500 for these (server bug, not a client mistake). Never overrides an
                        // EXISTING extensions.http.status (e.g. a
                        // raw HttpException Nest may have already stamped).
                        return {
                            ...formattedError,
                            extensions: {
                                ...formattedError.extensions,
                                http: {
                                    status: 500,
                                    ...(formattedError.extensions?.http as ApolloHttpExtension | undefined),
                                },
                            },
                        }
                    },
                }),
            ],
        }
    }
}

