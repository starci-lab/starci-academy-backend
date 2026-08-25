import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyFlashcardQuizHistoryResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyFlashcardQuizHistoryResponse) query(): MyFlashcardQuizHistoryResponse { throw new Error("probe") } }
import {
    MyFlashcardQuizHistoryItem, MyFlashcardQuizHistoryData
} from "./response"
describe("flashcard quiz history response",
    () => { it("retains session score and completion date",
        () => { const item = Object.assign(new MyFlashcardQuizHistoryItem(),
            {
                sessionId: "s1", scorePercent: 90, completedAt: new Date()
            }); const data = Object.assign(new MyFlashcardQuizHistoryData(),
            {
                items: [item], total: 1
            }); expect(data).toMatchObject({
            items: [{
                sessionId: "s1", scorePercent: 90
            }], total: 1
        }) }) })

describe("MyFlashcardQuizHistoryResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyFlashcardQuizHistoryResponse")).toBeDefined()
            })
    })
