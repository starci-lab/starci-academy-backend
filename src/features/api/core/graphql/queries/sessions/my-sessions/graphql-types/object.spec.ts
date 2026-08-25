import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import type {
    GraphQLSchema
} from "graphql"
import {
    LoginSessionObject
} from "./object"
@Resolver()
class Probe { @Query(() => LoginSessionObject) query(): LoginSessionObject { throw new Error("probe") } }
describe("LoginSessionObject schema contract",
    () => { let schema: GraphQLSchema; beforeAll(async () => { const m = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule]
    }).compile(); schema = await (await m.get(GraphQLSchemaFactory)).create([Probe]) }); it("builds reachable fields",
        () => { expect(schema.getQueryType()?.getFields()).toHaveProperty("query"); const type = schema.getType("LoginSessionObject"); expect(type).toBeDefined(); expect(type).toHaveProperty("getFields") }) })
