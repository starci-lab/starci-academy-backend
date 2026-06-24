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
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UserService,
} from "@modules/bussiness"
import {
    UpdateProfileRequest,
    UpdateProfileResponse,
} from "./graphql-types"

/**
 * Update the authenticated user's editable profile fields (display name, bio,
 * avatar URL).
 *
 * Partial update: only the keys present in the request are written. An explicit
 * `null` clears the column; an omitted key leaves it untouched. The avatar value
 * is the public URL produced by the avatar-upload REST endpoint — the binary is
 * handled there, not here. Returns the refreshed user so the client can update
 * its cache without a follow-up `me` round-trip.
 */
@Resolver()
export class UpdateProfileResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Profile updated successfully",
        [Locale.Vi]: "Cập nhật hồ sơ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateProfileResponse,
        {
            name: "updateProfile",
            description: "Update the current user's display name, bio and avatar.",
        },
    )
    async execute(
        @Args("request")
            request: UpdateProfileRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UserEntity> {
        // collect only the columns the client actually sent — `undefined` means
        // "leave as-is", so we must not include those keys in the update payload
        const patch: Partial<Pick<UserEntity, "displayName" | "bio" | "avatar" | "profileLocked" | "openToWork" | "emailDigestEnabled" | "featuredAchievementSlug" | "roleTitle" | "location" | "workMode" | "linkedinUrl" | "websiteUrl">> = {
        }

        // display name: trim whitespace; an explicit null clears it
        if (request.displayName !== undefined) {
            patch.displayName = request.displayName === null
                ? null
                : request.displayName.trim()
        }

        // bio: same partial-update + trim semantics as display name
        if (request.bio !== undefined) {
            patch.bio = request.bio === null
                ? null
                : request.bio.trim()
        }

        // avatar: already a validated URL (or null to clear); store verbatim
        if (request.avatar !== undefined) {
            patch.avatar = request.avatar
        }

        // profile lock toggle: write only when the client sent it
        if (request.profileLocked !== undefined) {
            patch.profileLocked = request.profileLocked
        }

        // open-to-work toggle: write only when the client sent it
        if (request.openToWork !== undefined) {
            patch.openToWork = request.openToWork
        }

        // daily-digest email opt-in/out: write only when the client sent it
        if (request.emailDigestEnabled !== undefined) {
            patch.emailDigestEnabled = request.emailDigestEnabled
        }

        // featured mascot: an explicit null clears the pin
        if (request.featuredAchievementSlug !== undefined) {
            patch.featuredAchievementSlug = request.featuredAchievementSlug
        }

        // role title: trim; an explicit null clears it
        if (request.roleTitle !== undefined) {
            patch.roleTitle = request.roleTitle === null
                ? null
                : request.roleTitle.trim()
        }

        // location: trim; an explicit null clears it
        if (request.location !== undefined) {
            patch.location = request.location === null
                ? null
                : request.location.trim()
        }

        // preferred work mode: write only when the client sent it (null clears)
        if (request.workMode !== undefined) {
            patch.workMode = request.workMode
        }

        // linkedin URL: already validated (or null to clear); store verbatim
        if (request.linkedinUrl !== undefined) {
            patch.linkedinUrl = request.linkedinUrl
        }

        // website URL: already validated (or null to clear); store verbatim
        if (request.websiteUrl !== undefined) {
            patch.websiteUrl = request.websiteUrl
        }

        // persist only when there is at least one field to change, otherwise skip
        // the write and just echo the current row back
        if (Object.keys(patch).length > 0) {
            await this.entityManager.update(
                UserEntity,
                {
                    id: user.id,
                },
                patch,
            )
        }

        // the lock flag is Redis-cached for the visibility guard → drop it on any
        // change so a freshly toggled lock takes effect immediately (del-on-write)
        if (request.profileLocked !== undefined) {
            await this.userService.invalidateProfileLocked(user.id)
        }

        // re-read so the response reflects the committed state (not the stale
        // guard-attached user snapshot)
        const updated = await this.entityManager.findOneByOrFail(
            UserEntity,
            {
                id: user.id,
            },
        )

        return updated
    }
}
