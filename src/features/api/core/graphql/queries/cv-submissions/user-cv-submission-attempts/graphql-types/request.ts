import {
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching CV review history of current user.",
})
export class CvReviewHistoryRequest {
}
