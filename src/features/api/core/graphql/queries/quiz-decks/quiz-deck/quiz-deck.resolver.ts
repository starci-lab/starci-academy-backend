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
    FlashcardDeckResponse,
} from "./graphql-types"

/**
 * Returns a single interview-prep quiz deck by id, with its cards, options,
 * and translations eagerly loaded for the study modes.
 */
@Resolver()
export class QuizDeckResolver {
    constructor(
        private readonly quizDeckReadService: QuizDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Quiz deck fetched successfully",
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
    ): Promise<FlashcardDeckEntity> {
        // load the full deck graph; throws a typed 404 when missing
        return this.quizDeckReadService.getById(flashcardDeckId)
    }
}
