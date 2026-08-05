import {
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
    DailyQuestService,
} from "@modules/bussiness"
import {
    MyDailyQuestData,
    MyDailyQuestResponse,
} from "./graphql-types"

@Resolver()
/**
 * Daily-quest query: today's (Asia/Ho_Chi_Minh) per-task progress vs target, plus
 * whether everything is done and whether the reward was already claimed. Progress
 * is derived per request from today's activity (no inline aggregate in the
 * resolver — the bussiness service owns the SQL).
 */
export class MyDailyQuestResolver {
    constructor(
        private readonly dailyQuestService: DailyQuestService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Daily quest fetched successfully",
        [Locale.Vi]: "Lấy nhiệm vụ hằng ngày thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyDailyQuestResponse,
        {
            name: "myDailyQuest",
            description: "The viewer's daily quest for today (per-task progress + claim state).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyDailyQuestData> {
        return this.dailyQuestService.getMyDailyQuest(user.id)
    }
}
