import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a milestone by primary id.",
})
/** Request for the milestone GraphQL query (by id). */
export class MilestoneRequest {
    @Field(
        () => ID,
        {
            description: "Milestone id to fetch.",
        },
    )
        id: string
}
