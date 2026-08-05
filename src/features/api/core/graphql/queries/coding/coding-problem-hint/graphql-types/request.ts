import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Lookup a coding problem's approach hint by its slug.",
})
/** Request for loading one coding problem's approach hint by slug. */
export class CodingProblemHintRequest {
    /** Stable URL slug of the problem. */
    @Field(
        () => String,
        {
            description: "Stable URL slug of the problem.",
        },
    )
        slug: string
}
