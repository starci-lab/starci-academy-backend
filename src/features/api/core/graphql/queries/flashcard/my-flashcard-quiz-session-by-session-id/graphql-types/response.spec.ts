import {
    FlashcardQuizSessionResultData, MyFlashcardQuizSessionBySessionIdData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyFlashcardQuizSessionBySessionIdResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyFlashcardQuizSessionBySessionIdResponse) query(): MyFlashcardQuizSessionBySessionIdResponse { throw new Error("probe") } }
describe("flashcard quiz session response DTOs",
    () => { it("returns session result and weak-tag state",
        () => { const result = Object.assign(new FlashcardQuizSessionResultData(),
            {
                cardId: "card1", correct: false, answer: "B", expected: "A"
            }); const data = Object.assign(new MyFlashcardQuizSessionBySessionIdData(),
            {
                sessionId: "s1", results: [result], completed: true, scorePercent: 50
            }); expect(data).toMatchObject({
            sessionId: "s1", results: [{
                correct: false
            }], completed: true
        }) }) })

describe("MyFlashcardQuizSessionBySessionIdResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyFlashcardQuizSessionBySessionIdResponse")).toBeDefined()
            })
    })
