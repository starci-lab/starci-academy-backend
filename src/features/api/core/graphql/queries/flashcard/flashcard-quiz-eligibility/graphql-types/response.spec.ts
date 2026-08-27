import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    FlashcardQuizEligibilityResponse
} from "./response"

@Resolver()
class EligibilitySchemaProbe {
    @Query(() => FlashcardQuizEligibilityResponse)
    query(): FlashcardQuizEligibilityResponse { throw new Error("schema probe") }
}

describe("FlashcardQuizEligibilityResponse",
    () => {
        it("builds the additive response schema",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await moduleRef.get(GraphQLSchemaFactory).create([EligibilitySchemaProbe])
                expect(schema.getType("FlashcardQuizEligibilityResponse")).toBeDefined()
            })
    })
