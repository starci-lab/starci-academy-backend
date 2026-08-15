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
const CONTENT_MODEL = "qwen/qwen3.7-flash"
const PASS_SCORE = 60

const LESSON_QUOTE = "A database index speeds up reads by avoiding a full table scan, but every insert and update must also maintain the index."
const CHALLENGE_MATERIAL = [
    "Build a debounce(fn, wait) utility.",
    "The latest call replaces the previous pending timer.",
    "The callback must run once, only after wait milliseconds have elapsed since the latest call.",
    "Tests use fake timers and call the wrapper three times before advancing time.",
].join("\n")

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

describe("contextual content AI answer quality (harness)",
    () => {
        let client: OpenAI
        let entityManager: {
            find: jest.Mock
            findOne: jest.Mock
        }
        let s3ReadService: {
            json: jest.Mock
        }
        let userService: {
            checkEnrollment: jest.Mock
        }
        let contentRagRetrievalService: {
            retrieveContentExcerpt: jest.Mock
            retrieveCourseExcerpt: jest.Mock
        }
        let contentAiService: ContentAiService

        beforeAll(() => {
            client = new OpenAI({
                apiKey: readHarnessOpenRouterApiKey(),
                baseURL: OPENROUTER_BASE_URL,
            })
        })

        beforeEach(() => {
            entityManager = {
                find: jest.fn().mockResolvedValue([]),
                findOne: jest.fn(),
            }
            s3ReadService = {
                json: jest.fn(),
            }
            userService = {
                checkEnrollment: jest.fn().mockResolvedValue(true),
            }
            contentRagRetrievalService = {
                retrieveContentExcerpt: jest.fn().mockResolvedValue({
                    excerpt: "",
                }),
                retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                    excerpt: "",
                }),
            }
            contentAiService = new ContentAiService(
                entityManager as never,
                s3ReadService as never,
                {
                    content: jest.fn(() => "contents/lesson-1/en.json"),
                } as never,
                userService as never,
                contentRagRetrievalService as never,
            )
        })

        const answerPreparedMessages = async (messages: Array<BaseMessage>): Promise<string> => {
            const response = await client.chat.completions.create({
                model: CONTENT_MODEL,
                temperature: 0.2,
                messages: toOpenAiMessages(messages),
            })
            return response.choices[0]?.message.content ?? ""
        }

        it("grounds a quoted question in the open lesson",
            async () => {
                s3ReadService.json.mockResolvedValueOnce({
                    id: "lesson-1",
                    isPremium: false,
                    body: LESSON_QUOTE,
                    bodies: [],
                })
                entityManager.findOne.mockResolvedValueOnce({
                    id: "lesson-1",
                    isPremium: false,
                })
                const question = [
                    "<display>Why is this a trade-off?</display>",
                    `<context>${LESSON_QUOTE}</context>`,
                ].join("\n")
                const prepared = await contentAiService.prepareMessages({
                    userId: "harness-content-user",
                    contentId: "lesson-1",
                    question,
                    locale: Locale.En,
                })
                const output = await answerPreparedMessages(prepared.messages)

                expect(output.trim().length).toBeGreaterThan(0)
                const verdict = await judge([
                    "The answer explains the quoted read/write trade-off: the index avoids full scans for reads,",
                    "while writes cost more because the index must be maintained. It does not mention XML tags.",
                ].join(" "),
                output)
                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            })

        it("uses challenge material without handing over a finished solution",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "challenge-1",
                    content: {
                        id: "lesson-1",
                        module: {
                            id: "module-1",
                            course: {
                                id: "course-1",
                            },
                        },
                    },
                })
                contentRagRetrievalService.retrieveContentExcerpt.mockResolvedValueOnce({
                    excerpt: CHALLENGE_MATERIAL,
                })
                const prepared = await contentAiService.prepareMessages({
                    userId: "harness-content-user",
                    challengeId: "challenge-1",
                    question: "Why does my test fail when all three scheduled callbacks run? Give me a hint, not the completed code.",
                    locale: Locale.En,
                })
                const output = await answerPreparedMessages(prepared.messages)

                expect(output.trim().length).toBeGreaterThan(0)
                const verdict = await judge([
                    "The answer grounds itself in this challenge: each new call must cancel or replace the pending",
                    "timer so only the latest callback runs after the quiet period. It gives guidance, not a complete implementation.",
                ].join(" "),
                output)
                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            })
    })
