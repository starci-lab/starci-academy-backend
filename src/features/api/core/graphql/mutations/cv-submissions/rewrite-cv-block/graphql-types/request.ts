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
    description: "Rewrite / improve a single CV block (optionally grounded in a real capstone).",
})
/**
 * Rewrite / improve a single CV block's item text. Optionally grounds the
 * rewrite in a real StarCi capstone (`capstoneAttemptId`) so the AI describes
 * the actual project accurately; otherwise it rewrites from the block's own
 * content plus an optional freeform `instruction`. Nothing is persisted -- the
 * FE swaps the returned block into the editor.
 */
export class RewriteCvBlockRequest {
    @Field(
        () => GraphQLJSON,
        {
            description: "The CV block to rewrite (FE-owned JSON: { id, type, title, order, items }).",
        },
    )
        block: Record<string, unknown>

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional passed-capstone attempt id to RAG-ground an accurate project description.",
        },
    )
        capstoneAttemptId?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional freeform instruction steering the rewrite (e.g. 'make it more quantified').",
        },
    )
        instruction?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for the rewrite; null = balancer default (Auto).",
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
