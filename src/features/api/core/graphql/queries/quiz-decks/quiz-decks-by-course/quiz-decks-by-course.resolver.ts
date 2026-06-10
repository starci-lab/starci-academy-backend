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
    Locale,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    QuizDeckReadService,
} from "@modules/bussiness"
import {
    FlashcardDecksByCourseResponse,
} from "./graphql-types"

/**
 * Lists the multiple-choice quiz decks owned by a course, in display order,
 * with their cards, options, linked contents, and translations eagerly loaded.
 * Optionally filters to decks linked to a specific content.
 */
@Resolver()
export class QuizDecksByCourseResolver {
    constructor(
        private readonly quizDeckReadService: QuizDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Quiz decks fetched successfully",
        [Locale.Vi]: "Lấy danh sách bộ thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FlashcardDecksByCourseResponse,
        {
            name: "flashcardDecksByCourse",
            description: "Lists the flashcard decks owned by a course (optionally filtered by content).",
        },
    )
    async execute(
        @Args("courseId",
            {
                type: () => ID,
            })
            courseId: string,
        @Args("contentId",
            {
                type: () => ID,
                nullable: true,
            })
            contentId?: string,
    ): Promise<Array<FlashcardDeckEntity>> {
        // delegate the full-graph load to the business read service
        return this.quizDeckReadService.listByCourse(courseId,
            contentId)
    }
}
