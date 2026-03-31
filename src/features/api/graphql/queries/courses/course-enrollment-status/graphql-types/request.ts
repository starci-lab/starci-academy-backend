import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
/** Request for course enrollment summary (count + optional current-user flag). */
@InputType({
    description: "Course id for enrollment count and optional enrollment check.",
})
export class CourseEnrollmentStatusRequest {
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string
}
