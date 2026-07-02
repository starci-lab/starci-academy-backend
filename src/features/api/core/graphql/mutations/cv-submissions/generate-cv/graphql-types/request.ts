import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link GenerateCvResponse}: build a brand-new CV from the user's
 * free-text emphasis / target-role notes. The server creates a `Pending`
 * generation run and enqueues the background job (mode = Generate).
 */
@InputType({
    description: "Generate a brand-new CV from the user's free-text prompts.",
})
export class GenerateCvRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text emphasis / target-role notes for the CV.",
        },
    )
        extraPrompts?: string
}
