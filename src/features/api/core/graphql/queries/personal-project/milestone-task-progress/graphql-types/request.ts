import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

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
    // must be a real course uuid — rejected before it reaches the TypeORM lookup
    @IsUUID()
        courseId: string
}
