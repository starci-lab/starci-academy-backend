import {
    Args,
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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
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
    SuggestedUserData,
    SuggestedUsersResponse,
} from "./graphql-types"

/** Default + hard-cap on how many "who to follow" suggestions to surface. */
const DEFAULT_LIMIT = 20
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 20

@Resolver()
/**
 * Dashboard "who to follow" rail: users the viewer does not already follow,
 * ranked by how many followers they have (most-followed first) so the most
 * notable accounts surface. Excludes the viewer themselves and everyone they
 * already follow. Auth-only — the suggestion set is viewer-specific.
 */
export class SuggestedUsersResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Suggested users fetched successfully",
        [Locale.Vi]: "Lấy gợi ý theo dõi thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SuggestedUsersResponse,
        {
            name: "suggestedUsers",
            description: "Users to follow the viewer does not already follow, most-followed first.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max suggestions to return.",
            },
        )
            limit: number,
    ): Promise<Array<SuggestedUserData>> {
        // clamp the page size into [1, MAX_LIMIT]
        const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)

        // subquery of the ids the viewer already follows — these are excluded from
        // the suggestion set so we never suggest someone they already follow
        const followedSubQuery = this.entityManager
            .createQueryBuilder()
            .subQuery()
            .select("follow.following_id")
            .from(UserFollowEntity,
                "follow")
            .where("follow.follower_id = :viewerId")
            .getQuery()

        // candidate users (non-deleted, not the viewer, not already followed), left
        // joined to their follower edges so we can rank by follower count DESC
        const candidates: Array<UserEntity> = await this.entityManager
            .createQueryBuilder(UserEntity,
                "user")
            // count followers via the directed edge (following_id = candidate id)
            .leftJoin(UserFollowEntity,
                "follower",
                "follower.following_id = user.id")
            // exclude soft-deleted users
            .where("user.is_deleted = false")
            // never suggest the viewer themselves
            .andWhere("user.id != :viewerId")
            // exclude everyone the viewer already follows
            .andWhere(`user.id NOT IN ${followedSubQuery}`)
            .setParameter("viewerId",
                user.id)
            .groupBy("user.id")
            // most-followed first; tie-break on newest so the order is deterministic
            .orderBy("COUNT(follower.id)",
                "DESC")
            .addOrderBy("user.created_at",
                "DESC")
            .take(take)
            .getMany()

        // map each candidate to the who-to-follow card shape (opaque id + header)
        return candidates.map((candidate) => ({
            globalId: toGlobalId(UserEntity.name,
                candidate.id),
            username: candidate.username,
            displayName: candidate.displayName,
            avatar: candidate.avatar,
            openToWork: candidate.openToWork,
        }))
    }
}
