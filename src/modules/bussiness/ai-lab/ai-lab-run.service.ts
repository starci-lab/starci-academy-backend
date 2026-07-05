import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    AiLabPlaygroundEntity,
    AiLabRunEntity,
    AiLabRunStatus,
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
} from "@modules/databases"
import {
    AiEntitlementService,
    GradingLaneValidationService,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import type {
    AiJobSelection,
    ResolveGradingInvokeOptionsResult,
} from "@modules/ai"
import {
    AiLabPlaygroundNotFoundException,
    AiLabRunNotFoundException,
} from "@modules/exceptions"
import {
    AiLabCacheService,
} from "./ai-lab-cache.service"
import type {
    BuildStreamMessagesParams,
    BuildStreamMessagesResult,
    CreateRunParams,
    CreateRunResult,
    GetRemainingRunsParams,
    GetRemainingRunsResult,
    MarkRunFailedParams,
    PersistRunOutputParams,
    PrepareStreamParams,
    PrepareStreamResult,
    ResolveModelProviderResult,
    SelectionModelProviderResult,
} from "./types"

/**
 * Orchestrates a single AI Lab playground run up to the point of streaming.
 *
 * `createRun` does everything that must happen before the first token: cache
 * lookup (cache hit → no model call), entitlement gate, lane resolution, and
 * persisting a `Streaming` row. The token stream itself is driven by the
 * Socket.IO gateway, which calls {@link buildStreamMessages} to assemble the
 * prompt and {@link persistRunOutput} once the stream completes.
 */
@Injectable()
export class AiLabRunService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly aiLabCacheService: AiLabCacheService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) { }

    /**
     * Create (or cache-resolve) a playground run.
     *
     * @param params - User, playground, prompts, params, lane selection, locale.
     * @returns The run id, a cached output on a hit, the lifecycle status, and
     *   the invoke options the gateway needs to stream a fresh run.
     * @throws AiLabPlaygroundNotFoundException when the playground is absent.
     * @throws AiModeNotEntitledException when the picked lane is unavailable.
     * @throws AiByokInvalidException when a model/provider/key combination is invalid.
     */
    async createRun(
        {
            userId,
            playgroundId,
            systemPrompt,
            userPrompt,
            params,
            ai,
        }: CreateRunParams,
    ): Promise<CreateRunResult> {
        // load the playground first so we never persist a run against a missing parent
        const playground = await this.entityManager.findOne(
            AiLabPlaygroundEntity,
            {
                where: {
                    id: playgroundId,
                },
            },
        )
        if (!playground) {
            throw new AiLabPlaygroundNotFoundException({
                playgroundId,
            })
        }

        // resolve the lane + concrete model/provider the run will use; this also
        // gates entitlement (throws — no silent downgrade — when not entitled)
        const invokeOptions = await resolveGradingInvokeOptions({
            userId,
            selection: ai,
            aiEntitlementService: this.aiEntitlementService,
        })

        // validate the model/provider pairing against the catalog rules so a
        // bad pick fails here rather than mid-stream on the gateway
        await this.gradingLaneValidationService.validate({
            userId,
            ...this.selectionModelProvider(ai),
        })

        // derive the concrete (model, provider) used for the cache key + row
        const {
            model,
            provider,
        } = this.resolveModelProvider(invokeOptions)

        // compute the deterministic input hash (prompts + params + model + provider)
        const inputHash = this.aiLabCacheService.computeInputHash({
            systemPrompt,
            userPrompt,
            params,
            model,
            provider,
        })

        // cache lookup — an identical prior run short-circuits the model call entirely
        const {
            cachedRun,
        } = await this.aiLabCacheService.lookup({
            playgroundId,
            userId,
            inputHash,
        })
        // snapshot remaining quota for the FE nudge regardless of cache outcome
        const {
            remainingRuns,
            quotaExhausted,
        } = await this.getRemainingRuns({
            userId,
            playgroundId,
        })
        if (cachedRun) {
            // hit → return the stored output and the existing run id; nothing to stream
            return {
                runId: cachedRun.runId,
                cachedOutput: cachedRun.output,
                status: AiLabRunStatus.Cached,
                invokeOptions: null,
                remainingRuns,
                quotaExhausted,
            }
        }

        // fresh run → persist a Streaming placeholder the gateway fills in on completion
        const run = this.entityManager.create(
            AiLabRunEntity,
            {
                user: {
                    id: userId,
                },
                playground: {
                    id: playgroundId,
                },
                inputHash,
                systemPrompt,
                userPrompt,
                params,
                model,
                provider,
                output: null,
                promptTokens: 0,
                completionTokens: 0,
                estimatedCostCredits: 0,
                status: AiLabRunStatus.Streaming,
                errorMessage: null,
            },
        )
        const saved = await this.entityManager.save(run)
        return {
            runId: saved.id,
            cachedOutput: null,
            status: AiLabRunStatus.Streaming,
            invokeOptions,
            remainingRuns,
            quotaExhausted,
        }
    }

    /**
     * Build the ordered chat messages (optional system + human) for a run so the
     * gateway can hand them straight to a streaming LangChain client.
     *
     * @param params - The run's system / user prompt.
     * @returns The assembled messages.
     */
    buildStreamMessages(
        {
            systemPrompt,
            userPrompt,
        }: BuildStreamMessagesParams,
    ): BuildStreamMessagesResult {
        // a system prompt is optional — only prepend it when the learner supplied one
        const messages = systemPrompt && systemPrompt.trim().length > 0
            ? [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt),
            ]
            : [
                new HumanMessage(userPrompt),
            ]
        return {
            messages,
        }
    }

    /**
     * Prepare everything the Socket.IO gateway needs to stream a run from just
     * its id: the messages, the re-resolved invoke options, and the run's
     * model / provider / lane for the persisted output row.
     *
     * The run row was created by {@link createRun} (which already gated
     * entitlement); the gateway only receives a `runId`, so this re-resolves the
     * lane from the persisted `(mode, model, provider)` — loading the stored
     * BYOK key when the run was billed on the user's own key. A run that is
     * already `Cached` short-circuits: its stored output is returned for the
     * gateway to emit as a single final chunk with no model call.
     *
     * @param params - The run id to prepare a stream for.
     * @returns Messages + invoke options for a fresh run, or the cached output.
     * @throws AiLabRunNotFoundException when the run row is missing.
     */
    async prepareStream(
        {
            runId,
        }: PrepareStreamParams,
    ): Promise<PrepareStreamResult> {
        // load the placeholder row created by createRun — it carries the prompts + lane
        const run = await this.entityManager.findOne(
            AiLabRunEntity,
            {
                where: {
                    id: runId,
                },
            },
        )
        if (!run) {
            throw new AiLabRunNotFoundException({
                runId,
            })
        }

        // cache hit → no model call; the gateway emits the stored output as one chunk
        if (run.status === AiLabRunStatus.Cached) {
            return {
                runId: run.id,
                status: AiLabRunStatus.Cached,
                cachedOutput: run.output,
                messages: [],
                invokeOptions: null,
                model: run.model,
                provider: run.provider,
            }
        }

        // rebuild the selection from the persisted run so we resolve the same
        // model/provider (or none → the balancer picks)
        const selection = this.runToSelection(run)
        const invokeOptions = await resolveGradingInvokeOptions({
            userId: run.userId,
            selection,
            aiEntitlementService: this.aiEntitlementService,
        })

        // assemble the ordered chat messages (optional system + human) to stream
        const {
            messages,
        } = this.buildStreamMessages({
            systemPrompt: run.systemPrompt,
            userPrompt: run.userPrompt,
        })

        return {
            runId: run.id,
            status: run.status,
            cachedOutput: null,
            messages,
            invokeOptions,
            model: run.model,
            provider: run.provider,
        }
    }

    /**
     * Flag a run as failed (stream error or learner abort), storing the reason.
     *
     * @param params - The run id and the failure reason.
     * @throws AiLabRunNotFoundException when the run row is missing.
     */
    async markRunFailed(
        {
            runId,
            errorMessage,
        }: MarkRunFailedParams,
    ): Promise<void> {
        // reload the row and flip it to Failed with the captured reason
        const run = await this.entityManager.findOne(
            AiLabRunEntity,
            {
                where: {
                    id: runId,
                },
            },
        )
        if (!run) {
            throw new AiLabRunNotFoundException({
                runId,
            })
        }
        run.status = AiLabRunStatus.Failed
        run.errorMessage = errorMessage
        await this.entityManager.save(run)
    }

    /**
     * Finalize a streamed run: store the full output + token counts and flip the
     * status to Completed, then warm the run cache for identical re-runs.
     *
     * @param params - Run id, output, model metadata, and token counts.
     * @throws AiLabRunNotFoundException when the run row is missing.
     */
    async persistRunOutput(
        {
            runId,
            output,
            model,
            provider,
            promptTokens,
            completionTokens,
        }: PersistRunOutputParams,
    ): Promise<void> {
        // reload the placeholder row created by createRun — it carries the cache triple
        const run = await this.entityManager.findOne(
            AiLabRunEntity,
            {
                where: {
                    id: runId,
                },
            },
        )
        if (!run) {
            throw new AiLabRunNotFoundException({
                runId,
            })
        }
        // commit the completed output + observed token usage and mark the run done
        run.output = output
        run.model = model
        run.provider = provider
        run.promptTokens = promptTokens
        run.completionTokens = completionTokens
        run.status = AiLabRunStatus.Completed
        await this.entityManager.save(run)

        // warm the cache so an identical re-run is served without a model call
        await this.aiLabCacheService.store({
            playgroundId: run.playgroundId,
            userId: run.userId,
            inputHash: run.inputHash,
            run: {
                runId: run.id,
                output,
                model,
                provider,
                promptTokens,
                completionTokens,
            },
        })
    }

    /**
     * Count how many runs the learner may still issue in the current window:
     * the playground's per-window cap minus runs already made, intersected with
     * the user's remaining AI quota.
     *
     * @param params - Owning user + playground.
     * @returns Remaining run count and whether the AI quota is exhausted.
     */
    async getRemainingRuns(
        {
            userId,
            playgroundId,
        }: GetRemainingRunsParams,
    ): Promise<GetRemainingRunsResult> {
        // load the playground so we know its per-window cap (0 = unlimited)
        const playground = await this.entityManager.findOne(
            AiLabPlaygroundEntity,
            {
                where: {
                    id: playgroundId,
                },
            },
        )
        if (!playground) {
            throw new AiLabPlaygroundNotFoundException({
                playgroundId,
            })
        }

        // the user's overall AI quota — when the shared credit pool is spent, no run can proceed
        const snapshot = await this.aiEntitlementService.snapshot({
            userId,
        })
        // remaining allowance from the single credit pool (free base + tier)
        const quotaRemaining = snapshot.credit.remaining5h
        const quotaExhausted = quotaRemaining <= 0

        // a zero cap means "unlimited" → bound only by the AI quota
        if (playground.maxRunsPerWindow <= 0) {
            return {
                remainingRuns: Math.max(
                    0,
                    quotaRemaining,
                ),
                quotaExhausted,
            }
        }

        // count this user's runs in this playground to subtract from the per-window cap
        const usedRuns = await this.entityManager.count(
            AiLabRunEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    playground: {
                        id: playgroundId,
                    },
                },
            },
        )
        // remaining is the tighter of the playground cap and the AI quota, floored at 0
        const playgroundRemaining = Math.max(
            0,
            playground.maxRunsPerWindow - usedRuns,
        )
        return {
            remainingRuns: Math.min(
                playgroundRemaining,
                Math.max(
                    0,
                    quotaRemaining,
                ),
            ),
            quotaExhausted,
        }
    }

    /**
     * Reconstruct the selection from a persisted run so the gateway can
     * re-resolve the exact same invoke options it was created with.
     *
     * A run with a stored `(model, provider)` re-pins it; otherwise the
     * balancer picks (empty selection).
     *
     * @param run - The persisted run row.
     * @returns The selection matching the run's stored model.
     */
    private runToSelection(
        run: AiLabRunEntity,
    ): AiJobSelection {
        // stored model → re-pin the run's concrete model/provider
        if (run.model && run.provider) {
            return {
                model: run.model,
                provider: run.provider,
            }
        }
        // no pinned model → the balancer picks
        return {
        }
    }

    /**
     * Pull the loose `model` / `provider` out of a selection for the validation
     * call (empty when nothing was pinned).
     *
     * @param ai - The selection (absent → nothing pinned).
     * @returns The model + provider fields, or an empty object.
     */
    private selectionModelProvider(
        ai?: AiJobSelection,
    ): SelectionModelProviderResult {
        // nothing pinned — the balancer / resolver chooses the model
        if (!ai?.model || !ai.provider) {
            return {
            }
        }
        // a pinned selection carries the user-picked model + provider
        return {
            model: ai.model,
            provider: ai.provider,
        }
    }

    /**
     * Resolve the concrete `(model, provider)` a run will use from the resolved
     * invoke options, for the cache key and the persisted row.
     *
     * @param invokeOptions - Output of {@link resolveGradingInvokeOptions}.
     * @returns The concrete model + provider.
     */
    private resolveModelProvider(
        invokeOptions: ResolveGradingInvokeOptionsResult,
    ): ResolveModelProviderResult {
        return {
            // resolver sets model+provider for a pinned run; empty otherwise
            model: invokeOptions.model ?? "",
            provider: invokeOptions.provider ?? ModelProvider.OpenAI,
        }
    }
}
