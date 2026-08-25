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
    WeeklyChallengeResponse
} from "./response"

@Resolver()
class WeeklyChallengeResponseProbe {
    @Query(() => WeeklyChallengeResponse)
    query(): WeeklyChallengeResponse { throw new Error("schema probe") }
}

describe("WeeklyChallengeResponse GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([WeeklyChallengeResponseProbe])
        })
        it("builds the envelope and executes all reachable lazy field callbacks",
            () => {
                const type = schema.getType("WeeklyChallengeResponse") as GraphQLObjectType
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(type).toBeDefined()
                expect(Object.keys(type.getFields()).length).toBeGreaterThan(0)
            })
    })
