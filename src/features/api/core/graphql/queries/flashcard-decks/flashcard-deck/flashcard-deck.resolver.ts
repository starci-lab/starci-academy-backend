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
    Locale,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness"
import {
    FlashcardDeckResponse,
} from "./graphql-types"

/**
 * Returns a single interview-prep flashcard deck by id, with its cards, options,
 * and translations eagerly loaded for the study modes.
 */
@Resolver()
export class FlashcardDeckResolver {
    constructor(
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard deck fetched successfully",
        [Locale.Vi]: "Lấy bộ thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FlashcardDeckResponse,
        {
            name: "flashcardDeck",
            description: "Returns a single flashcard deck by id.",
        },
    )
    async execute(
        @Args("flashcardDeckId",
            {
                type: () => ID,
            })
            flashcardDeckId: string,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<FlashcardDeckEntity> {
        // load the full deck graph from the per-locale index; throws a typed 404 when missing
        return this.flashcardDeckReadService.getById(flashcardDeckId,
            locale)
    }
}
