import {
    Args,
    Context,
    ID,
    Int,
    Query,
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
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ContributionProjectionService,
} from "@modules/bussiness"
import {
    MyContributionDayData,
} from "../../dashboard/my-contribution-calendar/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserContributionCalendarResponse,
} from "./graphql-types"

/**
 * Public profile query: a given user's GitHub-style contribution calendar for one
 * year — daily learning-activity counts (contents / challenges / milestones).
 * Mirrors `myContributionCalendar` but reads for the user named in the route (id
 * from args), so a profile page can render anyone's activity heatmap. Optional
 * auth — anonymous viewers may call it. Thin read of the contribution projection
 * keyed by `(user_id, year)`; only active days are returned, the client fills the
 * grid gaps with zero-cells.
 */
@Resolver()
export class UserContributionCalendarResolver {
    constructor(
        private readonly contributionProjectionService: ContributionProjectionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contribution calendar fetched successfully",
        [Locale.Vi]: "Lấy lịch hoạt động thành công",
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
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<Array<MyContributionDayData>> {
        // locked profile → withhold the heatmap from everyone but the owner
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId,
            viewerId: context.req?.user?.id,
        })) {
            return []
        }
        // default to the current calendar year when the client omits it
        const targetYear = year ?? new Date().getFullYear()
        // single projection-backed read (active days, oldest first, with totals)
        return this.contributionProjectionService.getCalendar(userId,
            targetYear)
    }
}
