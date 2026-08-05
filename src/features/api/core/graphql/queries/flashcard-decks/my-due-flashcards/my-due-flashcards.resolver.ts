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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FlashcardReviewService,
} from "@modules/bussiness/flashcard/flashcard-review.service"
import {
    DEFAULT_PAGINATION_LIMIT,
} from "@modules/lib/common/constants/pagination"
import {
    clampPagination,
} from "@modules/lib/common/utils/pagination"
import {
    MyDueFlashcardsData,
    MyDueFlashcardsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Spaced-repetition queue: the viewer's due flashcards (no review row yet OR past
 * due) across the decks of their enrolled courses, localized. Delegates the join
 * + localization to {@link FlashcardReviewService}.
 */
export class MyDueFlashcardsResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Due flashcards fetched successfully",
        [Locale.Vi]: "Lấy thẻ đến hạn thành công", // vn-ok: vi-locale string emitted to clients
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
            "courseId",
            {
                type: () => String,
                nullable: true,
                description: "Scope the due queue to this course's decks; omit for a global (cross-course) queue.",
            },
        )
            courseId: string | undefined,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_PAGINATION_LIMIT,
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
        const { limit: safeLimit } = clampPagination(limit)
        return this.flashcardReviewService.listDue({
            userId: user.id,
            courseId,
            limit: safeLimit,
            locale,
        })
    }
}
