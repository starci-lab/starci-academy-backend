import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AiEntitlementService,
    AiInvokeService,
    GradingLaneValidationService,
} from "@modules/ai"
import {
    CourseRagRetrievalService,
} from "@modules/rag"
import {
    UserService,
} from "@modules/bussiness"
import {
    Locale,
    MockInterviewPhase,
} from "@modules/databases"
import {
    MockInterviewSessionTooShortException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    MockInterviewGradingService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service"
import {
    MockInterviewGradePromptService,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-prompt.service"
import {
    MockInterviewVerdict,
    type GradeMockInterviewSessionParams,
    type MockInterviewTurnRecord,
} from "@features/api/core/graphql/mutations/interview/grade-mock-interview-session/types"
import {
    createHarnessInvoke,
} from "./harness-invoke"
import type {
    HarnessTierName,
} from "./models"
import {
    judge,
} from "./judge"
import {
    listVolumeDir,
    readVolumeDoc,
    volumeExists,
} from "./volume"

/** Minimum judge score a produced grade must reach to count as passing. */
const PASS_SCORE = 60

/** The tier the harness routes THIS case's grading model call to. */
let currentTier: HarnessTierName = "high"

/** Connection name used by the primary PostgreSQL data source (mirrors other unit specs, e.g. `user.service.spec.ts`). */
const POSTGRESQL_PRIMARY = "primary"

/**
 * The REAL `.volume` SSOT topic this harness grounds `mode="design"` grading
 * in -- System Design Mastery's own "fundamentals" mock-interview bank
 * (`.volume/data/courses/1-system-design-mastery/mock-interview/0-fundamentals-of-system-design`).
 * Chosen over the EQ banks (`.volume/data/mock-interview-eq/<behavioral|situational|culture>`)
 * because `mode="design"` grades a FIXED 5-phase system-design rubric
 * (requirements/estimation/highLevel/deepDive/tradeoffs -- see
 * {@link MockInterviewPhase}) that the EQ banks' single-prompt STAR-story
 * questions don't map onto; this course's own bank is written in that exact
 * shape (a 4-step clarify->estimate->design->deep-dive process, per its own
 * `description` field) and is technical rather than agnostic, so no
 * per-language `bodies/` branching is needed to ground it.
 */
const TOPIC_DIR = "courses/1-system-design-mastery/mock-interview/0-fundamentals-of-system-design"

/** The 5 canonical phases, in the fixed order the transcript interleaves them. */
const PHASE_ORDER: Array<MockInterviewPhase> = [
    MockInterviewPhase.Requirements,
    MockInterviewPhase.Estimation,
    MockInterviewPhase.HighLevel,
    MockInterviewPhase.DeepDive,
    MockInterviewPhase.Tradeoffs,
]

/**
 * One REAL question from {@link TOPIC_DIR}'s bank picked per phase -- each is an
 * actual authored interview question (with its own rubric/checklist/ideal
 * answer on file) whose SUBJECT genuinely fits that phase's slot:
 * - requirements (#0, "theory"): pulling apart latency vs throughput -- the
 *   metric-clarification question a real interviewer opens with.
 * - estimation (#4, "reasoning"): why capacity estimation (peak QPS) must
 *   happen BEFORE any technology choice.
 * - highLevel (#1, "theory"): vertical vs horizontal scaling and the
 *   load-balancer architecture that follows from it.
 * - deepDive (#13, "design-lite"): sketch a session-store contract -- a
 *   concrete component design, exactly what a deep-dive probes.
 * - tradeoffs (#6, "reasoning"): CAP/PACELC/quorum -- the canonical
 *   consistency-vs-availability trade-off discussion.
 */
const QUESTION_DIR_BY_PHASE: Record<MockInterviewPhase, string> = {
    [MockInterviewPhase.Requirements]: `${TOPIC_DIR}/questions/0-question`,
    [MockInterviewPhase.Estimation]: `${TOPIC_DIR}/questions/4-question`,
    [MockInterviewPhase.HighLevel]: `${TOPIC_DIR}/questions/1-question`,
    [MockInterviewPhase.DeepDive]: `${TOPIC_DIR}/questions/13-question`,
    [MockInterviewPhase.Tradeoffs]: `${TOPIC_DIR}/questions/6-question`,
}

/** Skip the whole suite (with a clear message) when the SSOT mount is absent. */
const HAVE_VOLUME = volumeExists(QUESTION_DIR_BY_PHASE[MockInterviewPhase.Tradeoffs])
    && listVolumeDir(`${TOPIC_DIR}/questions`).length >= PHASE_ORDER.length
const describeOrSkip = HAVE_VOLUME
    ? describe
    : describe.skip

/**
 * Build the interviewer's fixed 5-phase question set from the REAL
 * `.volume` bank -- each phase's `content` is the actual authored `prompt`
 * field of {@link QUESTION_DIR_BY_PHASE}'s question for that phase, read live
 * (never cached at module scope, so a missing mount degrades to
 * `describe.skip` instead of a hard failure at import time -- see
 * {@link readVolumeDoc}'s own doc).
 *
 * @param locale - which localized bank to read the prompts from.
 * @returns the 5 interviewer turns, index-aligned with {@link PHASE_ORDER}.
 */
const buildInterviewerTurns = (
    locale: "en" | "vi",
): Record<number, MockInterviewTurnRecord> => Object.fromEntries(
    PHASE_ORDER.map((phase, index) => {
        const doc = readVolumeDoc(QUESTION_DIR_BY_PHASE[phase],
            locale)
        const turn: MockInterviewTurnRecord = {
            role: "interviewer",
            phase,
            content: doc.fields.prompt,
        }
        return [index,
            turn] as const
    }),
)

/**
 * Interleave the REAL {@link buildInterviewerTurns} output with one candidate
 * answer per phase, in phase order -- mirrors the shape
 * `syncMockInterviewSessionTurns` actually persists. The interviewer side is
 * grounded in `.volume`; only the CANDIDATE side is hand-controlled (real
 * candidate transcripts aren't in `.volume` -- see the module task doc).
 */
const buildTranscript = (
    interviewerTurns: Record<number, MockInterviewTurnRecord>,
    candidateAnswers: Record<number, string>,
): Array<MockInterviewTurnRecord> => PHASE_ORDER.flatMap((phase, index) => [
    interviewerTurns[index],
    {
        role: "candidate",
        phase,
        content: candidateAnswers[index],
    },
])

/**
 * A STRONG candidate: concrete, technically correct answers to each of the 5
 * REAL questions in {@link QUESTION_DIR_BY_PHASE} -- matches the substance
 * their own authored `idealAnswer`/`rubric` credits (percentile vs RPS,
 * peak-QPS decision function, the two scaling walls, a session-store
 * contract, and the quorum `W + R > N` rule).
 */
const STRONG_ANSWERS: Record<number, string> = {
    0: "Latency and throughput are two different axes, not the same thing. Latency is how long ONE request takes end-to-end, and it should be reported by percentile like P95 or P99, not average, since average hides the slow outliers. Throughput is requests per second across the whole system. They trade off directly: batching requests together raises throughput because it's more efficient in bulk, but each request now waits for its batch to fill so its own latency goes up; splitting load across more nodes instead raises throughput while each request's latency stays about the same. A system can boast huge RPS and still feel slow to one user, because once the system hits its throughput ceiling — runs out of CPU or memory — every queued request's latency spikes into timeouts.",
    1: "Answering 'Design me a system like Twitter' with 'Kafka, Redis, microservices' straight away is over-engineering — picking heavy tools before you know the size of the problem. The whole point of capacity estimation is to turn the ask into numbers: write QPS, read QPS, peak QPS, and storage over a few years, so the architecture follows the data instead of taste. A single number like peak QPS can flip the whole recommendation — cross some threshold and you go from 'one relational database with read replicas is enough' to 'you need a distributed store plus a cache'; stay under it and reaching for the distributed system is wasted complexity. Clarification has to come first because it pins the assumptions — read/write ratio, target load, latency budget — that estimation then consumes, and the estimate itself is deliberately rough, because the whole process is a loop that revisits earlier numbers once new constraints show up.",
    2: "Just buying a bigger machine hits two walls it can never get past: a physical ceiling, since every hardware generation has a max core and RAM count and the top-end gear gets exponentially expensive, and a single point of failure, because it's still one machine — if it dies, everything dies. Horizontal scaling clears both walls at once by replicating commodity machines behind a load balancer: each replica adds its own throughput into the total, so N replicas give roughly N times the capacity, and with N nodes one dying still leaves N-1 serving, so the SPOF is gone via health checks evicting the failed node. The price paid is architectural complexity — the service has to become stateless, session state has to move out to a shared store like Redis which costs an extra network hop, and the load balancer itself needs its own standby so it doesn't become the new single point of failure.",
    3: "The problem is the session living in the process's own RAM forces a sticky session — the load balancer has to pin a user to that exact node, and if that node dies or the LB round-robins them elsewhere, they get logged out, and load stops spreading evenly too. I'd design a small shared session-store contract: get(sessionId) reads it, set(sessionId, session, ttl) writes it with an expiry, and delete(sessionId) removes it on logout, all backed by one central store like Redis instead of local process memory. Once state is pushed out like that the service becomes stateless, so any node can serve any request — that statelessness is the precondition for scaling out at all. I'd accept the trade-off openly: an extra network hop per session read or write, and I'd flag that the central store itself is now critical shared infrastructure that needs its own high availability or the SPOF has just moved, not disappeared.",
    4: "CAP only describes the exact moment of a network partition, but PACELC fills the gap with the Else clause — even when the network is perfectly healthy you're still trading latency against consistency, because waiting for more replicas to agree costs time, so a store can lean PA/EL, available and low-latency outside a partition, or PC/EC, always favoring consistency. Quorum is what makes that trade-off tunable: with N replicas, if writes wait for W acknowledgments and reads query R nodes, then W plus R greater than N guarantees the write set and read set overlap in at least one node, and that overlapping node holds the latest write, so the read is guaranteed to see it. If W plus R is less than or equal to N the two sets can be completely disjoint and a read can land on a stale node. That's exactly why an operations team can dial W and R per operation to slide between consistency and latency or availability without ever touching the database engine underneath.",
}

/**
 * A WEAK candidate: vague, non-committal, technically empty answers to the
 * SAME 5 REAL questions -- deliberately kept above the session-wide
 * `MIN_SUBSTANTIVE_ANSWER_LENGTH` guardrail purely by word count, not
 * substance, so the guardrail is satisfied but the transcript still has
 * nothing concrete for the grader to credit.
 */
const WEAK_ANSWERS: Record<number, string> = {
    0: "Um, I think latency and throughput are kind of the same thing, both about how fast the system is, not totally sure what the difference would really be.",
    1: "I'd probably just say use Kafka and Redis and microservices, that's usually what people use for something like Twitter I think, seems fine.",
    2: "Bigger machine probably works okay for a while, not sure what the actual limit is, and horizontal scaling sounds harder so I'm not sure it's worth it.",
    3: "I guess you could just save the session somewhere else maybe, not totally sure where, database or something, should probably work fine either way.",
    4: "CAP theorem stuff is kind of confusing, I don't really remember the quorum formula, I think more replicas is just generally safer somehow.",
}

/**
 * A BORDERLINE candidate: gets the rough shape of each answer right (names
 * the correct concepts) but stays shallow and hedges on the specifics the
 * REAL rubric actually credits (the exact percentile, the peak-QPS decision
 * threshold, the two named walls, the store's operations, the `W + R > N`
 * rule) -- a mix of partial credit rather than a clean pass or fail.
 */
const BORDERLINE_ANSWERS: Record<number, string> = {
    0: "Latency is how long one request takes, and throughput is requests per second, so they're different. Batching probably affects them somehow, and I guess a system can still feel slow to one user even with high throughput, though I'm not 100% sure why.",
    1: "You need to think about scale before picking technology, so I would ask about expected traffic. I don't remember the exact formula but a bigger number probably means you need something more like a distributed store instead of just one database.",
    2: "One big machine will run into limits eventually, and I know horizontal scaling with a load balancer helps with that and also avoids having just one server that can fail, though I'm fuzzy on how much complexity it actually adds to the app.",
    3: "You'd want to move the session out of local memory into something shared, like Redis maybe, so any server can handle the request. I'm not sure exactly what operations that store needs to expose though.",
    4: "There's some trade-off between consistency and availability, and I think CAP plus something else called PACELC covers it. Quorum has to do with how many nodes agree, but I don't remember the exact rule for when reads see the latest write.",
}

/**
 * A near-empty candidate: every turn is a one/two-word non-answer, so the
 * candidate turns joined stay comfortably under the session's
 * `MIN_SUBSTANTIVE_ANSWER_LENGTH` (100 chars) guardrail -- used ONLY to prove
 * the guardrail throws before any model call, never graded.
 */
const SHORT_ANSWERS: Record<number, string> = {
    0: "Not sure.",
    1: "No idea.",
    2: "Skip.",
    3: "N/A.",
    4: "Pass.",
}

/**
 * A Vietnamese candidate answering the SAME 5 REAL questions read from the
 * bank's own `vi.md` companions ({@link buildInterviewerTurns}`("vi")`) --
 * concrete and technically correct, so the produced grade's Vietnamese
 * feedback can be judged as substantive, not just translated boilerplate.
 */
const VI_ANSWERS: Record<number, string> = {
    0: "Latency là thời gian một request đi hết một vòng, nên đo theo percentile P95/P99 thay vì trung bình. Throughput là số request xử lý được mỗi giây trên toàn hệ thống. Hai chỉ số này đánh đổi nhau: gộp batch tăng throughput nhưng khiến từng request chờ lâu hơn, còn chia tải qua nhiều node tăng throughput mà không làm tăng latency từng request.", // vn-ok: vi-locale grading harness answers paired with vi.md questions
    1: "Trước khi chọn công nghệ phải ước lượng quy mô, ví dụ peak QPS, vì một con số như vậy có thể lật ngược quyết định giữa dùng một database quan hệ hay cần một distributed store cộng cache. Nếu bỏ qua bước này thì dễ rơi vào over-engineering hoặc under-engineering.", // vn-ok: vi-locale grading harness answers paired with vi.md questions
    2: "Nâng cấp một máy duy nhất sớm muộn cũng đụng trần phần cứng và vẫn là một điểm lỗi duy nhất. Horizontal scaling đứng sau load balancer giải quyết cả hai vấn đề đó, đổi lại service phải trở nên stateless và cần đẩy state ra một kho lưu trữ dùng chung.", // vn-ok: vi-locale grading harness answers paired with vi.md questions
    3: "Nên đẩy session ra khỏi RAM của từng node, lưu vào một kho tập trung như Redis với các thao tác đọc, ghi kèm thời gian sống, và xoá. Nhờ vậy node nào cũng phục vụ được request bất kỳ, đổi lại là thêm một network hop mỗi lần truy cập session.", // vn-ok: vi-locale grading harness answers paired with vi.md questions
    4: "CAP chỉ nói về lúc có partition, còn PACELC bổ sung rằng ngay cả khi mạng khoẻ mạnh vẫn phải đánh đổi latency với consistency. Quorum với công thức W cộng R lớn hơn N đảm bảo tập ghi và tập đọc giao nhau nên lần đọc luôn thấy dữ liệu mới nhất.", // vn-ok: vi-locale grading harness answers paired with vi.md questions
}

/**
 * One mock-interview grading eval case: a full session transcript (real
 * interviewer questions + a known candidate strength) is scored by the REAL
 * {@link MockInterviewGradingService} (real prompt builder + real STRICT-JSON
 * parser, `mode="design"`) answered by a real Claude model at `tier`, then the
 * produced {@link MockInterviewGradeSessionResult} is graded by {@link judge}
 * against a rubric describing what a good grade for THIS transcript looks like.
 */
interface GradeCase {
    /** jest row label. */
    name: string
    /** tier the grading model runs at. */
    tier: HarnessTierName
    /** the candidate's answers, index-aligned with {@link PHASE_ORDER}. */
    candidateAnswers: Record<number, string>
    /** what a good grade for this transcript must satisfy. */
    rubric: string
}

const CASES: Array<GradeCase> = [
    {
        name: "strong candidate on the real system-design-fundamentals bank → verdict trends pass, plausibly-high score, concrete strengths",
        tier: "high",
        candidateAnswers: STRONG_ANSWERS,
        rubric: [
            "The output is a grade of a STRONG mock-interview session on system-design fundamentals — real",
            "questions about latency vs throughput, capacity estimation before a technology choice, vertical vs",
            "horizontal scaling, a session-store design, and the CAP/PACELC/quorum trade-off — where the candidate",
            "gave concrete, technically sound answers covering every phase, including specific mechanisms (percentiles,",
            "the peak-QPS decision threshold, the two scaling walls, a get/set/delete session contract, the",
            "W + R > N quorum rule). A good grade gives a plausibly HIGH overallScore (roughly 65-100) with a verdict",
            "of \"pass\" or \"borderline\" (not \"fail\"), strengths that are concrete and reference specific things the",
            "candidate actually said (not generic praise), and any gaps that are fair rather than fabricated blockers.",
            "Pass if the score is plausibly-high, the verdict is not fail, and the strengths are specific rather than",
            "boilerplate.",
        ].join(" "),
    },
    {
        name: "weak candidate on the real system-design-fundamentals bank → verdict trends fail, plausibly-low score, concrete gaps",
        tier: "mid",
        candidateAnswers: WEAK_ANSWERS,
        rubric: [
            "The output is a grade of a WEAK, vague mock-interview session on system-design fundamentals — the",
            "candidate repeatedly hedged (\"not totally sure\", \"probably\", \"kind of\") and gave no concrete technical",
            "substance across the latency/throughput distinction, capacity estimation, scaling strategy, session-store",
            "design, or CAP/PACELC/quorum. A good grade gives a plausibly LOW overallScore (roughly 0-50) with a",
            "verdict of \"fail\" or \"borderline\" (not a clean \"pass\"), and gaps that name CONCRETE missing elements",
            "(e.g. no percentile distinction, no peak-QPS reasoning, no named scaling walls, no store contract, no",
            "quorum rule) rather than vague platitudes. Pass if the score is plausibly-low, the verdict is not a clean",
            "pass, and the gaps are concrete.",
        ].join(" "),
    },
    {
        name: "borderline candidate on the real system-design-fundamentals bank → verdict borderline, mixed strengths and gaps",
        tier: "low",
        candidateAnswers: BORDERLINE_ANSWERS,
        rubric: [
            "The output is a grade of a BORDERLINE mock-interview session on system-design fundamentals — the",
            "candidate correctly NAMED the right concept in every answer (latency vs throughput are different,",
            "scale should be estimated before picking tech, horizontal scaling with a load balancer avoids a single",
            "point of failure, sessions should move to a shared store, CAP/PACELC/quorum govern the",
            "consistency-availability trade-off) but stayed shallow and repeatedly admitted not remembering the",
            "specific mechanism (the exact percentile, the peak-QPS threshold, the store's own operations, the",
            "W + R > N rule). A good grade reflects that mix: verdict \"borderline\" (not a clean \"pass\" and not a",
            "clean \"fail\"), and BOTH non-empty strengths (crediting the concepts correctly named) AND non-empty gaps",
            "(naming the missing depth/specifics). Pass if the verdict is borderline (or, failing that, at least NOT",
            "the extreme opposite of what a shallow-but-not-wrong answer deserves) and both strengths and gaps are",
            "populated and specific rather than boilerplate.",
        ].join(" "),
    },
]

/** Fixed request identity shared by every EN case -- only `turns` varies. */
const BASE_PARAMS_SANS_PROMPT: Omit<GradeMockInterviewSessionParams, "turns" | "promptTitle" | "locale"> = {
    userId: "harness-user",
    courseId: "1-system-design-mastery",
    promptId: "harness-prompt",
    level: "middle",
    sessionId: "harness-session",
}

const gradingLaneValidationServiceMock = {
    validate: jest.fn().mockResolvedValue({
    }),
}

const aiEntitlementServiceMock = {
    assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(undefined),
}

const courseRagRetrievalServiceMock = {
    retrieveCourseExcerpt: jest.fn().mockResolvedValue({
        excerpt: "",
        retrievedChunks: 0,
        matchedContentIds: [] as Array<string>,
    }),
}

const userServiceMock = {
    resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
        id: "harness-enrollment",
    }),
}

