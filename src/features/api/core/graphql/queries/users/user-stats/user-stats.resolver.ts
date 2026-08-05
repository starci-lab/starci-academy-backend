import {
    Context,
    Int,
    Parent,
    ResolveField,
    Resolver,
} from "@nestjs/graphql"
import type {
    Request,
} from "express"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    UserFollowEntity,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "@modules/bussiness"

@Resolver(() => UserEntity)
/**
 * Resolved follower / following counts layered onto the shared `UserEntity`
 * GraphQL type. Available anywhere a user is returned (`me`, public profile).
 *
 * Follower/following counts are read from the user-stats CQRS projection (kept
 * fresh by inline recompute + CDC, lazily refreshed on read past its TTL); the
 * per-viewer `isFollowedByMe` stays a live edge lookup. Each field is only
 * computed when the client actually selects it.
 */
export class UserStatsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    /**
     * Number of users who follow this user (incoming edges).
     */
    @ResolveField(
        () => Int,
        {
            name: "followerCount",
            description: "Number of users who follow this user.",
        },
    )
    async followerCount(
        @Parent()
            user: UserEntity,
    ): Promise<number> {
        // read from the flat user-stats projection (lazy-recomputed if stale)
        const stats = await this.userStatsProjectionService.getStats(user.id)
        return stats.followerCount
    }

    /**
     * Number of users this user follows (outgoing edges).
     */
    @ResolveField(
        () => Int,
        {
            name: "followingCount",
            description: "Number of users this user follows.",
        },
    )
    async followingCount(
        @Parent()
            user: UserEntity,
    ): Promise<number> {
        // read from the flat user-stats projection (lazy-recomputed if stale)
        const stats = await this.userStatsProjectionService.getStats(user.id)
        return stats.followingCount
    }

    /**
     * Whether the requesting viewer follows this user. False when the viewer is
     * anonymous or is looking at their own profile. Only meaningful on queries
     * whose guard populates `req.user` (e.g. `me`, `userProfile`).
     */
    @ResolveField(
        () => Boolean,
        {
            name: "isFollowedByMe",
            description: "True when the requesting user already follows this user.",
        },
    )
    async isFollowedByMe(
        @Parent()
            user: UserEntity,
        @Context()
            context: {
                req?: Request & { user?: UserEntity }
            },
    ): Promise<boolean> {
        // viewer is set by the (optional) auth guard on the parent query
        const viewer = context.req?.user
        // anonymous viewer or self-view → not "followed by me"
        if (!viewer || viewer.id === user.id) {
            return false
        }
        // does an edge viewer → user exist?
        const existing = await this.entityManager.count(
            UserFollowEntity,
            {
                where: {
                    follower: {
                        id: viewer.id,
                    },
                    following: {
                        id: user.id,
                    },
                },
            },
        )
        return existing > 0
    }
}
