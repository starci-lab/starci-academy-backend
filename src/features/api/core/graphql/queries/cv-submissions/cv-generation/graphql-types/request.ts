import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link CvGenerationResponse}: fetch one CV generation run by id.
 * The run must belong to the calling user.
 */
@InputType({
    description: "Fetch a single CV generation run by id.",
})
export class CvGenerationRequest {
    @Field(
        () => ID,
        {
            description: "cv_generations.id of the run to fetch.",
        },
    )
        id: string
}
