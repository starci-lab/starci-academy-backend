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
    LeagueService,
} from "@modules/bussiness/league/league.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    MyLeagueData,
} from "./graphql-types/response"
import {
    MyLeagueResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Weekly-league query: the viewer's standing board. Reads their tier + ranked
 * cohort members from {@link LeagueService} (which lazily places a never-seen
 * user into Bronze + the current open cohort), then encodes each member's user id
 * as an opaque global id for the client.
 */
export class MyLeagueResolver {
    constructor(
        private readonly leagueService: LeagueService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "League standing fetched successfully",
        [Locale.Vi]: "Lấy bảng xếp hạng giải đấu thành công", // vn-ok: vi-locale string emitted to clients
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
