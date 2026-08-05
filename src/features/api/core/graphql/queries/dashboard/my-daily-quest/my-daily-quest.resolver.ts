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
    DailyQuestService,
} from "@modules/bussiness/daily-quest/daily-quest.service"
import {
    MyDailyQuestData,
    MyDailyQuestResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Daily-quest query: today's (Asia/Ho_Chi_Minh) per-task progress vs target, plus
 * whether everything is done and whether the reward was already claimed. Progress
 * is derived per request from today's activity (no inline aggregate in the
 * resolver -- the bussiness service owns the SQL).
 */
export class MyDailyQuestResolver {
    constructor(
        private readonly dailyQuestService: DailyQuestService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Daily quest fetched successfully",
        [Locale.Vi]: "Lấy nhiệm vụ hằng ngày thành công", // vn-ok: vi-locale string emitted to clients
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
