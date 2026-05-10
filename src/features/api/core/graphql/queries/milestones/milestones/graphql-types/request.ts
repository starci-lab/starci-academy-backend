import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for listing all milestones in a course.",
})
export class MilestonesRequest {
    @Field(
        () => ID,
        {
            description: "Course id; all milestones in this course are returned.",
        },
    )
        courseId: string
}
