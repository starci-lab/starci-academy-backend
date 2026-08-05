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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserFollowEntity,
} from "@modules/databases/postgresql/primary/entities/user-follow.entity"
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
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    FollowerUserData,
} from "../user-followers/graphql-types/response"
import {
    UserFollowingResponse,
} from "./graphql-types/response"

/** Default + hard-cap on how many following rows to surface per page. */
const DEFAULT_LIMIT = 20
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 50

@Resolver()
/**
 * Public list of the users a profile follows (most recent first), keyed by
 * username -- the "following" side of the follow-list modal. Mirrors
 * {@link UserFollowersResolver} but walks the opposite edge: follow rows whose
 * `follower` is the target, mapped to the `following` user. Offset-paginated for
 * infinite scroll. Public (no auth).
 */
export class UserFollowingResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Following fetched successfully",
        [Locale.Vi]: "Lấy danh sách đang theo dõi thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserFollowingResponse,
        {
            name: "userFollowing",
            description: "Users a profile follows (most recent first) for the follow-list modal.",
        },
    )
    async execute(
        @Args(
            "username",
            {
                type: () => String,
                description: "Username of the profile whose following to list.",
            },
        )
            username: string,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max following rows to return.",
            },
        )
            limit: number,
        @Args(
            "offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
                description: "Number of rows to skip (for infinite scroll).",
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

        // resolve the target user from the username; unknown / deleted -> empty
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

        // follow edges originating from the target, newest first, with the followed
        // user (repository find avoids the QB leftJoinAndSelect+take+orderBy pitfall)
        const follows: Array<UserFollowEntity> = await this.entityManager.find(UserFollowEntity,
            {
                where: {
                    follower: {
                        id: target.id,
                    },
                },
                relations: {
                    following: true,
                },
                order: {
                    createdAt: "DESC",
                },
                skip,
                take,
            })

        // map each (non-deleted) followed user to the avatar-group item shape
        return follows
            .map((follow) => follow.following)
            .filter((followed): followed is UserEntity => Boolean(followed) && !followed.isDeleted)
            .map((followed) => ({
                globalId: toGlobalId(UserEntity.name,
                    followed.id),
                username: followed.username,
                displayName: followed.displayName,
                avatar: followed.avatar,
            }))
    }
}
