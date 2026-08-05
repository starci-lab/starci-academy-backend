import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "A pinnable capstone candidate (enrollment with a project repo).",
})
/**
 * One of the current user's enrollments that has a capstone repo -- a candidate
 * for the "pin a course project" picker. Only enrollments that have submitted a
 * personal-project repo OR completed their task plan appear here.
 */
export class MyPinnableCapstoneItemData {
    /**
     * Enrollment primary-key id -- the value the pin mutation takes as
     * `enrollmentId`.
     */
    @Field(
        () => ID,
        {
            description: "Enrollment id — pass to pinCourseProject as enrollmentId.",
        },
    )
        enrollmentId: string

    /**
     * Title of the course this enrollment belongs to (the picker label).
     */
    @Field(
        () => String,
        {
            description: "Course title (the picker label).",
        },
    )
        courseTitle: string

    /**
     * User-submitted personal-project GitHub URL, null when not yet submitted.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Submitted personal-project GitHub URL (null if none).",
        },
    )
        githubUrl: string | null

    /**
     * True when the enrollment's task plan is complete -- drives the
     * "Verified by StarCi" badge in the picker.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the capstone's task plan is complete (verified).",
        },
    )
        isVerified: boolean
}
