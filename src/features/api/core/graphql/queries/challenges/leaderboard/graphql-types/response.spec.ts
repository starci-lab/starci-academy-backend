import {
    LeaderboardEntryData, LeaderboardResponseData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    LeaderboardResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => LeaderboardResponse) query(): LeaderboardResponse { throw new Error("probe") } }
describe("challenge leaderboard response DTOs",
    () => { it("preserves rank, score and optional viewer rank",
        () => { const entry = Object.assign(new LeaderboardEntryData(),
            {
                rank: 1, userId: "u1", username: "alice", score: 99, solvedCount: 4
            }); const data = Object.assign(new LeaderboardResponseData(),
            {
                entries: [entry], myRank: null, total: 1
            }); expect(data).toMatchObject({
            entries: [{
                rank: 1, score: 99
            }], myRank: null, total: 1
        }) }) })

describe("LeaderboardResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("LeaderboardResponse")).toBeDefined()
            })
    })
