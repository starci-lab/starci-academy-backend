import type {
    GraphQLFormattedError,
} from "graphql"
import {
    S3ProviderNotFoundException,
} from "@modules/platform/exceptions/errors/s3/provider-not-found"
import {
    MonolithicApolloServerModule,
} from "./monolithic-apollo-server.module"

type ApolloOptions = {
    formatError: (formatted: GraphQLFormattedError, error: unknown) => GraphQLFormattedError
    plugins: Array<{
        requestDidStart: () => Promise<{
            willSendResponse: (context: unknown) => Promise<void>
        }>
    }>
}

const options = (): ApolloOptions => {
    const dynamicModule = MonolithicApolloServerModule.register({
    } as never)
    const graphqlModule = dynamicModule.imports?.[0] as {
        providers?: Array<{
            useValue?: unknown
        }>
    }
    const provider = graphqlModule.providers?.find((candidate) => candidate.useValue)
    return provider?.useValue as ApolloOptions
}

describe("MonolithicApolloServerModule",
    () => {
        it("maps domain exceptions and unexpected errors to transport metadata",
            () => {
                const formatError = options().formatError
                const domainError = formatError({
                    message: "ignored",
                    extensions: {
                        traceId: "trace-1",
                    },
                },
                {
                    originalError: new S3ProviderNotFoundException({
                        provider: "unsupported",
                        supportedProviders: ["minio"],
                    }),
                })
                expect(domainError.extensions).toEqual(expect.objectContaining({
                    code: "S3_PROVIDER_NOT_FOUND_EXCEPTION",
                    http: {
                        status: 400,
                    },
                }))

                const unexpected = formatError({
                    message: "bug",
                    extensions: {
                        http: {
                            status: 418,
                        },
                    },
                },
                new Error("bug"))
                expect(unexpected.extensions).toEqual(expect.objectContaining({
                    http: {
                        status: 418,
                    },
                }))
            })

        it("raises the highest qualifying GraphQL error status and ignores non-single responses",
            async () => {
                const plugin = options().plugins[1]
                const lifecycle = await plugin.requestDidStart()
                const response = {
                    body: {
                        kind: "single",
                        singleResult: {
                            errors: [
                                {
                                    extensions: {
                                        http: {
                                            status: 400,
                                        },
                                    },
                                },
                                {
                                    extensions: {
                                        http: {
                                            status: 404,
                                        },
                                    },
                                },
                                {
                                    extensions: {
                                        code: "NO_HTTP_STATUS",
                                    },
                                },
                            ],
                        },
                    },
                    http: {
                        status: 200,
                    },
                }
                await lifecycle.willSendResponse({
                    response,
                })
                expect(response.http.status).toBe(404)

                const nonSingle = {
                    body: {
                        kind: "incremental",
                    },
                    http: {
                        status: 200,
                    },
                }
                await lifecycle.willSendResponse({
                    response: nonSingle,
                })
                expect(nonSingle.http.status).toBe(200)
            })

        it("leaves a successful or status-less response at Apollo's default status",
            async () => {
                const plugin = options().plugins[1]
                const lifecycle = await plugin.requestDidStart()
                const noErrors = {
                    body: {
                        kind: "single",
                        singleResult: {
                        },
                    },
                    http: {
                        status: 200,
                    },
                }
                await lifecycle.willSendResponse({
                    response: noErrors,
                })
                expect(noErrors.http.status).toBe(200)

                const noStatuses = {
                    body: {
                        kind: "single",
                        singleResult: {
                            errors: [{
                                message: "validation",
                            }],
                        },
                    },
                    http: {
                        status: 200,
                    },
                }
                await lifecycle.willSendResponse({
                    response: noStatuses,
                })
                expect(noStatuses.http.status).toBe(200)
            })
    })
