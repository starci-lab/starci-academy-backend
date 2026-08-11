import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"

@ObjectType()
/** GraphQL response for an internal job application. */
export class ApplyToJobResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<JobApplicationEntity> {
    @Field(() => JobApplicationEntity,
        {
            nullable: true,
        })
        data: JobApplicationEntity
}
