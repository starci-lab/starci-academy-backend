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
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FlashcardDeckReadService,
} from "@modules/bussiness/flashcard/flashcard-deck.service"
import {
    FlashcardDeckResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Returns a single interview-prep flashcard deck by id, with its cards, options,
 * and translations eagerly loaded for the study modes.
 */
export class FlashcardDeckResolver {
    constructor(
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard deck fetched successfully",
        [Locale.Vi]: "Lấy bộ thẻ thành công", // vn-ok: vi-locale string emitted to clients
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
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<FlashcardDeckEntity> {
        // load the full deck graph from the per-locale index; throws a typed 404 when missing;
        // cards are annotated with the viewer's nextIntervals (rating-bar SM-2 preview)
        return this.flashcardDeckReadService.getById(flashcardDeckId,
            locale,
            user.id)
    }
}
