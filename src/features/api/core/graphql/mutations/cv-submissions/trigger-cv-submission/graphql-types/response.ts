import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for manually triggering CV submission processing.",
})
export class TriggerCvSubmissionResponse extends AbstractGraphQLResponse {
}