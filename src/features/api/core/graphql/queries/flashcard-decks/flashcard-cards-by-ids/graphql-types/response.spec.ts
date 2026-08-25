import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    FlashcardCardsByIdsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => FlashcardCardsByIdsResponse) query(): FlashcardCardsByIdsResponse { throw new Error("probe") } }
import {
    FlashcardByIdObject, FlashcardCardsByIdsData
} from "./response"
describe("flashcard cards by ids response",
    () => { it("preserves card prompt, answer and scheduling state",
        () => { const card = Object.assign(new FlashcardByIdObject(),
            {
                id: "f1", front: "Q", back: "A", dueAt: null
            }); const data = Object.assign(new FlashcardCardsByIdsData(),
            {
                cards: [card]
            }); expect(data).toMatchObject({
            cards: [{
                id: "f1", front: "Q", back: "A", dueAt: null
            }]
        }) }) })

describe("FlashcardCardsByIdsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("FlashcardCardsByIdsResponse")).toBeDefined()
            })
    })
