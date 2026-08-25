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
    MyLearningFeedbacksResponse
} from "./response"

@Resolver()
class MyLearningFeedbacksResponseProbe {
    @Query(() => MyLearningFeedbacksResponse)
    query(): MyLearningFeedbacksResponse { throw new Error("schema probe") }
}

describe("MyLearningFeedbacksResponse GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyLearningFeedbacksResponseProbe])
        })
        it("builds the envelope and executes all reachable lazy field callbacks",
            () => {
                const type = schema.getType("MyLearningFeedbacksResponse") as GraphQLObjectType
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(type).toBeDefined()
                expect(Object.keys(type.getFields()).length).toBeGreaterThan(0)
            })
    })
