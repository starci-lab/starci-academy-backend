import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for submitting a job posting.",
})
/** Response for submitting a job posting -- returns the new posting id. */
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
