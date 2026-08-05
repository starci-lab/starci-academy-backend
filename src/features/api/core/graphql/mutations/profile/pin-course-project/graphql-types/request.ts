import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from "class-validator"

/** Upper bound on description length, mirroring the entity column. */
const MAX_DESCRIPTION_LENGTH = 1024
/** Upper bound on the number of tech-stack tags accepted. */
const MAX_TECH_STACK_TAGS = 20
/** Upper bound on a single tech-stack tag length. */
const MAX_TECH_STACK_TAG_LENGTH = 64

@InputType({
    description: "Request to pin one of the user's enrollment capstones.",
})
/**
 * Request to pin one of the current user's enrollment capstones to their
 * profile. Title and URL are derived server-side (course title / enrollment
 * GitHub URL); only an optional override description and tech stack are accepted.
 */
export class PinCourseProjectRequest {
    @Field(
        () => ID,
        {
            description: "Id of the enrollment whose capstone to pin (must belong to the user).",
        },
    )
    // must be a valid enrollment uuid; ownership is verified in the resolver
    @IsUUID()
        enrollmentId: string

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
