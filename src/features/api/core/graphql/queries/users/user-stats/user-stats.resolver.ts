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

/**
 * Resolved follower / following counts layered onto the shared `UserEntity`
 * GraphQL type. Available anywhere a user is returned (`me`, public profile).
 *
 * Counts are derived from the directed `user_follows` edges on demand rather
 * than cached on the user row, so they never drift from the source of truth.
 * Each field is only computed when the client actually selects it.
 */
@Resolver(() => UserEntity)
export class UserStatsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
        // incoming edges → rows where this user is on the `following` side
        return this.entityManager.count(
            UserFollowEntity,
            {
                where: {
                    following: {
                        id: user.id,
                    },
                },
            },
        )
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
        // outgoing edges → rows where this user is on the `follower` side
        return this.entityManager.count(
            UserFollowEntity,
            {
                where: {
                    follower: {
                        id: user.id,
                    },
                },
            },
        )
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
