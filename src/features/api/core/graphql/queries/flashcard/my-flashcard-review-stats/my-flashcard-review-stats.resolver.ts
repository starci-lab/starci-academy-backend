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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MyFlashcardReviewStatsService,
} from "./my-flashcard-review-stats.service"
import {
    MyFlashcardReviewStatsData,
    MyFlashcardReviewStatsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The viewer's aggregated flashcard review stats for one course --
 * a reviewed-count/XP trend line plus a per-deck breakdown across their
 * recent completed sessions. Mirrors `myFlashcardQuizStats`, minus `byTag`
 * (see `MyFlashcardReviewStatsService`'s own doc). Enrollment-scoped, same
 * as `myFlashcardReviewHistory`.
 */
export class MyFlashcardReviewStatsResolver {
    constructor(
        private readonly myFlashcardReviewStatsService: MyFlashcardReviewStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê ôn tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardReviewStatsResponse,
        {
            name: "myFlashcardReviewStats",
            description: "The viewer's aggregated flashcard review stats for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard review stats to compute.",
            })
            courseId: string,
    ): Promise<MyFlashcardReviewStatsData> {
        const result = await this.myFlashcardReviewStatsService.compute({
            userId: user.id,
            courseId,
            locale,
        })
        return {
            leechFocus: result.leechFocus,
            weakTags: result.weakTags,
            matureRetention: result.matureRetention,
            youngRetention: result.youngRetention,
            reviewedTotal: result.reviewedTotal,
            courseRetention: result.courseRetention,
            deckRetention: result.deckRetention,
        }
    }
}
