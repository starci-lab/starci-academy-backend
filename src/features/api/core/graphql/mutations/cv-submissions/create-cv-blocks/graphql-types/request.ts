import {
    Field,
    InputType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"

/**
 * Create a new (empty or pre-filled) CV document for the signed-in user. All
 * fields optional: an empty create yields a blank CV the user then fills in the
 * block editor. `blocks` / `style` are opaque FE-owned JSON.
 */
@InputType({
    description: "Create a new CV document (block editor).",
})
export class CreateCvBlocksRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-facing CV name.",
        },
    )
        label?: string

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Optional initial blocks (FE-owned JSON array); defaults to empty.",
        },
    )
        blocks?: Array<Record<string, unknown>>

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Optional initial style params (FE-owned JSON); defaults to empty.",
        },
    )
        style?: Record<string, unknown>
}
