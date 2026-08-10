import {
    Test,
} from "@nestjs/testing"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    CvRagRetrievalService,
} from "@modules/integrations/rag/cv-rag-retrieval.service"
import {
    CvScoringService,
} from "@features/api/processors/ai/shared/cv-scoring/cv-scoring.service"
import {
    HarnessInvokeService,
} from "@tests/helpers/harness-invoke.service"
import {
    JudgeService,
} from "@tests/helpers/judge.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"
import {
    GitMountService,
} from "@tests/helpers/git-mount.service"
import {
    describeWithGitMount,
} from "@tests/helpers/git-mount"
import type {
    HarnessModel,
} from "@tests/helpers/harness-invoke"

/** Minimum judge score a produced grade must reach to count as passing. */
const PASS_SCORE = 60

/**
 * The model this harness grades with, named here rather than resolved from a tier table.
 *
 * A layer that CHOOSES the model between the harness and the provider can make this lane green
 * about a model nobody ships, so the choice is stated in the file that depends on it. Grading is
 * the highest-stakes AI call the product makes -- a wrong grade is shown to a learner as a fact --
 * so it runs on the strongest model rather than the cheapest.
 */
const GRADING_MODEL: HarnessModel = {
    model: "claude-opus-5",
    effort: "low",
}

/** Real CV samples from the `.gitmounts` SSOT mount -- the exemplars the app itself ships. */
const JUNIOR_SAMPLE = "cv/samples/01-junior-backend-nodejs"
const MID_SAMPLE = "cv/samples/04-mid-fullstack"
const SENIOR_SAMPLE = "cv/samples/06-senior-backend-systemdesign"

/** The mounted content this suite grounds its cases in. A missing path FAILS, never skips. */
const MOUNT_DIRS = [
    SENIOR_SAMPLE,
]

const describeOrSkip = describeWithGitMount(MOUNT_DIRS)

/**
 * LLM-eval harness for CV scoring, grounded in REAL `.gitmounts` samples.
 *
 * Boots the REAL {@link CvScoringService} and its real STRICT-JSON parser, swapping only
 * {@link AiInvokeService} for a direct provider call. It REALLY CALLS: a faked model here would
 * measure nothing, because what the grader actually produced is the whole subject of this lane.
 *
 * THREE CASES, DOWN FROM SIX, AND THE CUT IS DELIBERATE. This lane is billed per call, so a matrix
 * is not thoroughness here -- it is the reason people stop running the harness, and a stale green
 * is worse than no green. What survived is what a regression shows up in:
 *
 *   - DISCRIMINATION replaced three per-level "is this score plausible?" cases outright. Those were
 *     judged against a fuzzy rubric, so a grader drifting ten points passed all three; ranking a
 *     real senior CV above a real junior one is a relative claim that needs no judge at all, and it
 *     exercises grading twice while asserting something a drift would actually break.
 *   - the LOCALE case fails visibly when instruction-following degrades: the feedback comes back in
 *     English.
 *   - the GUARD case costs nothing -- it must throw BEFORE any model call, so it is free to keep.
 *
 * Requires the `.gitmounts` mount and a Claude Code OAuth token
 * (`.secrets/claude-code-token.txt` / `CLAUDE_CODE_OAUTH_TOKEN`) with live API access.
 */
describeOrSkip("CV scoring - real .gitmounts samples, judged (harness)",
    () => {
        let service: CvScoringService
        let judgeService: JudgeService
        let gitMountService: GitMountService

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
                imports: [
                    TestHelpersModule,
                ],
                providers: [
                    CvScoringService,
                    {
                        provide: AiInvokeService,
                        useFactory: (
                            harnessInvoke: HarnessInvokeService,
                        ) => harnessInvoke.create(() => GRADING_MODEL),
                        inject: [
                            HarnessInvokeService,
                        ],
                    },
                    {
                        provide: CvRagRetrievalService,
                        useValue: cvRagRetrievalServiceMock,
                    },
                ],
            }).compile()

            service = moduleRef.get(CvScoringService)
            judgeService = moduleRef.get(JudgeService)
            gitMountService = moduleRef.get(GitMountService)
        })

        afterEach(() => {
            jest.clearAllMocks()
            cvRagRetrievalServiceMock.retrieveCvContext.mockResolvedValue({
                excerpt: "",
                retrievedChunks: 0,
            })
        })

        // -- discrimination: the grader must rank a real senior CV above a real junior one --
        it("ranks the real SENIOR sample strictly above the real JUNIOR sample",
            async () => {
                const junior = gitMountService.readGitMountDoc(JUNIOR_SAMPLE)
                const senior = gitMountService.readGitMountDoc(SENIOR_SAMPLE)
                expect(junior.body.trim().length).toBeGreaterThan(0)
                expect(senior.body.trim().length).toBeGreaterThan(0)

                const juniorGrade = await score(junior.body)
                const seniorGrade = await score(senior.body)

                // the shape of a grade is asserted here rather than in a case of its own: a result
                // that is not a number in range would fail this comparison for the wrong reason
                expect(typeof seniorGrade.score).toBe("number")
                expect(seniorGrade.score).toBeGreaterThanOrEqual(0)
                expect(seniorGrade.score).toBeLessThanOrEqual(100)
                expect(String(seniorGrade.feedback.shortFeedback).trim().length).toBeGreaterThan(0)

                expect(seniorGrade.score).toBeGreaterThan(juniorGrade.score)
            })

        // -- guard: no CV content -> throws before any model call, so this case is free --
        it("throws when neither structuredData nor cvText is provided",
            async () => {
                await expect(
                    service.score({
                        userId: "harness-user",
                    }),
                ).rejects.toThrow()
            })

        // -- locale: a Vietnamese request grades in Vietnamese --
        it("grades a real sample in Vietnamese when locale = vi",
            async () => {
                const cvVi = gitMountService.readGitMountDoc(MID_SAMPLE,
                    "vi")

                const result = await score(cvVi.body,
                    Locale.Vi)

                expect(String(result.feedback.shortFeedback).trim().length).toBeGreaterThan(0)
                const verdict = await judgeService.judge(
                    "The feedback is written in Vietnamese and is specific to the CV (not generic). Pass only if the feedback text is in Vietnamese.",
                    JSON.stringify({
                        score: result.score,
                        feedback: result.feedback,
                    }))
                expect(verdict.pass).toBe(true)
                expect(verdict.score).toBeGreaterThanOrEqual(PASS_SCORE)
            })
    })
