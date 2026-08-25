import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    CompleteFlashcardQuizSessionResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => CompleteFlashcardQuizSessionResponse) query(): CompleteFlashcardQuizSessionResponse { throw new Error("probe") } }
import {
    CompleteFlashcardQuizSessionData, QuizSessionReadinessData
} from "./response"
describe("complete flashcard quiz response",
    () => { it("returns score and readiness summary",
        () => { const readiness = Object.assign(new QuizSessionReadinessData(),
            {
                ready: true, weakTagCount: 0
            }); const data = Object.assign(new CompleteFlashcardQuizSessionData(),
            {
                sessionId: "s1", scorePercent: 100, readiness
            }); expect(data).toMatchObject({
            sessionId: "s1", scorePercent: 100, readiness: {
                ready: true
            }
        }) }) })

describe("CompleteFlashcardQuizSessionResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("CompleteFlashcardQuizSessionResponse")).toBeDefined()
            })
    })
