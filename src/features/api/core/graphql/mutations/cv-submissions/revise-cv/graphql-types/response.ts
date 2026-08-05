import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Identifies the CV revision generation run that was created + enqueued.",
})
/** The created CV generation run id (poll `cvGeneration(id)` for its status). */
export class ReviseCvData {
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
            description: "cv_generations.id of the newly created (Pending) revision run.",
        },
    )
        cvGenerationId: string
}

@ObjectType({
    description: "Response wrapper for the reviseCv mutation.",
})
/** GraphQL envelope with the new revision-run ids; the source CV is ownership-checked before enqueue. */
export class ReviseCvResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReviseCvData>
{
    @Field(
        () => ReviseCvData,
        {
            nullable: true,
            description: "The created CV revision generation run id.",
        },
    )
        data: ReviseCvData
}
