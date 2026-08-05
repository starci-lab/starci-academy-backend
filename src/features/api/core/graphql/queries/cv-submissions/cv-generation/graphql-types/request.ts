import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Fetch a single CV generation run by id.",
})
/**
 * Request for {@link CvGenerationResponse}: fetch one CV generation run by id.
 * The run must belong to the calling user.
 */
export class CvGenerationRequest {
    @Field(
        () => ID,
        {
            description: "cv_generations.id of the run to fetch.",
        },
    )
        id: string
}