/**
 * LLM-eval harness for mock-interview session grading, grounded in the REAL
 * `.volume` System Design Mastery mock-interview bank ({@link TOPIC_DIR}).
 * Boots the REAL {@link MockInterviewGradingService} + REAL
 * {@link MockInterviewGradePromptService}, swaps only {@link AiInvokeService}
 * for the tiered harness model ({@link createHarnessInvoke}, `.secrets`
 * auth), and judges the produced session grade. Covers: strong/weak/borderline
 * grading, cross-strength DISCRIMINATION on the SAME real prompt, the
 * too-short guardrail, and non-English (Vietnamese) feedback grounded in the
 * bank's own `vi.md` companions.
 *
 * `mode="design"` is exercised deliberately: `entityManager.findOne` (the mocked primary
 * PostgreSQL entity manager) resolves `null` for the `MockInterviewSessionEntity` lookup --
 * the SAME "no session row found" path `MockInterviewGradingService.resolveTrustedPromptIdentity`
 * documents as its own fallback, which lands on `mode="design"` (+ a WARN log) using the
 * client-sent `promptTitle`/`level`. That fallback is used ON PURPOSE here rather than seeded
 * around: `mode="design"` never touches `MockInterviewEntity`/`FlashcardCardEntity`
 * (`resolveSeedGroundings` is `mode="qna"`-only), so the ONLY real grading dependency left to
 * mock is the advisory {@link CourseRagRetrievalService} -- exactly the one the task's own
 * dependency list singles out as "only used in design mode". The candidate's turns are kept
 * well above the session's `MIN_SUBSTANTIVE_ANSWER_LENGTH` (100 chars) guardrail in every case
 * except the guardrail case itself.
 *
 * {@link GradingLaneValidationService} (mocked to an empty lane -- no model pinned, balancer
 * picks) and {@link AiEntitlementService} (mocked to no-op quota/consume) are the same two
 * gates every other grading-flow harness mocks; they gate CHARGE/QUOTA plumbing, not the
 * grading business logic under test here.
 *
 * Requires the `.volume` mount + a Claude Code OAuth token
 * (`.secrets/claude-code-token.txt` or `CLAUDE_CODE_OAUTH_TOKEN`) + live API for the model +
 * judge calls.
 */
