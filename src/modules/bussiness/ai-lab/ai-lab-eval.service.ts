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
    AiLabEvalCaseEntity,
    AiLabEvalRunEntity,
    AiLabEvalSetEntity,
    AiLabMetricKind,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    AiInvokeService,
    extractJsonBlock,
} from "@modules/ai"
import {
    AiLabEvalSetNotFoundException,
} from "@modules/exceptions"
import {
    AiLabEvalMetricService,
} from "./ai-lab-eval-metric.service"
import {
    buildJudgePrompt,
    TEMPLATE_INPUT_PLACEHOLDER,
} from "./constants"
import type {
    EvalCaseGradeResult,
    EvaluateMetricResult,
    GetEvalResultParams,
    GetEvalResultResult,
    GradeEvalSetParams,
    GradeEvalSetResult,
    ParseJudgeResult,
} from "./types"

/** Score awarded to a judge case when the LLM-judge response cannot be parsed. */
const JUDGE_PARSE_FALLBACK_SCORE = 0

/**
 * Core grader for an AI Lab eval set. Loads the set + ordered cases, runs the
 * submitted prompt template against each case's input, scores the output with
 * the case's metric (exact / contains / embedding / judge), and aggregates a
 * weighted total against the set's pass threshold. Reused by the eval-runner
 * grade step; persists nothing itself.
 */
