import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    MockInterviewAttemptItem,
} from "../../my-mock-interview-attempts/graphql-types/response"

@ObjectType({
    description: "Response wrapper for the myMockInterviewAttemptBySessionId query.",
})
/**
 * Response wrapper for the myMockInterviewAttemptBySessionId query -- `data` is
 * `null` when no GRADED attempt exists yet for that session (still in
 * progress, or the session id doesn't belong to the viewer/course at all).
 */
export class MyMockInterviewAttemptBySessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MockInterviewAttemptItem>
{
    @Field(
        () => MockInterviewAttemptItem,
        {
            nullable: true,
            description: "The graded attempt for this session, or null when none exists.",
        },
    )
        data: MockInterviewAttemptItem
}
