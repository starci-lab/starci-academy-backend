import {
    MyInProgressMockInterviewSessionData, MyInProgressMockInterviewSessionTurnItem
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyInProgressMockInterviewSessionResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyInProgressMockInterviewSessionResponse) query(): MyInProgressMockInterviewSessionResponse { throw new Error("probe") } }
describe("in-progress mock interview response DTOs",
    () => { it("keeps turn ordering and nullable completion fields",
        () => { const turn = Object.assign(new MyInProgressMockInterviewSessionTurnItem(),
            {
                turnIndex: 0, question: "Tell me", answer: null, score: null
            }); const data = Object.assign(new MyInProgressMockInterviewSessionData(),
            {
                sessionId: "s1", turns: [turn], completedAt: null
            }); expect(data).toMatchObject({
            sessionId: "s1", turns: [{
                turnIndex: 0, answer: null
            }], completedAt: null
        }) }) })

describe("MyInProgressMockInterviewSessionResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyInProgressMockInterviewSessionResponse")).toBeDefined()
            })
    })
