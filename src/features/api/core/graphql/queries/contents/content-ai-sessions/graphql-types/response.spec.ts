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
    ContentAiSessionsResponse
} from "./response"
@Resolver()
class Probe { @Query(() => ContentAiSessionsResponse) query(): ContentAiSessionsResponse { throw new Error("probe") } }
describe("ContentAiSessionsResponse schema contract",
    () => { let schema: GraphQLSchema; beforeAll(async () => { const m = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule]
    }).compile(); schema = await (await m.get(GraphQLSchemaFactory)).create([Probe]) }); it("builds reachable fields",
        () => { expect(schema.getQueryType()?.getFields()).toHaveProperty("query"); const type = schema.getType("ContentAiSessionsResponse"); expect(type).toBeDefined(); expect(type).toHaveProperty("getFields") }) })
