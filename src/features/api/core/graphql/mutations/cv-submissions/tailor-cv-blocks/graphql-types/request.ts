import {
    Field,
    InputType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

@InputType({
    description: "Tailor the whole CV blocks array toward a job description (no persistence).",
})
/**
 * Tailor the ENTIRE CV blocks array toward a specific job description. The AI
 * rewrites / emphasizes / reorders the item wording of every block to better
 * match the JD WITHOUT inventing false facts, preserving the SAME structure
 * (same block `id`/`type`, same item `id`). Nothing is persisted -- the FE swaps
 * the returned blocks into the editor.
 */
export class TailorCvBlocksRequest {
    @Field(
        () => GraphQLJSON,
        {
            description: "The current CV blocks array (FE-owned JSON: [{ id, type, title, order, items }]).",
        },
    )
        blocks: Array<Record<string, unknown>>

    @Field(
        () => String,
        {
            description: "The target job description to tailor the CV toward.",
        },
    )
        jobDescription: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for the tailoring; null = balancer default (Auto).",
        },
    )
        selectedModel?: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider
}
