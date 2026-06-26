import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the start-trial mutation. */
@InputType({
    description: "Course id to start a trial (preview) enrollment for.",
})
export class StartTrialRequest {
    @Field(
        () => ID,
        {
            description: "Course id to start a trial for.",
        },
    )
        courseId: string
}
