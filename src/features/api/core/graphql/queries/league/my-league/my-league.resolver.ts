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
    LeagueService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    MyLeagueData,
} from "./graphql-types"
import {
    MyLeagueResponse,
} from "./graphql-types"

/**
 * Weekly-league query: the viewer's standing board. Reads their tier + ranked
 * cohort members from {@link LeagueService} (which lazily places a never-seen
 * user into Bronze + the current open cohort), then encodes each member's user id
 * as an opaque global id for the client.
 */
@Resolver()
export class MyLeagueResolver {
    constructor(
        private readonly leagueService: LeagueService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "League standing fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng giải đấu thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyLeagueResponse,
        {
            name: "myLeague",
            description: "The viewer's weekly-league standing (tier + ranked cohort).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyLeagueData> {
        // read the viewer's standing (lazy-places them if they have no row yet)
        const standing = await this.leagueService.getMyStanding(user.id)
        // map each ranked member to the wire shape, encoding the user id as an
        // opaque global id (the FE treats it as opaque + hands it to route resolve)
        const entries = standing.members.map((member) => ({
            userGlobalId: toGlobalId(UserEntity.name,
                member.userId),
            username: member.username,
            avatar: member.avatar,
            weekPoints: member.weekPoints,
            rank: member.rank,
            rankDelta: member.rankDelta,
        }))
        // assemble the standing payload
        return {
            tier: standing.tier,
            weekEndAt: standing.weekEndAt,
            promoteCount: standing.promoteCount,
            demoteCount: standing.demoteCount,
            entries,
        }
    }
}
