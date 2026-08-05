import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    AiCeilSurface,
    GraphQLTypeAiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
    GraphQLTypeAiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"

@InputType({
    description: "Set the user's AI model ceiling for a surface (or the global default).",
})
/**
 * Set the current user's AI model CEILING for one surface -- or the global
 * `default` when `surface` is omitted. A null/omitted `category` clears that
 * ceiling (uncap -> only the plan ceiling limits the climb).
 */
export class SetAiCeilRequest {
    @Field(
        () => GraphQLTypeAiCeilSurface,
        {
            nullable: true,
            description: "Surface to cap (chatbot/grading/interview); omit to set the global default.",
        },
    )
        surface?: AiCeilSurface

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            nullable: true,
            description: "Ceiling category; null/omit to clear (uncap).",
        },
    )
        category?: AiModelCategory
}
