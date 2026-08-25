import {
    MockInterviewPhaseScoreItem, MockInterviewGradeSessionData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    GradeMockInterviewSessionResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => GradeMockInterviewSessionResponse) query(): GradeMockInterviewSessionResponse { throw new Error("probe") } }
describe("graded mock interview response DTOs",
    () => { it("exposes phase score and overall status",
        () => { const phase = Object.assign(new MockInterviewPhaseScoreItem(),
            {
                phase: "technical", score: 85, maxScore: 100
            }); const data = Object.assign(new MockInterviewGradeSessionData(),
            {
                sessionId: "s1", phaseScores: [phase], overallScore: 85, feedback: "Good"
            }); expect(data).toMatchObject({
            phaseScores: [{
                score: 85
            }], overallScore: 85
        }) }) })

describe("GradeMockInterviewSessionResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("GradeMockInterviewSessionResponse")).toBeDefined()
            })
    })
