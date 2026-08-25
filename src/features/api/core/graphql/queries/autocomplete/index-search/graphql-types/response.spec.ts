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
    IndexSearchResponse
} from "./response"

@Resolver()
class IndexSearchResponseProbe {
    @Query(() => IndexSearchResponse)
    query(): IndexSearchResponse { throw new Error("schema probe") }
}

describe("index search response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([IndexSearchResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("IndexSearchResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
