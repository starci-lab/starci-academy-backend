import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The created CV generation run id (poll `cvGeneration(id)` for its status). */
@ObjectType({
    description: "Identifies the CV revision generation run that was created + enqueued.",
})
export class ReviseCvData {
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
