import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a challenge by primary id.",
})
export class ChallengeRequest {
    @Field(
        () => ID,
        {
            description: "Challenge id to fetch.",
        },
    )
        id: string
}
