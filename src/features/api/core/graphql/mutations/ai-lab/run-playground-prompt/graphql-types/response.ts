import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiLabRunStatus,
    GraphQLTypeAiLabRunStatus,
} from "@modules/databases"

/**
 * Data payload for the runPlaygroundPrompt mutation. On a cache hit the full
 * output is returned inline (status `Cached`); on a fresh run only the run id
 * is returned (status `Streaming`) and the FE subscribes over Socket.IO.
 */
@ObjectType({
    description: "Data for the runPlaygroundPrompt mutation.",
})
export class RunPlaygroundPromptResponseData {
    @Field(
        () => ID,
        {
            description: "Persisted run id; drives the Socket.IO subscription on a fresh run.",
        },
    )
        runId: string

    /** Full cached output on a cache hit; null when the run must be streamed. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Full cached output on a cache hit; null when the run must be streamed.",
        },
    )
        cachedOutput: string | null

    @Field(
        () => GraphQLTypeAiLabRunStatus,
        {
            description: "Lifecycle status right after creation (Cached or Streaming).",
        },
    )
        status: AiLabRunStatus

    @Field(
        () => Int,
        {
            description: "Runs the learner may still issue in the current window.",
        },
    )
        remainingRuns: number

    @Field(
        () => Boolean,
        {
            description: "Whether the learner's AI quota is exhausted (FE nudge).",
        },
    )
        quotaExhausted: boolean
}

/**
 * Response wrapper for the runPlaygroundPrompt mutation.
 */
@ObjectType({
    description: "Response for the runPlaygroundPrompt mutation.",
})
export class RunPlaygroundPromptResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RunPlaygroundPromptResponseData>
{
    @Field(
        () => RunPlaygroundPromptResponseData,
        {
            nullable: true,
        },
    )
        data: RunPlaygroundPromptResponseData
}
