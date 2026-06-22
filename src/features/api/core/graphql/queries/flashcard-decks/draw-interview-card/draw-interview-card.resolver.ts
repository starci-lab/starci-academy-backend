import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    FlashcardLevel,
    GraphQLTypeFlashcardLevel,
    Locale,
} from "@modules/databases"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness"
import {
    DrawInterviewCardResponse,
    InterviewCardData,
} from "./graphql-types"

/**
 * Draws one random gradable question from a deck for the voice-interview mode.
 * The candidate answers by speech; the client transcribes it and submits the
 * transcript to the `gradeInterviewAnswer` mutation. The model answer is never
 * returned here — grading reloads it server-side by card id.
 */
@Resolver()
export class DrawInterviewCardResolver {
    constructor(
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview question drawn successfully",
        [Locale.Vi]: "Bốc câu hỏi phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => DrawInterviewCardResponse,
        {
            name: "drawInterviewCard",
            description: "Draws a random interview question from a deck (model answer withheld).",
        },
    )
    async execute(
        @Args("flashcardDeckId",
            {
                type: () => ID,
            })
            flashcardDeckId: string,
        @Args("level",
            {
                type: () => GraphQLTypeFlashcardLevel,
                nullable: true,
                description: "Optional seniority level to restrict the draw to.",
            })
            level: FlashcardLevel | null,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<InterviewCardData> {
        // draw a random gradable card server-side (throws typed 404 / no-gradable errors)
        const card = await this.flashcardDeckReadService.drawRandomCard({
            flashcardDeckId,
            locale,
            level,
        })
        // project to the safe subset — never leak the model answer / explanation to the client
        return {
            id: card.id,
            deckId: card.deckId,
            question: card.question,
            level: card.level,
            tags: card.tags,
        }
    }
}
