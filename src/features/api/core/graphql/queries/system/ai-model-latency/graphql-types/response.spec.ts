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
    AiModelLatencyResponse
} from "./response"
@Resolver()
class Probe { @Query(() => AiModelLatencyResponse) query(): AiModelLatencyResponse { throw new Error("probe") } }
describe("AiModelLatencyResponse schema contract",
    () => { let schema: GraphQLSchema; beforeAll(async () => { const m = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule]
    }).compile(); schema = await (await m.get(GraphQLSchemaFactory)).create([Probe]) }); it("builds reachable fields",
        () => { expect(schema.getQueryType()?.getFields()).toHaveProperty("query"); const type = schema.getType("AiModelLatencyResponse"); expect(type).toBeDefined(); expect(type).toHaveProperty("getFields") }) })
