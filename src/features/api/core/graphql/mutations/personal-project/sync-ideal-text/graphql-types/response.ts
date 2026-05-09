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
    description: "Response for sync personal project idea text mutation.",
})
export class SyncIdealTextResponse
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
