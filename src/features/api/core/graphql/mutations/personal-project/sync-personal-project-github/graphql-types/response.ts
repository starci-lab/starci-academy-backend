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
    description: "Response for sync personal project GitHub URL mutation.",
})
export class SyncPersonalProjectGithubResponse
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
