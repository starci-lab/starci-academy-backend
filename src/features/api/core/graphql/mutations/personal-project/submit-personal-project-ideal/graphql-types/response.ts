import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for submit personal project idea mutation.",
})
export class SubmitPersonalProjectIdealResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<EnrollmentEntity>
{
    @Field(() => EnrollmentEntity,
        {
            nullable: true,
            description: "The updated enrollment.",
        })
        data: EnrollmentEntity
}
