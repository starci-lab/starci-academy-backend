import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for personal feedbacks query.",
})
export class PersonalFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserMilestoneTaskAttemptEntity>>
{
    @Field(() => [UserMilestoneTaskAttemptEntity],
        {
            nullable: true,
            description: "Review attempts with feedback history.",
        })
        data: Array<UserMilestoneTaskAttemptEntity>
}
