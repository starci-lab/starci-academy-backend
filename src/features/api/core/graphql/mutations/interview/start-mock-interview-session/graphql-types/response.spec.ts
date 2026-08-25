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
    StartMockInterviewSessionResponse
} from "./response"

@Resolver()
class StartMockInterviewSessionResponseProbe {
    @Query(() => StartMockInterviewSessionResponse)
    query(): StartMockInterviewSessionResponse { throw new Error("schema probe") }
}

describe("start interview response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StartMockInterviewSessionResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("StartMockInterviewSessionResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
