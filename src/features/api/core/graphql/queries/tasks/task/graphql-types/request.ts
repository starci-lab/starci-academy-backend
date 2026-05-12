import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the milestone task GraphQL query (by id). */
@InputType({
    description: "Request for fetching a milestone task by primary id.",
})
export class TaskRequest {
    @Field(
        () => ID,
        {
            description: "Milestone task id to fetch.",
        },
    )
        id: string
}
