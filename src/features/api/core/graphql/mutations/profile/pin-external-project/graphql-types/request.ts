import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
} from "class-validator"

/** Upper bound on title length, mirroring the entity column. */
const MAX_TITLE_LENGTH = 255
/** Upper bound on description length, mirroring the entity column. */
const MAX_DESCRIPTION_LENGTH = 1024
/** Upper bound on URL length, mirroring the entity column. */
const MAX_URL_LENGTH = 2048
/** Upper bound on the number of tech-stack tags accepted. */
const MAX_TECH_STACK_TAGS = 20
/** Upper bound on a single tech-stack tag length. */
const MAX_TECH_STACK_TAG_LENGTH = 64

@InputType({
    description: "Request to pin a free-form external project.",
})
/**
 * Request to pin a free-form external project to the current user's profile.
 * Unlike a course pin, every field is user-authored; an external pin is never
 * verified.
 */
export class PinExternalProjectRequest {
    @Field(
        () => String,
        {
            description: "Project title.",
        },
    )
    // title is required for external pins and capped to the column length
    @IsString()
    @MaxLength(MAX_TITLE_LENGTH)
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional description shown under the pin.",
        },
    )
    // optional free-form blurb, capped to the column length
    @IsOptional()
    @IsString()
    @MaxLength(MAX_DESCRIPTION_LENGTH)
        description?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional project URL.",
        },
    )
    // optional link; validated as a URL and capped to the column length
    @IsOptional()
    @IsUrl()
    @MaxLength(MAX_URL_LENGTH)
        url?: string

    @Field(
        () => [String],
        {
            nullable: true,
            description: "Optional technology stack tags.",
        },
    )
    // optional list of short tags; bounded count + length to keep the row small
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(MAX_TECH_STACK_TAGS)
    @IsString({
        each: true,
    })
    @MaxLength(MAX_TECH_STACK_TAG_LENGTH,
        {
            each: true,
        })
        techStack?: Array<string>
}
