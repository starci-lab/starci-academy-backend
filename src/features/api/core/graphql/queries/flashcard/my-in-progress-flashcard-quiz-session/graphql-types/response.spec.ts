import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import type {
    GraphQLObjectType, GraphQLSchema
} from "graphql"
import {
    MyInProgressFlashcardQuizSessionResponse
} from "./response"

@Resolver()
class MyInProgressFlashcardQuizSessionResponseProbe {
    @Query(() => MyInProgressFlashcardQuizSessionResponse)
    query(): MyInProgressFlashcardQuizSessionResponse { throw new Error("schema probe") }
}

describe("MyInProgressFlashcardQuizSessionResponse GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyInProgressFlashcardQuizSessionResponseProbe])
        })
        it("builds the envelope and executes all reachable lazy field callbacks",
            () => {
                const type = schema.getType("MyInProgressFlashcardQuizSessionResponse") as GraphQLObjectType
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(type).toBeDefined()
                expect(Object.keys(type.getFields()).length).toBeGreaterThan(0)
            })
    })