@Injectable()
export class AiLabEvalService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiLabEvalMetricService: AiLabEvalMetricService,
    ) { }

    /**
     * Grade a submitted prompt template against every case in an eval set.
     *
     * @param params - Eval set id, submitted prompts/params, invoke options, locale.
     * @returns Weighted total / max score, pass flag, and per-case results.
     * @throws AiLabEvalSetNotFoundException when the eval set is absent.
     */
    async gradeEvalSet(
        {
            evalSetId,
            submittedSystemPrompt,
            userTemplate,
            invokeOptions,
            locale,
        }: GradeEvalSetParams,
    ): Promise<GradeEvalSetResult> {
        // load the set with its ordered cases — we grade in case order for stable output
        const evalSet = await this.entityManager.findOne(
            AiLabEvalSetEntity,
            {
                where: {
                    id: evalSetId,
                },
                relations: {
                    cases: true,
                },
                order: {
                    cases: {
                        orderIndex: "ASC",
                    },
                },
            },
        )
        if (!evalSet) {
            throw new AiLabEvalSetNotFoundException({
                evalSetId,
            })
        }

        // grade each case sequentially: invoke the template, score it, collect the result
        const caseResults: Array<EvalCaseGradeResult> = []
        for (const evalCase of evalSet.cases) {
            const caseResult = await this.gradeCase({
                evalCase,
                evalSetRubric: evalSet.judgeRubric,
                submittedSystemPrompt,
                userTemplate,
                invokeOptions,
                locale,
            })
            caseResults.push(caseResult)
        }

        // weighted aggregate: each case contributes score×weight out of weight max
        const totalScore = caseResults.reduce(
            (acc, caseResult) => acc + caseResult.metricScore * caseResult.weight,
            0,
        )
        const maxScore = caseResults.reduce(
            (acc, caseResult) => acc + caseResult.weight,
            0,
        )
        // pass when the achieved fraction clears the set threshold (guard divide-by-zero)
        const fraction = maxScore > 0
            ? totalScore / maxScore
            : 0
        return {
            totalScore,
            maxScore,
            passed: fraction >= evalSet.passThreshold,
            caseResults,
        }
    }

    /**
     * Load a single eval run (with its per-case results) for the owning learner.
     *
     * Used by the `aiLabEvalResult` query to poll a verdict after the FE receives
     * the job-completion event over the existing job-notifications socket. Scoped
     * to the owner so one learner cannot read another's eval verdict.
     *
     * @param params - Eval run id + owner id.
     * @returns The eval run with case results, or null when absent / not owned.
     */
    async getEvalResult(
        {
            evalRunId,
            userId,
        }: GetEvalResultParams,
    ): Promise<GetEvalResultResult> {
        // owner-scoped load so the verdict cannot leak across learners
        const evalRun = await this.entityManager.findOne(
            AiLabEvalRunEntity,
            {
                where: {
                    id: evalRunId,
                    user: {
                        id: userId,
                    },
                },
                relations: {
                    caseResults: true,
                },
            },
        )
        return {
            evalRun,
        }
    }

    /**
     * Grade one eval case: invoke the submitted template with the case input,
     * then score the output per the case's metric (running the LLM judge for
     * judge-kind cases).
     *
     * @param params - The case, the set rubric, submitted prompts, invoke options, locale.
     * @returns The per-case grading result.
     */
    private async gradeCase(
        {
            evalCase,
            evalSetRubric,
            submittedSystemPrompt,
            userTemplate,
            invokeOptions,
            locale,
        }: {
            evalCase: AiLabEvalCaseEntity
            evalSetRubric: string
            submittedSystemPrompt: GradeEvalSetParams["submittedSystemPrompt"]
            userTemplate: string
            invokeOptions: GradeEvalSetParams["invokeOptions"]
            locale: GradeEvalSetParams["locale"]
        },
    ): Promise<EvalCaseGradeResult> {
        // substitute the case input into the template's {{input}} placeholder
        const renderedUserPrompt = userTemplate.split(TEMPLATE_INPUT_PLACEHOLDER)
            .join(evalCase.input)
        // assemble the messages — only prepend a system prompt when one was submitted
        const messages = submittedSystemPrompt && submittedSystemPrompt.trim().length > 0
            ? [
                new SystemMessage(submittedSystemPrompt),
                new HumanMessage(renderedUserPrompt),
            ]
            : [
                new HumanMessage(renderedUserPrompt),
            ]

        // invoke the submitted template on the resolved lane (temperature 0 → deterministic)
        const {
            text: actualOutput,
        } = await this.aiInvokeService.invoke({
            messages,
            temperature: 0,
            ...invokeOptions,
        })

        // citation flag is independent of the metric — only meaningful when required
        const citationPresent = evalCase.mustCite
            ? this.aiLabEvalMetricService.citationPresent({
                actualOutput,
            })
            : null

        // score the output with the case's chosen metric
        const {
            outcome,
            judgeScore,
            feedback,
        } = await this.scoreCase({
            evalCase,
            evalSetRubric,
            actualOutput,
            locale,
        })

        // a must-cite case only passes when a citation is actually present
        const passed = evalCase.mustCite
            ? outcome.passed && citationPresent === true
            : outcome.passed
        return {
            evalCaseId: evalCase.id,
            orderIndex: evalCase.orderIndex,
            actualOutput,
            metricScore: outcome.score,
            judgeScore,
            passed,
            citationPresent,
            feedback,
            weight: evalCase.weight,
        }
    }

    /**
     * Apply the case's metric to its output. For judge cases this calls the LLM
     * judge; for the rest it runs the corresponding pure / embedding metric.
     *
     * @param params - The case, set rubric, the produced output, and locale.
     * @returns The metric outcome, optional judge score, and feedback text.
     */
    private async scoreCase(
        {
            evalCase,
            evalSetRubric,
            actualOutput,
            locale,
        }: {
            evalCase: AiLabEvalCaseEntity
            evalSetRubric: string
            actualOutput: string
            locale: GradeEvalSetParams["locale"]
        },
    ): Promise<EvaluateMetricResult> {
        switch (evalCase.metricKind) {
        // exact-match — trimmed, case-insensitive equality
        case AiLabMetricKind.Exact: {
            const outcome = this.aiLabEvalMetricService.exactMatch({
                actualOutput,
                expectedOutput: evalCase.expectedOutput,
            })
            return {
                outcome,
                judgeScore: null,
                feedback: outcome.passed
                    ? "Output exactly matched the expected answer."
                    : "Output did not match the expected answer.",
            }
        }
        // contains — every required substring must be present
        case AiLabMetricKind.Contains: {
            const outcome = this.aiLabEvalMetricService.containsMatch({
                actualOutput,
                expectedContains: evalCase.expectedContains,
            })
            return {
                outcome,
                judgeScore: null,
                feedback: outcome.passed
                    ? "Output contained all required substrings."
                    : "Output was missing one or more required substrings.",
            }
        }
        // embedding — cosine similarity to the expected answer must clear the threshold
        case AiLabMetricKind.Embedding: {
            const outcome = await this.aiLabEvalMetricService.embeddingMatch({
                actualOutput,
                expectedOutput: evalCase.expectedOutput,
                embeddingThreshold: evalCase.embeddingThreshold,
            })
            return {
                outcome,
                judgeScore: null,
                feedback: outcome.passed
                    ? "Output was semantically close enough to the expected answer."
                    : "Output diverged semantically from the expected answer.",
            }
        }
        // judge — defer the verdict to an LLM grader against the set rubric
        default:
            return this.runJudge({
                evalSetRubric,
                input: evalCase.input,
                actualOutput,
                locale,
            })
        }
    }

    /**
     * Run the LLM judge for one case: ask the model to score the output against
     * the rubric and return strict JSON `{ score, feedback }`.
     *
     * @param params - Rubric, case input, produced output, and feedback locale.
     * @returns The judge score mapped into a metric outcome plus its feedback.
     */
    private async runJudge(
        {
            evalSetRubric,
            input,
            actualOutput,
            locale,
        }: {
            evalSetRubric: string
            input: string
            actualOutput: string
            locale: GradeEvalSetParams["locale"]
        },
    ): Promise<EvaluateMetricResult> {
        // build the strict-JSON judge prompt from the rubric + the case input/output
        const {
            system,
            user,
        } = buildJudgePrompt({
            rubric: evalSetRubric,
            input,
            actualOutput,
            locale,
        })
        // invoke the judge deterministically so the same output grades the same
        const {
            text,
        } = await this.aiInvokeService.invoke({
            messages: [
                new SystemMessage(system),
                new HumanMessage(user),
            ],
            temperature: 0,
        })

        // parse the judge's strict-JSON verdict; a malformed response fails safe at 0
        const parsed = this.parseJudge(text)
        return {
            outcome: {
                score: parsed.score,
                // a judge case passes at the conventional 0.5 midpoint of its 0..1 score
                passed: parsed.score >= 0.5,
            },
            judgeScore: parsed.score,
            feedback: parsed.feedback,
        }
    }

    /**
     * Parse the LLM judge's `{ score, feedback }` JSON, clamping the score to
     * [0, 1] and failing safe to 0 / empty feedback on a malformed response.
     *
     * @param raw - The raw judge model response.
     * @returns A clamped score and feedback string.
     */
    private parseJudge(
        raw: string,
    ): ParseJudgeResult {
        try {
            // strip any fence / prose then parse the JSON object
            const parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
            // coerce the score to a finite number, then clamp into [0, 1]
            const numericScore = typeof parsed.score === "number"
                ? parsed.score
                : Number(parsed.score)
            const score = Number.isFinite(numericScore)
                ? Math.max(
                    0,
                    Math.min(
                        1,
                        numericScore,
                    ),
                )
                : JUDGE_PARSE_FALLBACK_SCORE
            return {
                score,
                feedback: typeof parsed.feedback === "string"
                    ? parsed.feedback
                    : "",
            }
        } catch {
            // unparseable judge output → fail safe rather than throwing mid-grade
            return {
                score: JUDGE_PARSE_FALLBACK_SCORE,
                feedback: "Judge response could not be parsed.",
            }
        }
    }
}
