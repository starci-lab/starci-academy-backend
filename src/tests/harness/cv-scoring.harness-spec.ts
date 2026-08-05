import {
    Test,
} from "@nestjs/testing"
import {
    Locale,
} from "@modules/databases"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    CvRagRetrievalService,
} from "@modules/rag"
import {
    CvScoringService,
} from "@features/api/processors/ai/shared/cv-scoring/cv-scoring.service"
import {
    createHarnessInvoke,
    judge,
    readVolumeDoc,
    volumeExists,
} from "@tests/helpers"
import type {
    HarnessTierName,
} from "@tests/helpers"

/** Minimum judge score a produced grade must reach to count as passing. */
const PASS_SCORE = 60

/** The tier the harness routes THIS case's grading model call to. */
let currentTier: HarnessTierName = "high"

/**
 * REAL CV samples from the `.volume` SSOT mount, labelled by seniority. These
 * are the gold-standard exemplars the app itself ships -- grading them (rather
 * than hand-written fixtures) tests the grader against the actual material and
 * lets us assert it DISCRIMINATES real seniority (senior scores above junior).
 */
const SAMPLES = [
    {
        name: "junior backend (node)",
        dir: "cv/samples/01-junior-backend-nodejs",
        level: "junior",
        tier: "mid" as HarnessTierName,
        rubric: [
            "This is a JUNIOR engineer's CV. A good grade gives it a plausibly modest-to-mid score and",
            "feedback that is specific and constructive — naming concrete growth areas (impact metrics, depth,",
            "ownership) rather than generic praise. Pass if the score is plausible for a junior CV and the",
            "feedback is specific.",
        ].join(" "),
    },
    {
        name: "mid fullstack",
        dir: "cv/samples/04-mid-fullstack",
        level: "mid",
        tier: "mid" as HarnessTierName,
        rubric: [
            "This is a MID-level engineer's CV. A good grade gives it a plausibly mid-to-good score and",
            "specific, actionable feedback that references the actual experience. Pass if the score is plausible",
            "for a mid CV and the feedback is specific rather than boilerplate.",
        ].join(" "),
    },
    {
        name: "senior backend / system design",
        dir: "cv/samples/06-senior-backend-systemdesign",
        level: "senior",
        tier: "high" as HarnessTierName,
        rubric: [
            "This is a strong SENIOR engineer's CV (system-design ownership, org-level scope, mentoring,",
            "quantified impact). A good grade gives it a plausibly HIGH score and feedback that acknowledges its",
            "real strengths while offering refined, specific suggestions. Pass if the score is plausibly high",
            "and the feedback is specific and credible.",
        ].join(" "),
    },
] as const

/** Skip the whole suite (with a clear message) when the SSOT mount is absent. */
const HAVE_VOLUME = volumeExists(SAMPLES[SAMPLES.length - 1].dir)
const describeOrSkip = HAVE_VOLUME
    ? describe
    : describe.skip

/**
 * LLM-eval harness for CV scoring, grounded in REAL `.volume` CV samples.
 * Boots the REAL {@link CvScoringService} + real STRICT-JSON parser, swaps only
 * {@link AiInvokeService} for the tiered harness model ({@link createHarnessInvoke},
 * `.secrets` auth), and grades the produced `{ score, feedback }` with the AI
 * {@link judge}. Covers: per-level grading, cross-level DISCRIMINATION (senior >
 * junior), the empty-input guard, and non-English (Vietnamese) feedback.
 *
 * Requires the `.volume` mount + a Claude Code OAuth token
 * (`.secrets/claude-code-token.txt` / `CLAUDE_CODE_OAUTH_TOKEN`) + live API.
 */
describeOrSkip("CV scoring — real .volume samples, judged (harness)",
    () => {
        let service: CvScoringService

        const cvRagRetrievalServiceMock = {
            retrieveCvContext: jest.fn().mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
            }),
        }

        /** Grade a raw CV markdown body, returning the real service result. */
        const score = (
            cvText: string,
            locale?: Locale,
        ) => service.score({
            userId: "harness-user",
            cvText,
            ...(locale
                ? {
                    locale,
                }
                : {
                }),
        })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                providers: [
                    CvScoringService,
                    {
                        provide: AiInvokeService,
                        useValue: createHarnessInvoke(() => currentTier),
                    },
                    {
                        provide: CvRagRetrievalService,
                        useValue: cvRagRetrievalServiceMock,
                    },
                ],
            }).compile()

            service = moduleRef.get(CvScoringService)
        })

        afterEach(() => {
            currentTier = "high"
            jest.clearAllMocks()
            cvRagRetrievalServiceMock.retrieveCvContext.mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
            })
        })

        // ── per-level grading: each real CV produces a sensible, specific grade ──
        it.each(SAMPLES)(
            "grades the real $name sample sensibly (tier=$tier)",
            async ({
                dir,
                tier,
                rubric,
            }) => {
                currentTier = tier
                const cv = readVolumeDoc(dir)
                expect(cv.body.trim().length).toBeGreaterThan(0)

                const result = await score(cv.body)

                expect(typeof result.score).toBe("number")
                expect(result.score).toBeGreaterThanOrEqual(0)
                expect(result.score).toBeLessThanOrEqual(100)
                expect(String(result.feedback.shortFeedback).trim().length).toBeGreaterThan(0)

                const verdict = await judge(rubric,
                    JSON.stringify({
                        score: result.score,
                        feedback: result.feedback,
                    }))
                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            },
        )

        // ── discrimination: the grader must rank a real senior CV above a junior one ──
        it("ranks the real SENIOR sample strictly above the real JUNIOR sample",
            async () => {
                currentTier = "high"
                const junior = readVolumeDoc("cv/samples/01-junior-backend-nodejs")
                const senior = readVolumeDoc("cv/samples/06-senior-backend-systemdesign")

                const juniorGrade = await score(junior.body)
                const seniorGrade = await score(senior.body)

                expect(seniorGrade.score).toBeGreaterThan(juniorGrade.score)
            })

        // ── guard: no CV content -> throws before any model call ──
        it("throws when neither structuredData nor cvText is provided",
            async () => {
                await expect(
                    service.score({
                        userId: "harness-user",
                    }),
                ).rejects.toThrow()
            })

        // ── locale: a Vietnamese request grades in Vietnamese ──
        it("grades a real sample in Vietnamese when locale = vi",
            async () => {
                currentTier = "mid"
                const cvVi = readVolumeDoc("cv/samples/04-mid-fullstack",
                    "vi")

                const result = await score(cvVi.body,
                    Locale.Vi)

                expect(String(result.feedback.shortFeedback).trim().length).toBeGreaterThan(0)
                const verdict = await judge(
                    "The feedback is written in Vietnamese and is specific to the CV (not generic). Pass only if the feedback text is in Vietnamese.",
                    JSON.stringify({
                        score: result.score,
                        feedback: result.feedback,
                    }))
                expect(verdict.pass).toBe(true)
            })
    })
