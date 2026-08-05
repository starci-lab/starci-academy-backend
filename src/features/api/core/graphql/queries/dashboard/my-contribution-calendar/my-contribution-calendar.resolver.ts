import {
    Args,
    Int,
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
    ContributionProjectionService,
} from "@modules/bussiness/projections/contribution/contribution-projection.service"
import {
    MyContributionCalendarResponse,
    MyContributionDayData,
} from "./graphql-types/response"

@Resolver()
/**
 * GitHub-style contribution calendar for ONE year -- the viewer's daily learning
 * activity counts (contents / challenges / milestones). Thin read of the
 * contribution projection keyed by `(user_id, year)` (the per-day GROUP BY runs in
 * the projection's recompute, never inline here). Only active days are returned;
 * the client fills the grid gaps with zero-cells. GitHub renders one year at a
 * time + lets you flip years -- `year` selects which.
 */
export class MyContributionCalendarResolver {
    constructor(
        private readonly contributionProjectionService: ContributionProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contribution calendar fetched successfully",
        [Locale.Vi]: "Lấy lịch hoạt động thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyContributionCalendarResponse,
        {
            name: "myContributionCalendar",
            description: "Daily learning-activity counts (contents/challenges/milestones) for a year's contribution heatmap.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("year",
            {
                type: () => Int,
                nullable: true,
                description: "Calendar year to read (defaults to the current year).",
            })
            year: number | null,
    ): Promise<Array<MyContributionDayData>> {
        // default to the current calendar year when the client omits it
        const targetYear = year ?? new Date().getFullYear()
        // single projection-backed read (active days, oldest first, with totals)
        return this.contributionProjectionService.getCalendar(user.id,
            targetYear)
    }
}
