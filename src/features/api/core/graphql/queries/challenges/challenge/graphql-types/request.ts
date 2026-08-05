import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a challenge by primary id.",
})
/**
 * Fetches one challenge by primary id. The handler reads the locale JSON from
 * S3 and then checks the owning content's premium flag in Postgres.
 */
export class ChallengeRequest {
    @Field(
        () => ID,
        {
            description: "Challenge id to fetch.",
        },
    )
        id: string
}
