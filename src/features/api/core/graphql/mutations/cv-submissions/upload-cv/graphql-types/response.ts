import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The created uploaded-CV row id + the scoring job id (poll / subscribe on these). */
@ObjectType({
    description: "Identifies the uploaded cv_generations row that was created + the scoring job.",
})
export class UploadCvData {
    @Field(
        () => ID,
        {
            description: "jobs.id — subscribe to this over the job_notifications socket for realtime scoring progress.",
        },
    )
        jobId: string

    @Field(
        () => ID,
        {
            description: "cv_generations.id of the newly created (Pending, source=uploaded) row.",
        },
    )
        cvGenerationId: string
}

@ObjectType({
    description: "Response wrapper for the uploadCv mutation.",
})
export class UploadCvResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UploadCvData>
{
    @Field(
        () => UploadCvData,
        {
            nullable: true,
            description: "The created uploaded-CV row id + its scoring job id.",
        },
    )
        data: UploadCvData
}
