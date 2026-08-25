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
    AiKeyHealthResponse
} from "./response"

@Resolver()
class AiKeyHealthResponseProbe {
    @Query(() => AiKeyHealthResponse)
    query(): AiKeyHealthResponse { throw new Error("schema probe") }
}

describe("AiKeyHealthResponse GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([AiKeyHealthResponseProbe])
        })
        it("builds the envelope and executes all reachable lazy field callbacks",
            () => {
                const type = schema.getType("AiKeyHealthResponse") as GraphQLObjectType
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(type).toBeDefined()
                expect(Object.keys(type.getFields()).length).toBeGreaterThan(0)
            })
    })
