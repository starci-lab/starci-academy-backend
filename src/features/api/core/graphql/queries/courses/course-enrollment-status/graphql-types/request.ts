import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
@InputType({
    description: "Course id for enrollment count and optional enrollment check.",
})
/** Request for course enrollment summary (count + optional current-user flag). */
export class CourseEnrollmentStatusRequest {
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string
}
