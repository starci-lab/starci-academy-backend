import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching milestone task progress.",
})
export class MilestoneTaskProgressRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
        courseId: string
}
