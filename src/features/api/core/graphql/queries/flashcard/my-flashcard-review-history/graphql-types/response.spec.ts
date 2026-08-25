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
    MyFlashcardReviewHistoryResponse
} from "./response"
@Resolver()
class Probe { @Query(() => MyFlashcardReviewHistoryResponse) query(): MyFlashcardReviewHistoryResponse { throw new Error("probe") } }
describe("MyFlashcardReviewHistoryResponse schema contract",
    () => { let schema: GraphQLSchema; beforeAll(async () => { const m = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule]
    }).compile(); schema = await (await m.get(GraphQLSchemaFactory)).create([Probe]) }); it("builds reachable fields",
        () => { expect(schema.getQueryType()?.getFields()).toHaveProperty("query"); const type = schema.getType("MyFlashcardReviewHistoryResponse"); expect(type).toBeDefined(); expect(type).toHaveProperty("getFields") }) })
