import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeProjectPinType,
    ProjectPinType,
} from "@modules/databases"

/**
 * A single pinned project as exposed to the public profile.
 *
 * Built from a {@link UserPinnedProjectEntity} row with two resolved fields:
 * - `title` — the display title (course pins fall back to the course title when
 *   no custom title was set).
 * - `isVerified` — true only for a `course` pin whose linked enrollment has a
 *   completed task plan ("Verified by StarCi").
 */
@ObjectType({
    description: "A single project pinned to a user's public profile.",
})
export class UserPinnedProjectItemData {
    /**
     * Pin primary-key id.
     */
    @Field(
        () => ID,
        {
            description: "Pin primary-key id.",
        },
    )
        id: string

    /**
     * Pin kind discriminator (course | external).
     */
    @Field(
        () => GraphQLTypeProjectPinType,
        {
            description: "Pin kind discriminator (course | external).",
        },
    )
        type: ProjectPinType

    /**
     * Resolved display title. For course pins this is the custom title when set,
     * otherwise the course title.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Resolved display title (course title fallback for course pins).",
        },
    )
        title: string | null

    /**
     * Free-form description shown under the pin.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Free-form description shown under the pin.",
        },
    )
        description: string | null

    /**
     * Project URL.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Project URL.",
        },
    )
        url: string | null

    /**
     * Technology stack tags displayed on the pin.
     */
    @Field(
        () => [String],
        {
            nullable: true,
            description: "Technology stack tags displayed on the pin.",
        },
    )
        techStack: Array<string> | null

    /**
     * Display order within the user's pinned-projects list (ascending).
     */
    @Field(
        () => Int,
        {
            description: "Display order within the user's pinned-projects list.",
        },
    )
        orderIndex: number

    /**
     * True only for a course pin whose linked enrollment has completed its task
     * plan — drives the "Verified by StarCi" highlight.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this pin is a verified StarCi capstone.",
        },
    )
        isVerified: boolean
}
