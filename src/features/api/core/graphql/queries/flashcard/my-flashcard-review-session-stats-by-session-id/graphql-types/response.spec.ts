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
    MyFlashcardReviewSessionStatsBySessionIdResponse
} from "./response"

@Resolver()
class MyFlashcardReviewSessionStatsBySessionIdResponseProbe {
    @Query(() => MyFlashcardReviewSessionStatsBySessionIdResponse)
    query(): MyFlashcardReviewSessionStatsBySessionIdResponse { throw new Error("schema probe") }
}

describe("review stats response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyFlashcardReviewSessionStatsBySessionIdResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("MyFlashcardReviewSessionStatsBySessionIdResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
