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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    UpdateProfileRequest,
} from "./graphql-types/request"
import {
    UpdateProfileResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Update the authenticated user's editable profile fields (display name, bio,
 * avatar URL).
 *
 * Partial update: only the keys present in the request are written. An explicit
 * `null` clears the column; an omitted key leaves it untouched. The avatar value
 * is the public URL produced by the avatar-upload REST endpoint -- the binary is
 * handled there, not here. Returns the refreshed user so the client can update
 * its cache without a follow-up `me` round-trip.
 */
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
        [Locale.Vi]: "Cập nhật hồ sơ thành công", // vn-ok: vi-locale string emitted to clients
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
        // collect only the columns the client actually sent -- `undefined` means
        // "leave as-is", so we must not include those keys in the update payload.
        // Split by domain so each group stays a small, independently-readable patch.
        const patch: Partial<Pick<UserEntity, "displayName" | "bio" | "avatar" | "profileLocked" | "openToWork" | "emailDigestEnabled" | "featuredAchievementSlug" | "roleTitle" | "location" | "workMode" | "linkedinUrl" | "websiteUrl" | "accentColor" | "backgroundEffect">> = {
            ...this.buildIdentityPatch(request),
            ...this.buildPreferencePatch(request),
            ...this.buildBrandingPatch(request),
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

        // the lock flag is Redis-cached for the visibility guard -> drop it on any
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

    /** Identity/bio fields: display name, bio, avatar, role title, location. */
    private buildIdentityPatch(
        request: UpdateProfileRequest,
    ): Partial<Pick<UserEntity, "displayName" | "bio" | "avatar" | "roleTitle" | "location">> {
        const patch: Partial<Pick<UserEntity, "displayName" | "bio" | "avatar" | "roleTitle" | "location">> = {
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
        return patch
    }

    /** Preference/visibility toggle fields: lock, open-to-work, digest, mascot, work mode. */
    private buildPreferencePatch(
        request: UpdateProfileRequest,
    ): Partial<Pick<UserEntity, "profileLocked" | "openToWork" | "emailDigestEnabled" | "featuredAchievementSlug" | "workMode">> {
        const patch: Partial<Pick<UserEntity, "profileLocked" | "openToWork" | "emailDigestEnabled" | "featuredAchievementSlug" | "workMode">> = {
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
        // preferred work mode: write only when the client sent it (null clears)
        if (request.workMode !== undefined) {
            patch.workMode = request.workMode
        }
        return patch
    }

    /** Contact/branding fields: LinkedIn, website, accent color, background effect. */
    private buildBrandingPatch(
        request: UpdateProfileRequest,
    ): Partial<Pick<UserEntity, "linkedinUrl" | "websiteUrl" | "accentColor" | "backgroundEffect">> {
        const patch: Partial<Pick<UserEntity, "linkedinUrl" | "websiteUrl" | "accentColor" | "backgroundEffect">> = {
        }
        // linkedin URL: already validated (or null to clear); store verbatim
        if (request.linkedinUrl !== undefined) {
            patch.linkedinUrl = request.linkedinUrl
        }
        // website URL: already validated (or null to clear); store verbatim
        if (request.websiteUrl !== undefined) {
            patch.websiteUrl = request.websiteUrl
        }
        // accent color: already hex-validated (or null to reset to the default brand accent)
        if (request.accentColor !== undefined) {
            patch.accentColor = request.accentColor
        }
        // ambient background effect: write only when the client sent it
        if (request.backgroundEffect !== undefined) {
            patch.backgroundEffect = request.backgroundEffect
        }
        return patch
    }
}
