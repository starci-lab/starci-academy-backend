import request from "supertest"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    io,
    type Socket,
} from "socket.io-client"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
import {
    RagPlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/rag-playground-session.entity"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    GithubRepoImportService,
} from "@modules/integrations/rag/github-repo-import.service"
import {
    PublicRagPlaygroundService,
} from "@modules/integrations/rag/public-rag-playground.service"
import {
    RagPlaygroundRunRegistryService,
} from "@modules/integrations/rag/rag-playground-run-registry.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AskRagPlaygroundResolver,
} from "@features/api/core/graphql/mutations/rag-playground/ask-rag-playground/ask-rag-playground.resolver"
import {
    IndexRagPlaygroundResolver,
} from "@features/api/core/graphql/mutations/rag-playground/index-rag-playground/index-rag-playground.resolver"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    RagPlaygroundGateway,
} from "@features/socketio/core/rag-playground/rag-playground.gateway"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"
import {
    nextMessage,
} from "@tests/helpers/flow-wait"

interface RagChunkEnvelope {
    success: boolean
    data: {
        runId: string
        delta: string
        done: boolean
        sources?: Array<{
            filePath: string | null
            snippet: string
        }>
    }
}

/** An anonymous visitor indexes code, asks a grounded question, and receives the streamed answer. */
describe("an anonymous visitor indexes code and receives a grounded RAG answer",
    () => {
        const SESSION_ID = "rag-playground-flow-session"
        const SOURCE = "export const retrieveTopK = (items: string[]) => items.slice(0, 3)"
        let world: FlowWorld
        let socket: Socket

        beforeAll(async () => {
            const schedule = global.setTimeout
            jest.spyOn(global,
                "setTimeout")
                .mockImplementation(((
                    callback: (...args: Array<unknown>) => void,
                    delay?: number,
                    ...args: Array<unknown>
                ) => {
                    const timer = schedule(callback,
                        delay,
                        ...args)
                    timer.unref()
                    return timer
                }) as typeof setTimeout)
            jest.spyOn(QdrantVectorStore,
                "fromDocuments")
                .mockResolvedValue({
                } as QdrantVectorStore)
            jest.spyOn(QdrantVectorStore,
                "fromExistingCollection")
                .mockResolvedValue({
                    similaritySearch: jest.fn().mockResolvedValue([
                        {
                            pageContent: SOURCE,
                            metadata: {
                                filePath: "retrieval.ts",
                            },
                        },
                    ]),
                } as unknown as QdrantVectorStore)

            const aiInvoke = {
                stream: jest.fn(async (params: {
                    onChunk: (delta: string) => void
                }) => {
                    params.onChunk("The helper returns ")
                    params.onChunk("the first three items [1].")
                    return {
                        text: "The helper returns the first three items [1].",
                        provider: "stub",
                        model: "stub",
                        attempts: 1,
                        cost: 0,
                        promptTokens: 0,
                        completionTokens: 0,
                    }
                }),
            }
            world = await bootFlowWorld({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    PublicRagPlaygroundService,
                    RagPlaygroundRunRegistryService,
                    IndexRagPlaygroundResolver,
                    AskRagPlaygroundResolver,
                    RagPlaygroundGateway,
                    WsResponseService,
                    {
                        provide: QDRANT_CLIENT,
                        useValue: {
                            deleteCollection: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: EmbeddingModelService,
                        useValue: {
                            getViaBalancer: jest.fn().mockResolvedValue({
                            }),
                        },
                    },
                    {
                        provide: GithubRepoImportService,
                        useValue: {
                            importRepo: jest.fn(),
                        },
                    },
                    {
                        provide: AiInvokeService,
                        useValue: aiInvoke,
                    },
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            })
            await world.app.listen(0)
            await world.truncate("rag_playground_sessions")
        })

        afterAll(async () => {
            socket?.disconnect()
            jest.restoreAllMocks()
            await world?.close()
        })

        it("persists the index lifecycle and streams cited answer chunks over the real socket",
            async () => {
                const indexed = await request(world.app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            mutation Index($request: IndexRagPlaygroundRequest!) {
                                indexRagPlayground(request: $request) {
                                    data { sessionId chunkCount sourceLabel }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                sessionId: SESSION_ID,
                                kind: "paste",
                                code: SOURCE,
                                language: "typescript",
                                fileName: "retrieval.ts",
                            },
                        },
                    })
                    .expect(200)
                expect(indexed.body.errors).toBeUndefined()

                const persisted = await world.entityManager.findOneByOrFail(
                    RagPlaygroundSessionEntity,
                    {
                        sessionId: SESSION_ID,
                    },
                )
                expect(persisted.sourceKind).toBe("paste")
                expect(persisted.sourceLabel).toBe("retrieval.ts")
                expect(persisted.chunkCount).toBeGreaterThan(0)

                const asked = await request(world.app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `
                            mutation Ask($request: AskRagPlaygroundRequest!) {
                                askRagPlayground(request: $request) {
                                    data { runId sources { filePath snippet } }
                                }
                            }
                        `,
                        variables: {
                            request: {
                                sessionId: SESSION_ID,
                                question: "How many items does retrieveTopK return?",
                            },
                        },
                    })
                    .expect(200)
                expect(asked.body.errors).toBeUndefined()
                const prepared = asked.body.data.askRagPlayground.data as {
                    runId: string
                    sources: Array<{ filePath: string | null, snippet: string }>
                }
                expect(prepared.sources).toEqual([
                    {
                        filePath: "retrieval.ts",
                        snippet: SOURCE,
                    },
                ])

                const baseUrl = await world.app.getUrl()
                socket = io(`${baseUrl}/rag_playground`,
                    {
                        transports: [
                            "websocket",
                        ],
                        forceNew: true,
                    })
                await new Promise<void>((resolve, reject) => {
                    socket.once("connect",
                        resolve)
                    socket.once("connect_error",
                        reject)
                })
                const terminalChunk = nextMessage<RagChunkEnvelope>(
                    socket,
                    SubscriptionEvent.RagPlaygroundRunChunk,
                    (message) => message.data.done,
                )
                socket.emit(PublicationEvent.SubscribeRagPlaygroundRun,
                    {
                        data: {
                            runId: prepared.runId,
                        },
                        locale: "en",
                    })

                const completed = await terminalChunk
                expect(completed.success).toBe(true)
                expect(completed.data.runId).toBe(prepared.runId)
                expect(completed.data.sources).toEqual(prepared.sources)
                expect(completed.data.delta).toBe("")
            })
    })
