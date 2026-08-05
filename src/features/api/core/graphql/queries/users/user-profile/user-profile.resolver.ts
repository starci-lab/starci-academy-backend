import {
    Args,
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

@Resolver()
/**
 * Public profile of any user by username (avatar, name, bio, follow counts).
 * Username-addressable so the URL reads like GitHub (`/profile/<username>`); the
 * returned entity still carries the `id` that the follow mutation + the profile
 * tabs key off.
 *
 * Optional auth: a Bearer token, when present, populates `req.user` so the
 * `isFollowedByMe` resolved field reflects the viewer's follow state. Anonymous
 * viewers still get the public fields, just with `isFollowedByMe = false`.
 * Soft-deleted users resolve to `null`.
 */
export class UserProfileResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "User profile fetched successfully",
        [Locale.Vi]: "Lấy hồ sơ người dùng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserProfileResponse,
        {
            name: "userProfile",
            description: "Returns a user's public profile by username (null when not found).",
        },
    )
    async execute(
        @Args(
            "username",
            {
                type: () => String,
                description: "Username (or email) of the user whose public profile to fetch.",
            },
        )
            username: string,
    ): Promise<UserEntity | null> {
        // public read: look up by the URL-facing username; only non-deleted users
        // are visible (the returned entity still carries `id` for follow + tabs).
        // Also accept the value as an email so a legacy `/profile/<email>` link
        // still resolves — the FE then canonicalizes the URL to `<username>`.
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: [
                    {
                        username, isDeleted: false 
                    },
                    {
                        email: username, isDeleted: false 
                    },
                ],
            },
        )
        // not found / soft-deleted → null (FE renders a "not found" state)
        return user ?? null
    }
}
