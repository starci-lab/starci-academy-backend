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
    MyFlashcardQuizStatsService,
} from "./my-flashcard-quiz-stats.service"
import {
    MyFlashcardQuizStatsData,
    MyFlashcardQuizStatsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The viewer's aggregated flashcard quick-quiz stats for one
 * course -- a coverage/XP trend line plus per-tag and per-deck breakdowns
 * across their recent completed sessions, so the recap/stats surface has
 * progress data without the client re-deriving any of it. Enrollment-scoped,
 * same as `myFlashcardQuizHistory`.
 */
export class MyFlashcardQuizStatsResolver {
    constructor(
        private readonly myFlashcardQuizStatsService: MyFlashcardQuizStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê hỏi nhanh thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardQuizStatsResponse,
        {
            name: "myFlashcardQuizStats",
            description: "The viewer's aggregated flashcard quick-quiz stats for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard quiz stats to compute.",
            })
            courseId: string,
    ): Promise<MyFlashcardQuizStatsData> {
        const result = await this.myFlashcardQuizStatsService.compute({
            userId: user.id,
            courseId,
        })
        return {
            insufficientData: result.insufficientData,
            byTag: result.byTag,
            conceptCoverage: result.conceptCoverage,
        }
    }
}
