import OpenAI from "openai"
import {
    ProjectEvaluationParseService,
} from "@features/api/processors/ai/shared/project-evaluation/project-evaluation-parse.service"
import {
    ProjectEvaluationPromptService,
} from "@features/api/processors/ai/shared/project-evaluation/project-evaluation-prompt.service"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const MILESTONE_MODEL = "deepseek/deepseek-v4-flash"
const apiKey = process.env.HARNESS_OPENROUTER_API_KEY?.trim()
const describeWithProvider = apiKey ? describe : describe.skip

const promptService = new ProjectEvaluationPromptService()
const parseService = new ProjectEvaluationParseService()

const invoke = async (
    prompt: {
        systemText: string
        humanText: string
    },
) => {
    if (!apiKey) {
        throw new Error("HARNESS_OPENROUTER_API_KEY is required for milestone grading harness")
    }
    const client = new OpenAI({
        apiKey,
        baseURL: OPENROUTER_BASE_URL,
    })
    const response = await client.chat.completions.create({
        model: MILESTONE_MODEL,
        messages: [
            {
                role: "system",
                content: prompt.systemText,
            },
            {
                role: "user",
                content: prompt.humanText,
            },
        ],
        temperature: 0,
    })
    expect(response.model).toBeTruthy()
    const content = response.choices[0]?.message.content
    if (!content) {
        throw new Error("milestone grading harness received an empty provider response")
    }
    return parseService.parse(content)
}

describeWithProvider("Milestone task grading — provider-direct model quality",
    () => {
        it("V2 strictly ranks a strong implementation above a weak implementation",
            async () => {
                const criteria = [
                    {
                        body: "GET /health returns HTTP 200 with a JSON status field.",
                        score: 40,
                        critical: true,
                        kind: "outcome" as const,
                    },
                    {
                        body: "The application uses a NestJS module, controller and service with clear responsibility boundaries.",
                        score: 60,
                        critical: false,
                        kind: "approach" as const,
                    },
                ]
                const strongPrompt = promptService.build({
                    kind: "v2",
                    taskTitle: "Scaffold backend and health endpoint",
                    targetLanguage: "English",
                    gradeMaxScore: 100,
                    criteria,
                    sourceExcerpt: [
                        "src/health/health.controller.ts:1",
                        "@Controller(\"health\")",
                        "export class HealthController {",
                        "  @Get() getHealth() { return { status: \"ok\" } }",
                        "}",
                        "src/health/health.module.ts:1",
                        "@Module({ controllers: [HealthController], providers: [HealthService] })",
                        "export class HealthModule {}",
                    ].join("\n"),
                })
                const weakPrompt = promptService.build({
                    kind: "v2",
                    taskTitle: "Scaffold backend and health endpoint",
                    targetLanguage: "English",
                    gradeMaxScore: 100,
                    criteria,
                    sourceExcerpt: [
                        "README.md:1",
                        "# TODO",
                        "A health endpoint will be implemented later.",
                    ].join("\n"),
                })

                const [
                    strong,
                    weak,
                ] = await Promise.all([
                    invoke(strongPrompt),
                    invoke(weakPrompt),
                ])

                expect(strong.score).toBeGreaterThan(weak.score)
                expect(strong.score).toBeGreaterThanOrEqual(40)
                expect(weak.score).toBeGreaterThanOrEqual(0)
                expect(strong.shortFeedback.trim()).not.toBe("")
                expect(weak.shortFeedback.trim()).not.toBe("")
            })

        it("legacy rubric remains parseable through the production parser",
            async () => {
                const prompt = promptService.build({
                    kind: "legacy",
                    taskTitle: "Let shoppers sign up and sign in",
                    targetLanguage: "Vietnamese (Tiếng Việt)",
                    sourceExcerpt: [
                        "src/auth/auth.service.ts:10",
                        "const passwordHash = await bcrypt.hash(password, 10)",
                        "const valid = await bcrypt.compare(password, user.passwordHash)",
                        "if (!valid) throw new UnauthorizedException()",
                        "return this.jwt.signAsync({ sub: user.id }, { expiresIn: \"15m\" })",
                    ].join("\n"),
                    criteria: [
                        {
                            id: "password-security",
                            orderIndex: 0,
                            text: "Passwords are hashed and verified securely.",
                            promptText: "Award full credit only when bcrypt.hash and bcrypt.compare are evidenced.",
                            score: 50,
                        },
                        {
                            id: "jwt-login",
                            orderIndex: 1,
                            text: "Successful login returns a short-lived signed JWT.",
                            promptText: "Check signing happens only after password verification and expiresIn is bounded.",
                            score: 50,
                        },
                    ],
                })

                const evaluation = await invoke(prompt)

                expect(evaluation.score).toBeGreaterThanOrEqual(0)
                expect(evaluation.score).toBeLessThanOrEqual(100)
                expect(evaluation.shortFeedback.trim()).not.toBe("")
                expect(Array.isArray(evaluation.details)).toBe(true)
            })
    })
