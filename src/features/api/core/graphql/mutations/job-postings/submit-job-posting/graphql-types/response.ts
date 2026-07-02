import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

/** Response for submitting a job posting — returns the new posting id. */
@ObjectType({
    description: "Response for submitting a job posting.",
})
export class SubmitJobPostingResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the newly created job posting (null on error).",
        },
    )
        data: string | null
}
