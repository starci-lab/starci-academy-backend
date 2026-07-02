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
    description: "Identifies the CV generation run that was created + enqueued.",
})
export class GenerateCvData {
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
