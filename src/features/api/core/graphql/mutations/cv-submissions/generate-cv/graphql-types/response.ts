import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Identifies the CV generation run that was created + enqueued.",
})
/** The created CV generation run id (poll `cvGeneration(id)` for its status). */
export class GenerateCvData {
    @Field(
        () => ID,
        {
            description: "jobs.id — subscribe to this over the job_notifications socket for realtime progress.",
        },
    )
        jobId: string

    @Field(
        () => ID,
        {
            description: "cv_generations.id of the newly created (Pending) run.",
        },
    )
        cvGenerationId: string
}

@ObjectType({
    description: "Response wrapper for the generateCv mutation.",
})
/** GraphQL envelope with job + generation ids so the client can subscribe or poll instead of blocking on a long AI run. */
export class GenerateCvResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GenerateCvData>
{
    @Field(
        () => GenerateCvData,
        {
            nullable: true,
            description: "The created CV generation run id.",
        },
    )
        data: GenerateCvData
}
