import {
    Test,
} from "@nestjs/testing"
import {
    JudgeService,
    ModelsService,
    TestHelpersModule,
} from "@tests/helpers"
import type {
    HarnessTierName,
} from "@tests/helpers"

/**
 * Shared tutor persona every query case generates under -- the StarCi Academy
 * AI answers learner questions concisely and correctly.
 */
const TUTOR_SYSTEM = [
    "You are a concise, accurate tutor for the StarCi Academy learning platform.",
    "Answer the learner's question directly and correctly. Prefer clarity over length.",
].join(" ")

/** Minimum judge score a query answer must reach to count as passing. */
const PASS_SCORE = 60

/**
 * One eval case: a learner query generated at a given {@link HarnessTierName}
 * and graded by {@link judge} against a rubric. The five cases deliberately
 * vary in content -- definitional, debugging, conceptual/trade-off, non-English
 * (Vietnamese), and step-by-step math -- and rotate across all three tiers, so
 * the harness proves the model/auth wiring works under any scenario.
 */
interface QueryCase {
    /** Human-readable label for the jest row title. */
    name: string
    /** Tier to dispatch generation to (rotated to cover low/mid/high). */
    tier: HarnessTierName
    /** The learner's question. */
    prompt: string
    /** Grading criteria the answer must satisfy. */
    rubric: string
}

const QUERY_CASES: Array<QueryCase> = [
    {
        name: "factual definition — JS closure",
        tier: "low",
        prompt: "What is a closure in JavaScript? Give a one-sentence definition and a tiny example.",
        rubric: [
            "The answer correctly defines a JavaScript closure as a function that keeps access to",
            "variables from its enclosing (lexical) scope after that scope has returned, and includes a",
            "small code example. Pass if the definition is correct and an example is present.",
        ].join(" "),
    },
    {
        name: "debugging — return-value bug",
        tier: "mid",
        prompt: [
            "This JavaScript prints `undefined` instead of 5. Why, and how do I fix it?",
            "",
            "```js",
            "function add(a, b) {",
            "  return",
            "    a + b;",
            "}",
            "console.log(add(2, 3));",
            "```",
        ].join("\n"),
        rubric: [
            "The answer identifies automatic semicolon insertion after `return` (the bare `return` on its",
            "own line returns undefined before `a + b` is reached) as the cause, and proposes putting the",
            "returned expression on the same line as `return`. Pass if both the cause and a correct fix are stated.",
        ].join(" "),
    },
    {
        name: "conceptual trade-off — SQL vs NoSQL",
        tier: "high",
        prompt: "When should I choose a relational (SQL) database over a document (NoSQL) database for a new web app? Give 2-3 concrete factors.",
        rubric: [
            "The answer gives at least two accurate, concrete factors favoring a relational database",
            "(e.g. ACID transactions / strong consistency, complex joins and relationships, a well-defined",
            "schema) and contains no factual errors. Pass if it is balanced and correct.",
        ].join(" "),
    },
    {
        name: "non-English — Vietnamese explanation",
        tier: "mid",
        prompt: "Giai thich ngan gon 'closure' trong JavaScript la gi, tra loi hoan toan bang tieng Viet.",
        rubric: [
            "The answer is written in Vietnamese and correctly explains that a closure is a function that",
            "retains access to variables from its enclosing scope. Pass ONLY if the response is in Vietnamese",
            "AND the explanation is correct.",
        ].join(" "),
    },
    {
        name: "step-by-step math",
        tier: "high",
        prompt: "Solve for x and show your steps: 3x + 7 = 22.",
        rubric: [
            "The answer shows the algebra (subtract 7 to get 3x = 15, divide by 3 to get x = 5) and states",
            "the final answer x = 5. Pass ONLY if the final answer is x = 5 and at least one intermediate",
            "step is shown.",
        ].join(" "),
    },
]

/**
 * LLM-eval harness: run five content-varied learner queries through the model
 * tiers and grade each answer with the independent Opus judge. This proves the
 * end-to-end wiring -- OAuth-token auth ({@link client}), the low/mid/high tier
 * remap, and structured judging -- holds across factual, debugging, conceptual,
 * multilingual, and math scenarios.
 *
 * Requires a Claude Code OAuth token (`.secrets/claude-code-token.txt` or the
 * `CLAUDE_CODE_OAUTH_TOKEN` env var) and live API access; the harness lane's
 * `setup.ts` also boots the shared Testcontainers stack for flows that need it.
 */
describe("AI tutor — content-varied query eval across tiers (harness)",
    () => {
        let modelsService: ModelsService
        let judgeService: JudgeService

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                ],
            }).compile()
            modelsService = moduleRef.get(ModelsService)
            judgeService = moduleRef.get(JudgeService)
        })

        it.each(QUERY_CASES)(
            "$name -> judged pass (tier=$tier)",
            async ({
                tier,
                prompt,
                rubric,
            }) => {
                const output = await modelsService.generate(tier,
                    {
                        system: TUTOR_SYSTEM,
                        prompt,
                    })

                expect(output.trim().length).toBeGreaterThan(0)

                const verdict = await judgeService.judge(rubric,
                    output)

                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            },
        )
    })
