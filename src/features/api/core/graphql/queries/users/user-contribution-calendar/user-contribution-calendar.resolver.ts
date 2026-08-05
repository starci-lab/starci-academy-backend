import {
    Args,
    ID,
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
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    ContributionProjectionService,
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    MyContributionDayData,
} from "../../dashboard/my-contribution-calendar/graphql-types"
import {
    UserContributionCalendarResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: a given user's GitHub-style contribution calendar for one
 * year -- daily learning-activity counts (contents / challenges / milestones).
 * Mirrors `myContributionCalendar` but reads for the user named in the route (id
 * from args), so a profile page can render anyone's activity heatmap. Optional
 * auth -- anonymous viewers may call it; a locked profile is withheld from
 * non-owners by {@link GraphQLProfileVisibilityGuard}. Thin read of the
 * contribution projection keyed by `(user_id, year)`; only active days are returned.
 */
export class UserContributionCalendarResolver {
    constructor(
        private readonly contributionProjectionService: ContributionProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contribution calendar fetched successfully",
        [Locale.Vi]: "Lấy lịch hoạt động thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserContributionCalendarResponse,
        {
            name: "userContributionCalendar",
            description: "Daily learning-activity counts for a user's contribution heatmap, by user id + year.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose contribution calendar to fetch.",
            },
        )
            userId: string,
        @Args(
            "year",
            {
                type: () => Int,
                nullable: true,
                description: "Calendar year to read (defaults to the current year).",
            },
        )
            year: number | null,
    ): Promise<Array<MyContributionDayData>> {
        // default to the current calendar year when the client omits it
        const targetYear = year ?? new Date().getFullYear()
        // single projection-backed read (active days, oldest first, with totals)
        return this.contributionProjectionService.getCalendar(userId,
            targetYear)
    }
}
