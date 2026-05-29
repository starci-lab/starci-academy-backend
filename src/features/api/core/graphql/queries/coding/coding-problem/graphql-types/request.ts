import {
    Field,
    InputType,
} from "@nestjs/graphql"

/** Request for loading one coding problem by slug. */
@InputType({
    description: "Lookup a coding problem by its slug.",
})
export class CodingProblemRequest {
    @Field(
        () => String,
        {
            description: "Stable URL slug of the problem.",
        },
    )
        slug: string
}
