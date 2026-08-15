import type {
    BaseMessage,
} from "@langchain/core/messages"
import OpenAI from "openai"
import type {
    ChatCompletionMessageParam,
} from "openai/resources/chat/completions"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    GradeMockInterviewSessionParseService,
    type ParsedMockInterviewGrade,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-parse.service"
import {
    MockInterviewGradePromptService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
import {
    MockInterviewVerdict,
    type MockInterviewTurnRecord,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/types/mock-interview-grade"
import {
    describeWithGitMount,
    readGitMountDoc,
} from "@tests/helpers/git-mount"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const OPENROUTER_API_KEY_ENV = "HARNESS_OPENROUTER_API_KEY"
const GRADING_MODEL = "deepseek/deepseek-v4-flash"
const TOPIC_DIR = "courses/1-system-design-mastery/mock-interview/0-fundamentals-of-system-design"

const PHASE_ORDER: Array<MockInterviewPhase> = [
    MockInterviewPhase.Requirements,
    MockInterviewPhase.Estimation,
    MockInterviewPhase.HighLevel,
    MockInterviewPhase.DeepDive,
    MockInterviewPhase.Tradeoffs,
]

const QUESTION_DIR_BY_PHASE: Record<MockInterviewPhase, string> = {
    [MockInterviewPhase.Requirements]: `${TOPIC_DIR}/questions/0-question`,
    [MockInterviewPhase.Estimation]: `${TOPIC_DIR}/questions/4-question`,
    [MockInterviewPhase.HighLevel]: `${TOPIC_DIR}/questions/1-question`,
    [MockInterviewPhase.DeepDive]: `${TOPIC_DIR}/questions/13-question`,
    [MockInterviewPhase.Tradeoffs]: `${TOPIC_DIR}/questions/6-question`,
}

const STRONG_ANSWERS: Record<number, string> = {
    0: "Latency is one request's end-to-end time and should be measured at P95/P99; throughput is aggregate requests per second. Batching can raise throughput while increasing latency.",
    1: "Estimate read, write and peak QPS plus storage before selecting technology. Those numbers decide whether one relational database is enough or distribution and caching are justified.",
    2: "Vertical scaling has a physical ceiling and remains a single point of failure. Horizontal replicas behind a highly available load balancer add capacity and resilience but require stateless services.",
    3: "Move sessions from process memory into a shared Redis-backed get/set/delete contract with TTL. Any node can then serve a request, at the cost of a network hop and making the store critical infrastructure.",
    4: "PACELC adds the latency-consistency trade-off outside partitions. With N replicas, W plus R greater than N guarantees read/write quorum overlap and observation of the latest acknowledged write.",
}

const WEAK_ANSWERS: Record<number, string> = {
    0: "Latency and throughput are both about speed and I do not know a useful distinction.",
    1: "I would choose Kafka, Redis and microservices immediately because popular systems use them.",
    2: "A larger server is probably enough and horizontal scaling sounds unnecessarily difficult.",
    3: "The session could be saved somewhere, perhaps a database, but the interface and failure behavior do not matter.",
    4: "CAP and quorum are confusing; adding replicas should make consistency automatic without choosing read or write counts.",
}

const VI_ANSWERS: Record<number, string> = {
    0: "Latency là thời gian của một request nên đo P95 hoặc P99, còn throughput là tổng số request mỗi giây. Gộp batch có thể tăng throughput nhưng làm từng request chờ lâu hơn.", // vn-ok: Vietnamese-locale harness transcript.
    1: "Phải ước lượng read QPS, write QPS, peak QPS và dung lượng trước khi chọn công nghệ để tránh over-engineering.", // vn-ok: Vietnamese-locale harness transcript.
    2: "Scale dọc có trần phần cứng và vẫn là điểm lỗi duy nhất. Scale ngang qua load balancer tăng cả năng lực lẫn khả năng chịu lỗi nhưng service phải stateless.", // vn-ok: Vietnamese-locale harness transcript.
    3: "Đưa session vào Redis dùng chung với get, set kèm TTL và delete để node nào cũng phục vụ được, đổi lại có thêm network hop.", // vn-ok: Vietnamese-locale harness transcript.
    4: "PACELC nói thêm về đánh đổi latency và consistency khi mạng bình thường; W cộng R lớn hơn N bảo đảm tập đọc và ghi giao nhau.", // vn-ok: Vietnamese-locale harness transcript.
}

const requireOpenRouterApiKey = (): string => {
    const value = process.env[OPENROUTER_API_KEY_ENV]?.trim()
    if (!value) {
        throw new Error(`${OPENROUTER_API_KEY_ENV} is required for the live harness`)
    }
    return value
}

const messageText = (
    message: BaseMessage,
): string => typeof message.content === "string"
    ? message.content
    : JSON.stringify(message.content)

const toOpenRouterMessages = (
    messages: Array<BaseMessage>,
): Array<ChatCompletionMessageParam> => messages.map((message) => {
    const type = (message as unknown as {
        _getType?: () => string
    })._getType?.()
    return type === "system"
        ? {
            role: "system",
            content: messageText(message),
        }
        : {
            role: "user",
            content: messageText(message),
        }
})

const buildInterviewerTurns = (
    locale: "en" | "vi",
): Record<number, MockInterviewTurnRecord> => Object.fromEntries(
    PHASE_ORDER.map((phase, index) => [index,
        {
            role: "interviewer",
            phase,
            content: readGitMountDoc(QUESTION_DIR_BY_PHASE[phase],
                locale).fields.prompt,
        }]),
)

const buildTranscript = (
    locale: "en" | "vi",
    candidateAnswers: Record<number, string>,
): Array<MockInterviewTurnRecord> => {
    const interviewerTurns = buildInterviewerTurns(locale)
    return PHASE_ORDER.flatMap((phase, index) => [
        interviewerTurns[index],
        {
            role: "candidate",
            phase,
            content: candidateAnswers[index],
        },
    ])
}

const promptService = new MockInterviewGradePromptService()
const parseService = new GradeMockInterviewSessionParseService()

const gradeDirectly = async (
    params: {
        locale: Locale
        promptTitle: string
        turns: Array<MockInterviewTurnRecord>
    },
): Promise<ParsedMockInterviewGrade> => {
    const client = new OpenAI({
        apiKey: requireOpenRouterApiKey(),
        baseURL: OPENROUTER_BASE_URL,
        maxRetries: 0,
    })
    const { messages } = promptService.build({
        promptTitle: params.promptTitle,
        mode: MockInterviewMode.Design,
        level: "middle",
        turns: params.turns,
        seedGroundings: [],
        courseExcerpt: "",
        locale: params.locale,
    })
    const completion = await client.chat.completions.create({
        model: GRADING_MODEL,
        messages: toOpenRouterMessages(messages),
        temperature: 0,
    })
    const text = completion.choices[0]?.message.content
    if (!text) {
        throw new Error(`${GRADING_MODEL} returned no scorecard content`)
    }
    return parseService.parse(text)
}

const describeOrSkip = describeWithGitMount(Object.values(QUESTION_DIR_BY_PHASE))

describeOrSkip("Mock-interview grading — direct OpenRouter model quality (harness)",
    () => {
        it("strictly ranks a strong candidate above a weak candidate on the same real prompt",
            async () => {
                const promptTitle = readGitMountDoc(TOPIC_DIR).title
                const strong = await gradeDirectly({
                    promptTitle,
                    locale: Locale.En,
                    turns: buildTranscript("en",
                        STRONG_ANSWERS),
                })
                const weak = await gradeDirectly({
                    promptTitle,
                    locale: Locale.En,
                    turns: buildTranscript("en",
                        WEAK_ANSWERS),
                })

                expect(strong.overallScore).toBeGreaterThan(weak.overallScore)
                expect(Object.values(MockInterviewVerdict)).toContain(strong.verdict)
                expect(Object.values(MockInterviewVerdict)).toContain(weak.verdict)
                expect(strong.phaseScores.length).toBeGreaterThan(0)
                expect(weak.phaseScores.length).toBeGreaterThan(0)
            })

        it("returns substantive Vietnamese feedback for a Vietnamese transcript",
            async () => {
                const result = await gradeDirectly({
                    promptTitle: readGitMountDoc(TOPIC_DIR,
                        "vi").title,
                    locale: Locale.Vi,
                    turns: buildTranscript("vi",
                        VI_ANSWERS),
                })
                const feedback = [
                    ...result.strengths,
                    ...result.gaps,
                    result.followUpQuestion ?? "",
                    ...result.questionFeedback.map((item) => item.feedback),
                ].join(" ")

                if (feedback.length <= 20) {
                    throw new Error(JSON.stringify(result))
                }
                expect(feedback).toMatch(/[ăâđêôơưĂÂĐÊÔƠƯ]/u)
            })
    })
