import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for the myCourseOutline query: the course whose outline to assemble
 * for the signed-in viewer.
 */
@InputType({
    description: "Request for the myCourseOutline query.",
})
export class MyCourseOutlineRequest {
    /** Primary-key id of the enrolled course to build the outline for. */
    @Field(
        () => ID,
        {
            description: "Primary-key id of the enrolled course to build the outline for.",
        },
    )
        courseId: string
}
