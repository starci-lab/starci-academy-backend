import {
    Args,
    ID,
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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UserProfileResponse,
} from "./graphql-types"

/**
 * Public profile of any user by id (avatar, name, bio, follow counts).
 *
 * Optional auth: a Bearer token, when present, populates `req.user` so the
 * `isFollowedByMe` resolved field reflects the viewer's follow state. Anonymous
 * viewers still get the public fields, just with `isFollowedByMe = false`.
 * Soft-deleted users resolve to `null`.
 */
@Resolver()
export class UserProfileResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "User profile fetched successfully",
        [Locale.Vi]: "Lấy hồ sơ người dùng thành công",
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserProfileResponse,
        {
            name: "userProfile",
            description: "Returns a user's public profile by id (null when not found).",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose public profile to fetch.",
            },
        )
            userId: string,
    ): Promise<UserEntity | null> {
        // public read: only non-deleted users are visible
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: userId,
                    isDeleted: false,
                },
            },
        )
        // not found / soft-deleted → null (FE renders a "not found" state)
        return user ?? null
    }
}
