import {
    Injectable,
} from "@nestjs/common"
import {
    AiLabRunService,
} from "@modules/bussiness"
import {
    flatFieldsToAiJobSelection,
} from "@modules/ai"
import type {
    RunPlaygroundPromptParams,
    RunPlaygroundPromptResult,
} from "./types"

/**
 * Thin GraphQL-layer service for the runPlaygroundPrompt mutation. It maps the
 * loose lane fields on the input into the discriminated `AiJobSelection`, then
 * delegates the run creation (cache lookup, entitlement gate, lane resolution,
 * placeholder persistence) to the business {@link AiLabRunService}. The token
 * stream itself is driven later by the Socket.IO gateway, not here.
 */
@Injectable()
export class RunPlaygroundPromptService {
    constructor(
        private readonly aiLabRunService: AiLabRunService,
    ) { }

    /**
     * Create (or cache-resolve) a playground run for the authenticated learner.
     *
     * @param params - The mutation input, learner id, and request locale.
     * @returns The run id, optional cached output, status, and quota snapshot.
     */
    async execute(
        {
            input,
            userId,
            locale,
        }: RunPlaygroundPromptParams,
    ): Promise<RunPlaygroundPromptResult> {
        const {
            playgroundId,
            systemPrompt,
            userPrompt,
            params,
            mode,
            selectedModel,
            selectedModelProvider,
        } = input
        // collapse the loose lane fields into the discriminated selection (undefined → Auto)
        const ai = flatFieldsToAiJobSelection({
            mode,
            selectedModel,
            selectedModelProvider,
        })
        // delegate the full pre-stream orchestration to the business service
        const {
            runId,
            cachedOutput,
            status,
            remainingRuns,
            quotaExhausted,
        } = await this.aiLabRunService.createRun({
            userId,
            playgroundId,
            // normalize an omitted system prompt to null for the business contract
            systemPrompt: systemPrompt ?? null,
            userPrompt,
            // default the sampling params to an empty object when the client sent none
            params: params ?? {
            },
            ...(ai !== undefined ? {
                ai,
            } : {
            }),
            locale,
        })
        return {
            runId,
            cachedOutput,
            status,
            remainingRuns,
            quotaExhausted,
        }
    }
}
