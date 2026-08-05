import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiModelCategory,
    AiModelTask,
    GraphQLTypeAiModelCategory,
    GraphQLTypeAiModelTask,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

@ObjectType({
    description: "A single model choice (model name + provider).",
})
/** One concrete model + provider pair used in an active or fallback slot. */
export class AiModelChoiceData {
    @Field(
        () => String,
        {
            description: "Model name (e.g. gpt-4o-mini, gemini-2.0-flash).",
        },
    )
        model: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider serving this model.",
        },
    )
        provider: ModelProvider
}

@ObjectType({
    description: "Active model for a specific AI task.",
})
/**
 * One AI task router as shown in the admin panel -- human label, the model the
 * balancer will try first, and the ordered fallback chain behind it.
 */
export class AiActiveModelData {
    @Field(
        () => String,
        {
            description: "Task kind identifier.",
        },
    )
        taskKind: string

    @Field(
        () => String,
        {
            description: "Human-readable label for this task.",
        },
    )
        label: string

    @Field(
        () => String,
        {
            description: "Description of what this AI task does.",
        },
    )
        description: string

    @Field(
        () => AiModelChoiceData,
        {
            description: "Currently active model choice.",
        },
    )
        activeModel: AiModelChoiceData

    @Field(
        () => [AiModelChoiceData],
        {
            description: "Fallback chain for this task at the current tier.",
        },
    )
        fallbackChain: Array<AiModelChoiceData>
}

@ObjectType({
    description: "A selectable model for the grading picker (name + provider + cost category).",
})
/**
 * One row in the grading model picker -- cost category, free-lane flag, live
 * key availability (locked when the provider pool is empty), and which tasks
 * the FE should offer it for.
 */
export class AiGradableModelData {
    @Field(
        () => String,
        {
            description: "Concrete model name (e.g. gpt-4o, gemini-2.0-flash).",
        },
    )
        model: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider serving this model.",
        },
    )
        provider: ModelProvider

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            description: "Cost/quality category — economy / balanced / premium.",
        },
    )
        category: AiModelCategory

    @Field(
        () => Boolean,
        {
            description: "Whether the model is usable on the free Auto lane.",
        },
    )
        complimentary: boolean

    @Field(
        () => Boolean,
        {
            description: "Whether the model's provider pool has a working key right now; false → render locked (not selectable).",
        },
    )
        available: boolean

    @Field(
        () => [GraphQLTypeAiModelTask],
        {
            description: "Tasks this model is suited for (chatting / grading) — FE filters pickers by this.",
        },
    )
        supportedTasks: Array<AiModelTask>
}

@ObjectType({
    description: "AI models configuration data.",
})
/**
 * Full `aiModels` payload: recommendation tier, per-task routers, and the
 * selectable grading catalog.
 */
export class AiModelsResponseData {
    @Field(
        () => String,
        {
            description: "Current model recommendation tier (low/medium/high).",
        },
    )
        tier: string

    @Field(
        () => [AiActiveModelData],
        {
            description: "List of all AI task routers with their active models.",
        },
    )
        models: Array<AiActiveModelData>

    @Field(
        () => [AiGradableModelData],
        {
            description: "Enabled models the user can pick from in the grading picker.",
        },
    )
        gradableModels: Array<AiGradableModelData>
}

@ObjectType({
    description: "Response wrapper for the aiModels query.",
})
/** GraphQL envelope for the `aiModels` query. */
export class AiModelsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiModelsResponseData>
{
    @Field(
        () => AiModelsResponseData,
        {
            nullable: true,
            description: "AI models configuration payload.",
        },
    )
        data: AiModelsResponseData
}
