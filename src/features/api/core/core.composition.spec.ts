jest.mock("@modules/integrations/github/auth.service",
    () => ({
        GithubApiAuthService: class GithubApiAuthService {},
    }))
jest.mock("octokit",
    () => ({
        Octokit: class Octokit {},
    }))

import {
    CoreModule
} from "./core.module"
import {
    GraphQLModule
} from "./graphql/graphql.module"
import {
    QueriesModule
} from "./graphql/queries/queries.module"
import {
    MutationsModule
} from "./graphql/mutations/mutations.module"
import {
    ApolloServerType
} from "@modules/api/apollo/server/enums/server"
import {
    GraphQLSchemaBuilderModule,
    GraphQLSchemaFactory,
} from "@nestjs/graphql"
import {
    GraphQLSchema,
} from "graphql"
import {
    Test,
} from "@nestjs/testing"
import {
    ENTRY_PROVIDER_WATERMARK,
} from "@nestjs/common/constants"
describe("API core module composition",
    () => {
        type ResolverClass = new (...args: never[]) => object
        type MetadataModule = {
            imports?: unknown[]
            providers?: unknown[]
            module?: unknown
            useClass?: unknown
            useValue?: unknown
        }

        const asMetadataModule = (value: unknown): MetadataModule | undefined =>
            typeof value === "object" && value !== null ? value as MetadataModule : undefined

        const resolverClasses = (entries: ReadonlyArray<unknown>): ResolverClass[] => {
            const result: ResolverClass[] = []
            const visited = new Set<object>()
            const visit = (entry: unknown): void => {
                const metadata = asMetadataModule(entry)
                if (typeof entry === "function") {
                    if (visited.has(entry)) {
                        return
                    }
                    visited.add(entry)
                    if (Reflect.getMetadata(ENTRY_PROVIDER_WATERMARK,
                        entry) === true) {
                        result.push(entry as ResolverClass)
                    }
                    const moduleMetadata = Reflect.getMetadata("imports",
                        entry) as unknown[] | undefined
                    moduleMetadata?.forEach(visit)
                    const providerMetadata = Reflect.getMetadata("providers",
                        entry) as unknown[] | undefined
                    providerMetadata?.forEach(visit)
                    return
                }
                if (typeof metadata?.module === "function") {
                    visit(metadata.module)
                }
                metadata?.imports?.forEach(visit)
                metadata?.providers?.forEach((provider) => {
                    const providerMetadata = asMetadataModule(provider)
                    if (typeof provider === "function") {
                        visit(provider)
                    } else if (typeof providerMetadata?.useClass === "function") {
                        visit(providerMetadata.useClass)
                    } else if (typeof providerMetadata?.useValue === "function") {
                        visit(providerMetadata.useValue)
                    } else if (typeof providerMetadata?.module === "function") {
                        visit(providerMetadata.module)
                    } else if (typeof providerMetadata?.module === "undefined" &&
                        typeof providerMetadata?.providers === "undefined" &&
                        typeof providerMetadata?.imports === "undefined") {
                        const candidate = asMetadataModule(provider)?.module
                        if (typeof candidate === "function") {
                            visit(candidate)
                        }
                    }
                    if (providerMetadata && "module" in providerMetadata &&
                        typeof providerMetadata.module === "function") {
                        visit(providerMetadata.module)
                    }
                })
            }
            entries.forEach(visit)
            return result
        }

        const buildSchema = async (entries: ReadonlyArray<unknown>): Promise<GraphQLSchema> => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule],
            }).compile()
            return moduleRef.get(GraphQLSchemaFactory).create(resolverClasses(entries))
        }

        const hasModuleNamed = (entry: unknown,
            name: string): boolean => {
            if (typeof entry !== "object" || entry === null || !("module" in entry)) {
                return false
            }
            const module = entry.module
            return typeof module === "function" && module.name === name
        }

        it("registers the global monolithic HTTP and GraphQL surfaces",
            () => {
                const definition = CoreModule.register({
                })
                const imports = Reflect.getMetadata("imports",
                    CoreModule) as Array<unknown>
                expect(definition.global).toBe(true)
                expect(imports).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        module: GraphQLModule
                    }),
                ]))
                expect(imports).toHaveLength(3)
                const apollo = imports.find((entry) => hasModuleNamed(entry,
                    "ApolloServerModule"))
                expect(apollo).toBeDefined()
                expect((apollo as { providers?: Array<{ useValue?: { type?: ApolloServerType } }> }).providers).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        useValue: expect.objectContaining({
                            type: ApolloServerType.Monolithic,
                        }),
                    }),
                ]))
            })
        it("registers query and mutation subtrees globally",
            () => {
                const imports = Reflect.getMetadata("imports",
                    GraphQLModule) as Array<unknown>
                const queryImports = Reflect.getMetadata("imports",
                    QueriesModule) as Array<unknown>
                const mutationImports = Reflect.getMetadata("imports",
                    MutationsModule) as Array<unknown>
                expect(imports).toEqual(expect.arrayContaining([expect.objectContaining({
                    module: QueriesModule
                }),
                expect.objectContaining({
                    module: MutationsModule
                })]))
                expect(imports).toHaveLength(2)
                expect(queryImports).toHaveLength(36)
                expect(mutationImports).toHaveLength(26)
                expect(QueriesModule.register({
                    isGlobal: true
                }).global).toBeUndefined()
                expect(MutationsModule.register({
                    isGlobal: true
                }).global).toBe(true)
                expect(queryImports).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        module: expect.any(Function),
                    }),
                ]))
                expect(mutationImports).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        module: expect.any(Function),
                    }),
                ]))
            })
        it("builds query and mutation schemas from registered resolver leaves",
            async () => {
                const queryImports = Reflect.getMetadata("imports",
                    QueriesModule) as Array<unknown>
                const mutationImports = Reflect.getMetadata("imports",
                    MutationsModule) as Array<unknown>
                const schema = await buildSchema([...queryImports,
                    ...mutationImports])
                const queryFields = Object.keys(schema.getQueryType()?.getFields() ?? {
                })
                const mutationFields = Object.keys(schema.getMutationType()?.getFields() ?? {
                })
                expect(queryFields.length).toBeGreaterThan(30)
                expect(mutationFields.length).toBeGreaterThan(30)
                expect(queryFields).toEqual(expect.arrayContaining([
                    "learnAiCompanion",
                    "globalChatRoom",
                ]))
                expect(mutationFields).toEqual(expect.arrayContaining([
                    "resolveLearnAiCompanion",
                ]))
            })
    })
