import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response for submitting a job posting — returns the new posting's routing
 * `displayId` (the slug the detail page resolves `/jobs/<displayId>` by), not
 * its UUID primary key, so the client's post-submit "View posting" CTA links
 * to a page that resolves.
 */
@ObjectType({
    description: "Response for submitting a job posting.",
})
export class SubmitJobPostingResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Routing displayId (slug) of the newly created job posting (null on error).",
        },
    )
        data: string | null
}
