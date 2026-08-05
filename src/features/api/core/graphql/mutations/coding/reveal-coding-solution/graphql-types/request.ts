import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Reveal a problem's reference solution (forfeits its points on a later solve).",
})
/** Request for revealing a coding problem's reference solution. */
export class RevealCodingSolutionRequest {
    /** Identifies which problem's reference solutions are unlocked and forfeited. */
    @Field(
        () => String,
        {
            description: "Slug of the problem whose solution is being revealed.",
        },
    )
        slug: string
}
