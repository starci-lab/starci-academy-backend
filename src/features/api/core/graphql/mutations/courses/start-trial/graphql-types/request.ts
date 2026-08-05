import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Course id to start a trial (preview) enrollment for.",
})
/** Request for the start-trial mutation. */
export class StartTrialRequest {
    @Field(
        () => ID,
        {
            description: "Course id to start a trial for.",
        },
    )
        courseId: string
}
