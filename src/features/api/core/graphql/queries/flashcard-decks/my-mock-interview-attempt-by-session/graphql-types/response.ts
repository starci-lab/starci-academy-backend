import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MockInterviewAttemptItem,
} from "../../my-mock-interview-attempts/graphql-types"

/**
 * Response wrapper for the myMockInterviewAttemptBySessionId query — `data` is
 * `null` when no GRADED attempt exists yet for that session (still in
 * progress, or the session id doesn't belong to the viewer/course at all).
 */
@ObjectType({
    description: "Response wrapper for the myMockInterviewAttemptBySessionId query.",
})
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
