import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AiLabRunParams,
} from "../types"

/**
 * GraphQL object type mirroring the {@link AiLabRunParams} jsonb shape stored on
 * AI Lab playground defaults and individual runs. It is a plain object type (not
 * a TypeORM entity) used as the `@Field` type for those jsonb columns so the
 * shape is introspectable; the matching `@InputType` lives in the GraphQL layer.
 */
@ObjectType({
    description: "Sampling / generation parameters for an AI Lab run.",
})
export class AiLabRunParamsObject implements AiLabRunParams {
    /**
     * Sampling temperature (0 = deterministic). Omitted to use the model default.
     */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Sampling temperature (0 = deterministic).",
        },
    )
        temperature?: number

    /**
     * Nucleus sampling probability mass. Omitted to use the model default.
     */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Nucleus sampling probability mass.",
        },
    )
        topP?: number

    /**
     * Hard cap on completion tokens. Omitted to use the model default.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Hard cap on completion tokens.",
        },
    )
        maxTokens?: number
}
