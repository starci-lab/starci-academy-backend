import OpenAI from "openai"
import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    readHarnessOpenRouterApiKey,
} from "@tests/helpers/harness-credentials"
import {
    judge,
} from "@tests/helpers/judge"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const TUTOR_MODEL = "qwen/qwen3.7-flash"
const PASS_SCORE = 60

interface QueryCase {
    name: string
    prompt: string
    rubric: string
    locale: Locale
}

const QUERY_CASES: Array<QueryCase> = [
    {
        name: "diagnoses JavaScript automatic semicolon insertion",
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
            "The answer identifies automatic semicolon insertion after the bare return as the cause",
            "and fixes it by placing the returned expression on the same line as return.",
        ].join(" "),
        locale: Locale.En,
    },
    {
        name: "follows a Vietnamese-only instruction",
        prompt: "Giải thích ngắn gọn closure trong JavaScript là gì. Trả lời hoàn toàn bằng tiếng Việt.", // vn-ok: functional Vietnamese instruction-following fixture
        rubric: [
            "The response is entirely in Vietnamese and correctly explains that a closure retains access",
            "to variables from its enclosing lexical scope.",
        ].join(" "),
        locale: Locale.Vi,
    },
]

const toOpenAiMessages = (messages: Array<BaseMessage>) =>
    messages.map((message) => {
        const type = (message as unknown as {
            _getType: () => string
        })._getType()
        const role = type === "system"
            ? "system" as const
            : type === "ai"
                ? "assistant" as const
                : "user" as const
        return {
            role,
            content: typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content),
        }
    })

/** Build only the production global prompt path; no dependency is reached for this scope. */
const buildContentAiService = (): ContentAiService =>
    new ContentAiService(
        {
        } as never,
        {
        } as never,
        {
        } as never,
        {
        } as never,
        {
        } as never,
    )

describe("AI tutor global answer quality (harness)",
    () => {
        let client: OpenAI
        const contentAiService = buildContentAiService()

        beforeAll(() => {
            client = new OpenAI({
                apiKey: readHarnessOpenRouterApiKey(),
                baseURL: OPENROUTER_BASE_URL,
            })
        })

        it.each(QUERY_CASES)("$name",
            async ({
                prompt,
                rubric,
                locale,
            }) => {
                const prepared = await contentAiService.prepareMessages({
                    userId: "harness-global-user",
                    question: prompt,
                    locale,
                })
                const response = await client.chat.completions.create({
                    model: TUTOR_MODEL,
                    temperature: 0.2,
                    messages: toOpenAiMessages(prepared.messages),
                })
                const output = response.choices[0]?.message.content ?? ""

                expect(output.trim().length).toBeGreaterThan(0)
                const verdict = await judge(rubric,
                    output)
                if (!verdict.pass || verdict.score < PASS_SCORE) {
                    throw new Error(JSON.stringify({
                        output,
                        verdict,
                    }))
                }
            })
    })
