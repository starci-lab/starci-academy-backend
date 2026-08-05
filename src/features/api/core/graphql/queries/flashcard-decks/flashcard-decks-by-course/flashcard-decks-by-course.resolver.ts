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
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    FlashcardDeckEntity,
    UserEntity,
} from "@modules/databases"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness"
import {
    FlashcardDecksByCourseResponse,
} from "./graphql-types"

@Resolver()
/**
 * Lists the multiple-choice flashcard decks owned by a course, in display order,
 * with their cards, options, linked contents, and translations eagerly loaded.
 * Optionally filters to decks linked to a specific content.
 */
export class FlashcardDecksByCourseResolver {
    constructor(
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard decks fetched successfully",
        [Locale.Vi]: "Lấy danh sách bộ thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FlashcardDecksByCourseResponse,
        {
            name: "flashcardDecksByCourse",
            description: "Lists the flashcard decks owned by a course.",
        },
    )
    async execute(
        @Args("courseId",
            {
                type: () => ID,
            })
            courseId: string,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<FlashcardDeckEntity>> {
        // delegate the full-graph load to the business read service, localized to
        // the request + annotated with the viewer's per-deck due / mastered counts
        return this.flashcardDeckReadService.listByCourse(courseId,
            locale,
            user.id)
    }
}
