import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Check if an email exists using a bloom filter (may contain false positives).",
})
/** Request for checking whether an email exists (bloom-filter based). */
export class CheckEmailExistsRequest {
    @Field(
        () => String,
        {
            description: "Email address to check.",
        },
    )
        email: string
}

