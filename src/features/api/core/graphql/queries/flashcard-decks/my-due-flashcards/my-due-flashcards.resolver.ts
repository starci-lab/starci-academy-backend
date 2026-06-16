import {
    Args,
    Int,
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
    UserEntity,
} from "@modules/databases"
import {
    FlashcardReviewService,
} from "@modules/bussiness"
import {
    MyDueFlashcardsData,
    MyDueFlashcardsResponse,
} from "./graphql-types"

/** Default page size for the due-flashcard queue. */
const DEFAULT_LIMIT = 20

/** Hard cap on the page size to bound the query. */
const MAX_LIMIT = 100

/**
 * Spaced-repetition queue: the viewer's due flashcards (no review row yet OR past
 * due) across the decks of their enrolled courses, localized. Delegates the join
 * + localization to {@link FlashcardReviewService}.
 */
@Resolver()
export class MyDueFlashcardsResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Due flashcards fetched successfully",
        [Locale.Vi]: "Lấy thẻ đến hạn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyDueFlashcardsResponse,
        {
            name: "myDueFlashcards",
            description: "The viewer's due flashcards (spaced repetition) across enrolled decks.",
        },
    )
    async execute(
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max cards to return (the count is still the full total).",
            },
        )
            limit: number,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MyDueFlashcardsData> {
        // clamp the page size into a sane bound
        const safeLimit = Math.min(Math.max(limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)
        return this.flashcardReviewService.listDue({
            userId: user.id,
            limit: safeLimit,
            locale,
        })
    }
}
