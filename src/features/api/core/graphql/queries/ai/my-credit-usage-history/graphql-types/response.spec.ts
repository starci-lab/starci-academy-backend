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
    MyCreditUsageHistoryResponse
} from "./response"

@Resolver()
class MyCreditUsageHistoryResponseProbe {
    @Query(() => MyCreditUsageHistoryResponse)
    query(): MyCreditUsageHistoryResponse { throw new Error("schema probe") }
}

describe("credit history response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([MyCreditUsageHistoryResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("MyCreditUsageHistoryResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
