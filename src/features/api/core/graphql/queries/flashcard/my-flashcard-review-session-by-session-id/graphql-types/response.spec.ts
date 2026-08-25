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
    MyFlashcardReviewSessionBySessionIdResponse
} from "./response"

@Resolver()
class MyFlashcardReviewSessionBySessionIdResponseProbe {
    @Query(() => MyFlashcardReviewSessionBySessionIdResponse)
    query(): MyFlashcardReviewSessionBySessionIdResponse { throw new Error("schema probe") }
}

describe("review session response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyFlashcardReviewSessionBySessionIdResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("MyFlashcardReviewSessionBySessionIdResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
