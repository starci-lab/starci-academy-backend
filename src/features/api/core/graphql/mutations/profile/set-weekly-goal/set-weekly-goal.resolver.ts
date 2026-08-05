import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    SetWeeklyGoalRequest,
} from "./graphql-types/request"
import {
    SetWeeklyGoalResponse,
} from "./graphql-types/response"

/** Lower bound for the weekly goal (0 lessons = effectively "no target"). */
const MIN_GOAL = 0
/** Upper bound -- a sane cap so the progress ring never reflects an absurd target. */
const MAX_GOAL = 100

@Resolver()
/**
 * Set the authenticated user's weekly learning goal (lessons per week).
 *
 * The value drives the dashboard "weekly goal" progress ring. The client value
 * is clamped into [0, 100] before it is written, so an out-of-range request is
 * normalized rather than rejected. Returns the standard wrapper with no payload.
 */
export class SetWeeklyGoalResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly goal updated successfully",
        [Locale.Vi]: "Cập nhật mục tiêu tuần thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetWeeklyGoalResponse,
        {
            name: "setWeeklyGoal",
            description: "Set the current user's weekly learning goal (lessons per week).",
        },
    )
    async execute(
        @Args("request")
            request: SetWeeklyGoalRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetWeeklyGoalResponse> {
        // clamp the client value into [0, 100] so the stored target is always sane
        const weeklyGoalLessons = Math.min(
            Math.max(Math.trunc(request.lessons),
                MIN_GOAL),
            MAX_GOAL,
        )

        // persist only the goal column on the authenticated user's row
        await this.entityManager.update(
            UserEntity,
            {
                id: user.id,
            },
            {
                weeklyGoalLessons,
            },
        )

        // no payload -- the client already knows the value it sent (post-clamp it can
        // re-fetch via myWeeklyStats if it needs the canonical number)
        return {
        } as SetWeeklyGoalResponse
    }
}
