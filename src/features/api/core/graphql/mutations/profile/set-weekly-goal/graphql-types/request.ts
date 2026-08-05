import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
} from "class-validator"

@InputType({
    description: "Request to set the current user's weekly learning goal (in lessons).",
})
/**
 * Request to set the authenticated user's weekly learning goal.
 *
 * The value is the number of lessons the user wants to read per week. It is
 * clamped into [0, 100] server-side before it is persisted, so an out-of-range
 * client value is normalized rather than rejected.
 */
export class SetWeeklyGoalRequest {
    @Field(
        () => Int,
        {
            description: "Target lessons per week; clamped into [0, 100] on save.",
        },
    )
    // must be an integer count of lessons; the resolver clamps the range
    @IsInt()
        lessons: number
}
