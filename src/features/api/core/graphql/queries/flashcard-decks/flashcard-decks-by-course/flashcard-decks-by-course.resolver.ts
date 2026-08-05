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
    FlashcardDecksByCourseResponse,
} from "./graphql-types/response"

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
        [Locale.Vi]: "Lấy danh sách bộ thẻ thành công", // vn-ok: vi-locale string emitted to clients
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
