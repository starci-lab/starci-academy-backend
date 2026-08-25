import {
    FlashcardDeckRetention, MyFlashcardReviewStatsData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyFlashcardReviewStatsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyFlashcardReviewStatsResponse) query(): MyFlashcardReviewStatsResponse { throw new Error("probe") } }
describe("flashcard review stats response DTOs",
    () => { it("represents retention and review aggregates",
        () => { const retention = Object.assign(new FlashcardDeckRetention(),
            {
                deckId: "d1", deckTitle: "Core", retentionPercent: 75, dueCount: 3
            }); const data = Object.assign(new MyFlashcardReviewStatsData(),
            {
                totalReviewed: 10, streakDays: 2, decks: [retention]
            }); expect(data).toMatchObject({
            totalReviewed: 10, decks: [{
                retentionPercent: 75, dueCount: 3
            }]
        }) }) })

describe("MyFlashcardReviewStatsResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyFlashcardReviewStatsResponse")).toBeDefined()
            })
    })
