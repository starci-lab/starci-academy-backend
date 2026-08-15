import OpenAI from "openai"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    CvScoringPromptService,
} from "@features/api/processors/ai/shared/cv-scoring/cv-scoring-prompt.service"
import {
    parseCvScore,
} from "@features/api/processors/ai/shared/cv-scoring/utils/parse-cv-score"
import {
    describeWithGitMount,
    readGitMountDoc,
} from "@tests/helpers/git-mount"
import {
    readHarnessOpenRouterApiKey,
} from "@tests/helpers/harness-credentials"
import type {
    ScoreCvResult,
} from "@features/api/processors/ai/shared/cv-scoring/types"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const CV_GRADING_MODEL = "deepseek/deepseek-v4-flash"

const JUNIOR_SAMPLE = "cv/samples/01-junior-backend-nodejs"
const MID_SAMPLE = "cv/samples/04-mid-fullstack"
const SENIOR_SAMPLE = "cv/samples/06-senior-backend-systemdesign"
const MOUNT_DIRS = [
    JUNIOR_SAMPLE,
    MID_SAMPLE,
    SENIOR_SAMPLE,
]

const describeOrFail = describeWithGitMount(MOUNT_DIRS)

describeOrFail("CV scoring - direct OpenRouter DeepSeek (harness)",
    () => {
        const promptService = new CvScoringPromptService()
        let client: OpenAI

        beforeAll(() => {
            client = new OpenAI({
                apiKey: readHarnessOpenRouterApiKey(),
                baseURL: OPENROUTER_BASE_URL,
            })
        })

        const score = async (
            cvText: string,
            language: Locale = Locale.En,
            targetLevel: CvTargetLevel = CvTargetLevel.Mid,
        ): Promise<ScoreCvResult> => {
            const targetLanguage = language === Locale.Vi
                ? "Vietnamese (Tiếng Việt)"
                : "English"
            const { messages } = promptService.build({
                cvText,
                level: targetLevel,
                rubricContext: "",
                targetLanguage,
            })
            const completion = await client.chat.completions.create({
                model: CV_GRADING_MODEL,
                messages: messages.map((message) => ({
                    role: message._getType() === "system" ? "system" as const : "user" as const,
                    content: String(message.content),
                })),
                temperature: 0,
            })
            const raw = completion.choices[0]?.message.content
            if (!raw) {
                throw new Error(`Harness model ${CV_GRADING_MODEL} returned no CV score`)
            }
            return parseCvScore(raw,
                targetLevel)
        }

        it("ranks the real senior CV strictly above the real junior CV",
            async () => {
                const junior = readGitMountDoc(JUNIOR_SAMPLE)
                const senior = readGitMountDoc(SENIOR_SAMPLE)

                const juniorGrade = await score(junior.body)
                const seniorGrade = await score(senior.body)

                expect(juniorGrade.score).toBeGreaterThanOrEqual(0)
                expect(seniorGrade.score).toBeLessThanOrEqual(100)
                expect(String(seniorGrade.feedback.shortFeedback).trim()).not.toBe("")
                expect(seniorGrade.score).toBeGreaterThan(juniorGrade.score)
            })

        it("returns valid Vietnamese feedback for a real Vietnamese CV",
            async () => {
                const cv = readGitMountDoc(MID_SAMPLE,
                    "vi")

                const result = await score(cv.body,
                    Locale.Vi)
                const feedbackText = JSON.stringify(result.feedback)

                expect(result.score).toBeGreaterThanOrEqual(0)
                expect(result.score).toBeLessThanOrEqual(100)
                expect(String(result.feedback.shortFeedback).trim()).not.toBe("")
                expect(feedbackText).toMatch(/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/iu)
            })
    })
