import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a milestone task by primary id.",
})
/** Request for the milestone task GraphQL query (by id). */
export class TaskRequest {
    @Field(
        () => ID,
        {
            description: "Milestone task id to fetch.",
        },
    )
        id: string
}
