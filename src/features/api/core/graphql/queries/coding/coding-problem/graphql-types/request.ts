import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Lookup a coding problem by its slug.",
})
/** Request for loading one coding problem by slug. */
export class CodingProblemRequest {
    /** Stable URL slug of the problem. */
    @Field(
        () => String,
        {
            description: "Stable URL slug of the problem.",
        },
    )
        slug: string
}
