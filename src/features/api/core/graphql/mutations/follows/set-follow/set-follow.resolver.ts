import {
    Args,
    Mutation,
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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    ActivityType,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    NotificationType,
    UserEntity,
    UserFollowEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    NotificationService,
    UserStatsProjectionService,
    writeActivity,
} from "@modules/bussiness"
import {
    SetFollowRequest,
    SetFollowResponse,
} from "./graphql-types"

@Resolver()
/**
 * Follow / unfollow another user (idempotent toggle).
 *
 * On a new follow it also appends a `userFollowed` activity so the action shows
 * up in feeds. Self-follow is a no-op. Logic runs in one transaction so the edge
 * + its activity row commit together.
 */
export class SetFollowResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Follow state updated successfully",
        [Locale.Vi]: "Cập nhật theo dõi thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetFollowResponse,
        {
            name: "setFollow",
            description: "Follow or unfollow another user (idempotent toggle).",
        },
    )
    async execute(
        @Args("request")
            request: SetFollowRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetFollowResponse> {
        const followerId = user.id
        const followingId = request.userId

        // can't follow yourself -- silently no-op so the client needn't special-case it
        if (followerId === followingId) {
            return {
            } as SetFollowResponse
        }

        let followed = false

        await this.entityManager.transaction(
            async (entityManager) => {
                // look up the existing edge via the relations (id columns are virtual)
                const existing = await entityManager.findOne(
                    UserFollowEntity,
                    {
                        where: {
                            follower: {
                                id: followerId,
                            },
                            following: {
                                id: followingId,
                            },
                        },
                    },
                )

                if (request.follow) {
                    // already following -> nothing to do (keeps the toggle idempotent)
                    if (existing) {
                        return
                    }
                    // create the follow edge
                    await entityManager.save(
                        entityManager.create(
                            UserFollowEntity,
                            {
                                follower: {
                                    id: followerId,
                                },
                                following: {
                                    id: followingId,
                                },
                            },
                        ),
                    )
                    followed = true
                    // snapshot the followed user's name for the feed text
                    const target = await entityManager.findOne(
                        UserEntity,
                        {
                            where: {
                                id: followingId,
                            },
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    )
                    // record the follow as a feed activity (idempotent on type+refId)
                    await writeActivity({
                        entityManager,
                        userId: followerId,
                        type: ActivityType.UserFollowed,
                        idempotencyKey: `${followerId}:${followingId}`,
                        metadata: {
                            target: {
                                entityName: UserEntity.name,
                                id: followingId,
                                label: target?.username ?? "",
                            },
                        },
                    })
                    return
                }

                // unfollow -> drop the edge when present (the activity row stays, append-only)
                if (existing) {
                    await entityManager.remove(existing)
                }
            },
        )

        // refresh both endpoints' stats projections (follower's following_count +
        // followed's follower_count); idempotent, CDC also covers it asynchronously
        await this.userStatsProjectionService.recompute({
            userId: followerId,
        })
        await this.userStatsProjectionService.recompute({
            userId: followingId,
        })

        if (followed) {
            await this.notificationService.createNotification({
                userId: followingId,
                type: NotificationType.NewFollower,
                title: {
                    key: "notification.newFollower.title",
                    params: {
                        actor: user.username,
                    },
                },
                target: {
                    entityName: UserEntity.name,
                    id: followerId,
                    label: user.username,
                },
            })
        }

        return {
        } as SetFollowResponse
    }
}
