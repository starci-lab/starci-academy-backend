import {
    LearnAiCompanionData, LearnAiCompanionSessionType, LearnAiCompanionTurnType
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    LearnAiCompanionResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => LearnAiCompanionResponse) query(): LearnAiCompanionResponse { throw new Error("probe") } }
describe("Learn AI companion response DTOs",
    () => { it("supports absent session and durable turn error state",
        () => { const turn = Object.assign(new LearnAiCompanionTurnType(),
            {
                streamId: "stream1", state: "failed", response: null, errorCode: "TIMEOUT", attemptCount: 2, updatedAt: new Date()
            }); const data = Object.assign(new LearnAiCompanionData(),
            {
                session: null as LearnAiCompanionSessionType | null, messages: [], turns: [turn]
            }); expect(data).toMatchObject({
            session: null, messages: [], turns: [{
                state: "failed", errorCode: "TIMEOUT", attemptCount: 2
            }]
        }) }) })

describe("LearnAiCompanionResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("LearnAiCompanionResponse")).toBeDefined()
            })
    })
