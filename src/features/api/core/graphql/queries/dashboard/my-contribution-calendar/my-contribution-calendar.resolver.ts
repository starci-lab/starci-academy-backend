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
    ContributionProjectionService,
} from "@modules/bussiness"
import {
    MyContributionCalendarResponse,
    MyContributionDayData,
} from "./graphql-types"

/**
 * GitHub-style contribution calendar — the viewer's daily learning-activity counts
 * (contents / challenges / milestones) for the heatmap. Thin read of the
 * contribution projection (the per-day GROUP BY runs in the projection's recompute,
 * kept fresh by a TTL lazy-refresh — never computed inline here). Only active days
 * are returned; the client fills the grid gaps with zero-cells.
 */
@Resolver()
export class MyContributionCalendarResolver {
    constructor(
        private readonly contributionProjectionService: ContributionProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contribution calendar fetched successfully",
        [Locale.Vi]: "Lấy lịch hoạt động thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyContributionCalendarResponse,
        {
            name: "myContributionCalendar",
            description: "Daily learning-activity counts (contents/challenges/milestones) for the contribution heatmap.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyContributionDayData>> {
        // single projection-backed read (active days, oldest first, with totals)
        return this.contributionProjectionService.getCalendar(user.id)
    }
}
