import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for submit challenge submissions mutation.",
})
export class SubmitChallengeSubmissionsResponse extends AbstractGraphQLResponse {
}
