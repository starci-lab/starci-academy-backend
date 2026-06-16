import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsBoolean,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
} from "class-validator"

/**
 * Request to update the authenticated user's editable profile fields.
 *
 * Every field is optional and follows partial-update semantics: a field left
 * out (`undefined`) is untouched, while an explicit `null` clears the stored
 * value. Avatar is the public URL returned by the avatar-upload REST endpoint —
 * this mutation only persists the chosen URL, it does not handle the binary.
 */
@InputType({
    description: "Request to update the current user's editable profile fields.",
})
export class UpdateProfileRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "New display name; null clears it (UI falls back to username).",
        },
    )
    // optional → skip validation when omitted or explicitly null
    @IsOptional()
    @IsString()
    // cap matches the `display_name` varchar(100) column so we reject before the DB does
    @MaxLength(100)
        displayName?: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "New short bio / tagline; null clears it.",
        },
    )
    @IsOptional()
    @IsString()
    // cap matches the `bio` varchar(280) column
    @MaxLength(280)
        bio?: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "New avatar public URL (from the avatar-upload endpoint); null clears it.",
        },
    )
    @IsOptional()
    // must be a real URL so a malformed value never reaches the avatar column
    @IsUrl()
    // cap matches the `avatar` varchar(255) column
    @MaxLength(255)
        avatar?: string | null

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "Lock the profile (true = only the owner sees full content); omit to leave unchanged.",
        },
    )
    @IsOptional()
    @IsBoolean()
        profileLocked?: boolean

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "Mark the user as open to work (shows a hiring badge); omit to leave unchanged.",
        },
    )
    @IsOptional()
    @IsBoolean()
        openToWork?: boolean

    @Field(
        () => String,
        {
            nullable: true,
            description: "Slug of the achievement to pin as the profile mascot; null clears it.",
        },
    )
    @IsOptional()
    @IsString()
    // cap matches the `featured_achievement_slug` varchar(128) column
    @MaxLength(128)
        featuredAchievementSlug?: string | null
}
