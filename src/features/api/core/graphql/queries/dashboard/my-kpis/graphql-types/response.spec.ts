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
    MyKpisResponse
} from "./response"

@Resolver()
class MyKpisResponseProbe {
    @Query(() => MyKpisResponse)
    query(): MyKpisResponse { throw new Error("schema probe") }
}

describe("MyKpisResponse GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyKpisResponseProbe])
        })
        it("builds the envelope and executes all reachable lazy field callbacks",
            () => {
                const type = schema.getType("MyKpisResponse") as GraphQLObjectType
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(type).toBeDefined()
                expect(Object.keys(type.getFields()).length).toBeGreaterThan(0)
            })
    })
