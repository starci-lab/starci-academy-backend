import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"

@InputType({
    description: "Update a CV document (block editor autosave).",
})
/**
 * Update one of the signed-in user's CV documents (autosave from the block
 * editor). `id` targets the document; the other fields are partial -- only the
 * provided ones are written. `blocks` / `style` are opaque FE-owned JSON.
 */
export class UpdateCvBlocksRequest {
    @Field(
        () => ID,
        {
            description: "cv_blocks.id of the document to update (must belong to the caller).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "New user-facing CV name.",
        },
    )
        label?: string

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "New ordered blocks (FE-owned JSON array).",
        },
    )
        blocks?: Array<Record<string, unknown>>

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "New style params (FE-owned JSON).",
        },
    )
        style?: Record<string, unknown>
}
