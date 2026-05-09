import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    PersonalProjectAttemptEntity,
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
    implements IAbstractGraphQLResponse<Array<PersonalProjectAttemptEntity>>
{
    @Field(() => [PersonalProjectAttemptEntity],
        {
            nullable: true,
            description: "Review attempts with feedback history.",
        })
        data: Array<PersonalProjectAttemptEntity>
}
