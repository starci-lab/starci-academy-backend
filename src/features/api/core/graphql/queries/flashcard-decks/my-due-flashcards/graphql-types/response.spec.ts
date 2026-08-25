import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyDueFlashcardsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyDueFlashcardsResponse) query(): MyDueFlashcardsResponse { throw new Error("probe") } }
import {
    DueFlashcardObject, MyDueFlashcardsData
} from "./response"
describe("due flashcards response",
    () => { it("projects due card identity and deck context",
        () => { const card = Object.assign(new DueFlashcardObject(),
            {
                id: "f1", deckId: "d1", front: "Q", dueAt: new Date()
            }); const data = Object.assign(new MyDueFlashcardsData(),
            {
                cards: [card], total: 1
            }); expect(data).toMatchObject({
            cards: [{
                id: "f1", deckId: "d1"
            }], total: 1
        }) }) })

describe("MyDueFlashcardsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyDueFlashcardsResponse")).toBeDefined()
            })
    })
