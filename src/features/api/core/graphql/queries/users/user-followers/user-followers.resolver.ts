import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
    UserFollowEntity,
} from "@modules/databases"
import {
    toGlobalId,
} from "@modules/routing"
import {
    FollowerUserData,
    UserFollowersResponse,
} from "./graphql-types"

/** Default + hard-cap on how many followers to surface in the avatar group. */
const DEFAULT_LIMIT = 20
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 50

@Resolver()
/**
 * Public list of a user's followers (most recent first), keyed by username — the
 * data behind the profile's "who follows" avatar group. Returns the header
 * fields (opaque id + username + display name + avatar) for each follower; the
 * total count lives on `userProfile.followerCount`, so this is just the visible
 * slice. Public (no auth) — a logged-out recruiter can see who follows a profile.
 */
export class UserFollowersResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Followers fetched successfully",
        [Locale.Vi]: "Lấy danh sách người theo dõi thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserFollowersResponse,
        {
            name: "userFollowers",
            description: "Followers of a user (most recent first) for the profile avatar group.",
        },
    )
    async execute(
        @Args(
            "username",
            {
                type: () => String,
                description: "Username of the profile whose followers to list.",
            },
        )
            username: string,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max followers to return.",
            },
        )
            limit: number,
        @Args(
            "offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
                description: "Number of followers to skip (for infinite scroll).",
            },
        )
            offset: number,
    ): Promise<Array<FollowerUserData>> {
        // clamp the page size into [1, MAX_LIMIT]
        const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)
        // never go negative on the skip
        const skip = Math.max(offset ?? 0,
            0)

        // resolve the target user from the username; unknown / deleted → empty
        const target = await this.entityManager.findOne(UserEntity,
            {
                where: {
                    username,
                    isDeleted: false,
                },
            })
        if (!target) {
            return []
        }

        // follower edges pointing at the target, newest first, with the follower user
        // (repository find handles relation + limit cleanly — avoids the QB
        // leftJoinAndSelect+take+orderBy "databaseName" pitfall)
        const follows: Array<UserFollowEntity> = await this.entityManager.find(UserFollowEntity,
            {
                where: {
                    following: {
                        id: target.id,
                    },
                },
                relations: {
                    follower: true,
                },
                order: {
                    createdAt: "DESC",
                },
                skip,
                take,
            })

        // map each (non-deleted) follower to the avatar-group item shape
        return follows
            .map((follow) => follow.follower)
            .filter((follower): follower is UserEntity => Boolean(follower) && !follower.isDeleted)
            .map((follower) => ({
                globalId: toGlobalId(UserEntity.name,
                    follower.id),
                username: follower.username,
                displayName: follower.displayName,
                avatar: follower.avatar,
            }))
    }
}
