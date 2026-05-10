import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the milestone GraphQL query (by id). */
@InputType({
    description: "Request for fetching a milestone by primary id.",
})
export class MilestoneRequest {
    @Field(
        () => ID,
        {
            description: "Milestone id to fetch.",
        },
    )
        id: string
}
