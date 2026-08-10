import {
    Test,
} from "@nestjs/testing"
import {
    JudgeService,
} from "@tests/helpers/judge.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    askModel,
} from "@tests/helpers/models"

/**
 * The model this harness answers with, named here rather than resolved from a tier table.
 *
 * A layer that CHOOSES the model between the harness and the provider can make this lane green
 * about a model nobody ships, so the choice is stated in the file that depends on it.
 */
const TUTOR_MODEL = "claude-sonnet-5"

/** Reasoning effort for the tutor answer -- the balanced setting the product uses for chat. */
const TUTOR_EFFORT = "low" as const

/**
 * Shared tutor persona every query case generates under -- the StarCi Academy AI answers learner
 * questions concisely and correctly.
 */
const TUTOR_SYSTEM = [
    "You are a concise, accurate tutor for the StarCi Academy learning platform.",
    "Answer the learner's question directly and correctly. Prefer clarity over length.",
].join(" ")

/** Minimum judge score a query answer must reach to count as passing. */
const PASS_SCORE = 60

/** One eval case: a learner query, and the rubric its answer is graded against. */
interface QueryCase {
    /** Human-readable label for the jest row title. */
    name: string
    /** The learner's question. */
    prompt: string
    /** Grading criteria the answer must satisfy. */
    rubric: string
}

/**
 * TWO CASES, AND THEY ARE CHOSEN RATHER THAN SAMPLED.
 *
 * This lane is billed per call and every case costs two -- one to answer, one to judge. A matrix
 * is therefore not thoroughness here, it is a reason people stop running the harness, and a stale
 * green is worse than no green at all.
 *
 * So each case earns its place by being one a REGRESSION would show up in. Both have a single
 * unambiguous right answer, which is what lets the judge be strict:
 *
 *   - the ASI bug has exactly one correct diagnosis, and a weaker model reaches for the wrong one
 *     (a missing operator, a scoping mistake) instead of automatic semicolon insertion;
 *   - the Vietnamese request fails VISIBLY when instruction-following degrades, because the answer
 *     comes back in English.
 *
 * Retired with the tier table: a closure definition and a two-step equation, which every model
 * passes and which therefore measured nothing; and an open "SQL vs NoSQL" trade-off, whose answer
 * is a matter of degree and so gave the judge nothing firm to fail.
 */
const QUERY_CASES: Array<QueryCase> = [
    {
        name: "debugging - a bare return, and the bug is automatic semicolon insertion",
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
            "returned expression on the same line as `return`. Pass ONLY if both the cause and a correct",
            "fix are stated.",
        ].join(" "),
    },
    {
        name: "instruction-following - answers wholly in Vietnamese when asked to",
        prompt: "Giai thich ngan gon 'closure' trong JavaScript la gi, tra loi hoan toan bang tieng Viet.",
        rubric: [
            "The answer is written in Vietnamese and correctly explains that a closure is a function that",
            "retains access to variables from its enclosing scope. Pass ONLY if the response is in Vietnamese",
            "AND the explanation is correct.",
        ].join(" "),
    },
]

/**
 * LLM-eval harness for the tutor answer.
 *
 * It REALLY CALLS the provider: a faked call here would measure nothing, because what the model
 * actually said is the entire subject of this lane. The answer is then graded by an independent
 * judge, so the verdict does not come from the same model that produced the text.
 *
 * Requires a Claude Code OAuth token (`.secrets/claude-code-token.txt` or the
 * `CLAUDE_CODE_OAUTH_TOKEN` env var) and live API access.
 */
describe("AI tutor answer quality (harness)",
    () => {
        let judgeService: JudgeService

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                ],
            }).compile()
            judgeService = moduleRef.get(JudgeService)
        })

        it.each(QUERY_CASES)(
            "$name",
            async ({
                prompt,
                rubric,
            }) => {
                const output = await askModel({
                    model: TUTOR_MODEL,
                    effort: TUTOR_EFFORT,
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