describeOrSkip("Mock-interview grading — real grade flow judged (harness)",
    () => {
        let service: MockInterviewGradingService
        let entityManager: EntityManagerMock
        let promptTitleEn: string
        let promptTitleVi: string

        beforeAll(async () => {
            entityManager = makeEntityManagerMock()

            // read the REAL bank's topic titles once -- used as `promptTitle` so the grading
            // prompt's "completed a full mock interview about ..." framing matches the actual
            // course material the transcript is grounded in, not a hand-invented title
            promptTitleEn = readVolumeDoc(TOPIC_DIR).title
            promptTitleVi = readVolumeDoc(TOPIC_DIR,
                "vi").title

            const moduleRef = await Test.createTestingModule({
                providers: [
                    MockInterviewGradingService,
                    MockInterviewGradePromptService,
                    {
                        provide: AiInvokeService,
                        useValue: createHarnessInvoke(() => currentTier),
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationServiceMock,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementServiceMock,
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: courseRagRetrievalServiceMock,
                    },
                    {
                        provide: UserService,
                        useValue: userServiceMock,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = moduleRef.get(MockInterviewGradingService)
        })

        afterEach(() => {
            currentTier = "high"
            jest.clearAllMocks()
            gradingLaneValidationServiceMock.validate.mockResolvedValue({
            })
            aiEntitlementServiceMock.assertNotOverQuota.mockResolvedValue(undefined)
            aiEntitlementServiceMock.consume.mockResolvedValue(undefined)
            courseRagRetrievalServiceMock.retrieveCourseExcerpt.mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
            })
            userServiceMock.resolveOrCreateTrialEnrollment.mockResolvedValue({
                id: "harness-enrollment",
            })
            // no MockInterviewSessionEntity row -> resolveTrustedPromptIdentity's documented
            // fallback (mode="design", client-sent prompt identity) -- see the describe doc above
            entityManager.findOne.mockResolvedValue(null)
        })

        // ── strong / weak / borderline grading on the SAME real bank ──
        it.each(CASES)(
            "$name (tier=$tier)",
            async ({
                tier,
                candidateAnswers,
                rubric,
            }) => {
                currentTier = tier
                const turns = buildTranscript(
                    buildInterviewerTurns("en"),
                    candidateAnswers,
                )

                const result = await service.grade({
                    ...BASE_PARAMS_SANS_PROMPT,
                    promptTitle: promptTitleEn,
                    locale: Locale.En,
                    turns,
                })

                // the parser + normalizer produced a valid, well-shaped session grade
                expect(typeof result.overallScore).toBe("number")
                expect(result.overallScore).toBeGreaterThanOrEqual(0)
                expect(result.overallScore).toBeLessThanOrEqual(100)
                expect(Object.values(MockInterviewVerdict)).toContain(result.verdict)
                // mode="design" (the fallback mode resolved here) never produces per-question reviews
                expect(result.questionReviews).toEqual([])

                // the grade itself is sensible for this transcript
                const verdict = await judge(rubric,
                    JSON.stringify({
                        overallScore: result.overallScore,
                        verdict: result.verdict,
                        phaseScores: result.phaseScores,
                        attributeScores: result.attributeScores,
                        strengths: result.strengths,
                        gaps: result.gaps,
                        followUpQuestion: result.followUpQuestion,
                    }))

                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            },
        )

        // ── discrimination: the grader must rank the STRONG candidate above the WEAK one on the SAME real prompt ──
        it("ranks the STRONG candidate strictly above the WEAK candidate on the SAME real prompt",
            async () => {
                currentTier = "high"
                const interviewerTurns = buildInterviewerTurns("en")

                const strongResult = await service.grade({
                    ...BASE_PARAMS_SANS_PROMPT,
                    promptTitle: promptTitleEn,
                    locale: Locale.En,
                    turns: buildTranscript(interviewerTurns,
                        STRONG_ANSWERS),
                })
                const weakResult = await service.grade({
                    ...BASE_PARAMS_SANS_PROMPT,
                    promptTitle: promptTitleEn,
                    locale: Locale.En,
                    turns: buildTranscript(interviewerTurns,
                        WEAK_ANSWERS),
                })

                expect(strongResult.overallScore).toBeGreaterThan(weakResult.overallScore)
            })

        // ── guardrail: candidate turns under the substantive-answer floor -> throws before any model call ──
        it("throws MockInterviewSessionTooShortException before any model call when candidate turns are too short",
            async () => {
                const turns = buildTranscript(
                    buildInterviewerTurns("en"),
                    SHORT_ANSWERS,
                )

                await expect(
                    service.grade({
                        ...BASE_PARAMS_SANS_PROMPT,
                        promptTitle: promptTitleEn,
                        locale: Locale.En,
                        turns,
                    }),
                ).rejects.toThrow(MockInterviewSessionTooShortException)

                // the guard fires before the AI lane / entitlement charge is ever touched
                expect(aiEntitlementServiceMock.assertNotOverQuota).not.toHaveBeenCalled()
                expect(aiEntitlementServiceMock.consume).not.toHaveBeenCalled()
            })

        // ── locale: a Vietnamese run, grounded in the bank's own vi.md companions, grades in Vietnamese ──
        it("grades a real Vietnamese transcript (vi.md bank) in Vietnamese",
            async () => {
                currentTier = "mid"
                const turns = buildTranscript(
                    buildInterviewerTurns("vi"),
                    VI_ANSWERS,
                )

                const result = await service.grade({
                    ...BASE_PARAMS_SANS_PROMPT,
                    promptTitle: promptTitleVi,
                    locale: Locale.Vi,
                    turns,
                })

                expect(result.strengths.length + result.gaps.length).toBeGreaterThan(0)

                const verdict = await judge(
                    "The output is a mock-interview grade whose strengths/gaps/followUpQuestion text is written in "
                        + "Vietnamese and is specific to what the candidate actually said (not generic boilerplate). "
                        + "Pass only if the feedback text is genuinely in Vietnamese.",
                    JSON.stringify({
                        overallScore: result.overallScore,
                        verdict: result.verdict,
                        strengths: result.strengths,
                        gaps: result.gaps,
                        followUpQuestion: result.followUpQuestion,
                    }))
                expect(verdict.pass).toBe(true)
            })
    })
