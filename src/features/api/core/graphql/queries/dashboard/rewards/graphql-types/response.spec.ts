import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    RewardsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => RewardsResponse) query(): RewardsResponse { throw new Error("probe") } }
import {
    RewardObject
} from "./response"
describe("rewards response",
    () => { it("exposes reward status and optional redemption",
        () => { const reward = Object.assign(new RewardObject(),
            {
                id: "r1", title: "Reward", claimed: false, voucher: null
            }); const response = Object.assign(new RewardsResponse(),
            {
                data: [reward]
            }); expect(response).toMatchObject({
            data: [{
                id: "r1", claimed: false, voucher: null
            }]
        }) }) })

describe("RewardsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("RewardsResponse")).toBeDefined()
            })
    })
