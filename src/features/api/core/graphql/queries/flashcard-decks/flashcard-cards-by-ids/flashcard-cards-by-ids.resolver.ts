import {
    Args,
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
    FlashcardCardsByIdsData,
    FlashcardCardsByIdsResponse,
} from "./graphql-types/response"

/** Hard cap on how many ids one call may request. */
const MAX_IDS = 100

@Resolver()
/**
 * Flashcards fetched by an EXACT set of ids, regardless of current due status --
 * rehydrates a resumable `DueReview` batch to its original draw (see
 * {@link FlashcardReviewService.listByIds} for why a due-status filter breaks
 * resume: a card graded since the batch was drawn is no longer "due" and would
 * silently drop out of a `myDueFlashcards`-filtered resume).
 */
export class FlashcardCardsByIdsResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcards fetched successfully",
        [Locale.Vi]: "Lấy thẻ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FlashcardCardsByIdsResponse,
        {
            name: "flashcardCardsByIds",
            description: "Flashcards by exact id, regardless of due status — used to resume a due-review batch.",
        },
    )
    async execute(
        @Args(
            "courseId",
            {
                type: () => String,
                nullable: true,
                description: "Scope the review-row join to this course's enrollment; omit for the global (cross-course) join.",
            },
        )
            courseId: string | undefined,
        @Args(
            "cardIds",
            {
                type: () => [String],
                description: "The exact card ids to fetch, in caller order.",
            },
        )
            cardIds: Array<string>,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<FlashcardCardsByIdsData> {
        const safeCardIds = cardIds.slice(0,
            MAX_IDS)
        const cards = await this.flashcardReviewService.listByIds({
            userId: user.id,
            courseId,
            cardIds: safeCardIds,
            locale,
        })
        return {
            cards,
        }
    }
}
