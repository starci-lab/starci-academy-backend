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
    AiSubscriptionTiersResponse
} from "./response"

@Resolver()
class AiSubscriptionTiersResponseProbe {
    @Query(() => AiSubscriptionTiersResponse)
    query(): AiSubscriptionTiersResponse { throw new Error("schema probe") }
}

describe("AI subscription tiers response GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([AiSubscriptionTiersResponseProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("AiSubscriptionTiersResponse")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
