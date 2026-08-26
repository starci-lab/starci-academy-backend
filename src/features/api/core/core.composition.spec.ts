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
describe("API core module composition",
    () => {
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
    })
