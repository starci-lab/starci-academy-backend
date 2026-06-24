import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    BadRequestException,
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
    GraphQLMustEnrolledGuard,
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
    @UseGuards(KeycloakAuthGraphQLGuard, GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview question drawn successfully",
        [Locale.Vi]: "Bốc câu hỏi phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => DrawInterviewCardResponse,
        {
            name: "drawInterviewCard",
            description: "Draws a random interview question — across a whole course (random mode) or one deck.",
        },
    )
    async execute(
        @Args("courseId",
            {
                type: () => ID,
                nullable: true,
                description: "Course to draw a random question across all its decks (random interview mode).",
            })
            courseId: string | null,
        @Args("flashcardDeckId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional deck to restrict the draw to (legacy per-topic mode).",
            })
            flashcardDeckId: string | null,
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
        // need a scope: a deck (legacy per-topic) or a course (random mode)
        if (!flashcardDeckId && !courseId) {
            throw new BadRequestException("Either courseId or flashcardDeckId is required")
        }
        // draw a random gradable card server-side: one deck when given, else random
        // across the whole course (the default "random interview" mode)
        const card = flashcardDeckId
            ? await this.flashcardDeckReadService.drawRandomCard({
                flashcardDeckId,
                locale,
                level,
            })
            : await this.flashcardDeckReadService.drawRandomCardForCourse({
                courseId: courseId as string,
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
