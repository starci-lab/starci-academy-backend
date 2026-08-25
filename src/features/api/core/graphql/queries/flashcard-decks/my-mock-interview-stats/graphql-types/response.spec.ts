import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyMockInterviewStatsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyMockInterviewStatsResponse) query(): MyMockInterviewStatsResponse { throw new Error("probe") } }
import {
    MockInterviewStatsTrendPoint, MyMockInterviewStatsData
} from "./response"
describe("mock interview stats response",
    () => { it("represents trend points and aggregate counts",
        () => { const point = Object.assign(new MockInterviewStatsTrendPoint(),
            {
                date: "2026-01-01", score: 80
            }); const data = Object.assign(new MyMockInterviewStatsData(),
            {
                totalSessions: 2, averageScore: 75, trend: [point]
            }); expect(data).toMatchObject({
            totalSessions: 2, trend: [{
                score: 80
            }]
        }) }) })

describe("MyMockInterviewStatsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyMockInterviewStatsResponse")).toBeDefined()
            })
    })
