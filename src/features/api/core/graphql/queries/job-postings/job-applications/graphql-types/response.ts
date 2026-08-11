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
/** Employer-facing response containing applicants for one owned posting. */
export class JobApplicationsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<JobApplicationEntity>> {
    @Field(() => [JobApplicationEntity],
        {
            nullable: true,
        })
        data: Array<JobApplicationEntity>
}
