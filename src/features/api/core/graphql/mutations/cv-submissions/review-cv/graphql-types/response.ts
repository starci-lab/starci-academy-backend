import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for queuing CV review at a selected rubric level.",
})
export class ReviewCvResponse extends AbstractGraphQLResponse {
}
