import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    CV_LEVEL_EXPECTATIONS,
    CV_SCORE_OUTPUT_TEMPLATE,
} from "./constants"
import {
    CvScoringPromptService,
} from "./cv-scoring-prompt.service"

describe("CvScoringPromptService",
    () => {
        const service = new CvScoringPromptService()

        it("preserves role, order, and exact prompt bytes for structured and text CV input",
            () => {
                const { messages } = service.build({
                    structuredData: {
                        fullName: "Jane Doe",
                    },
                    cvText: "  Senior engineer  ",
                    level: CvTargetLevel.Mid,
                    rubricContext: "RUBRIC-EXCERPT",
                    targetLanguage: "English",
                })

                expect(messages.map((message) => message._getType())).toEqual([
                    "system",
                    "human",
                ])
                expect(messages[0].content).toBe([
                    "You are a strict, experienced technical recruiter grading a mid-level engineer's CV.",
                    "",
                    "## Task",
                    "Grade the CV holistically against the rubric below and produce a single 0-100 score plus structured feedback.",
                    "Judge impact (quantified outcomes), clarity, relevant skills, structure, and evidence of real work.",
                    "Do NOT reward fabricated or vague claims; reward concrete, verifiable achievements.",
                    "",
                    "## Level expectations (mid)",
                    CV_LEVEL_EXPECTATIONS[CvTargetLevel.Mid],
                    "",
                    "## Reference rubric",
                    "RUBRIC-EXCERPT",
                    "",
                    "## IMPORTANT: Language",
                    "Write ALL human-readable feedback values (shortFeedback, message, suggestion) in **English**. JSON keys stay in English.",
                    "",
                    "## Scoring (scale 0-100)",
                    "- 0 = unusable; 100 = exceptional for the level.",
                    "- Anchor to the level expectations above — a strong junior CV is not a strong senior CV.",
                    "",
                    "## Output Format",
                    "Respond with a SINGLE JSON object matching this shape exactly (replace the placeholder strings):",
                    "",
                    JSON.stringify(CV_SCORE_OUTPUT_TEMPLATE,
                        null,
                        2),
                    "",
                    "## JSON Formatting",
                    "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
                    "- Use double quotes for all keys and string values.",
                    "- `items` may have any length; use an empty array only when there is genuinely nothing to note.",
                ].join("\n"))
                expect(messages[1].content).toBe([
                    "Below is the CV to grade:",
                    "",
                    "## Structured CV (JSON)",
                    "",
                    JSON.stringify({
                        fullName: "Jane Doe",
                    },
                    null,
                    2),
                    "",
                    "## CV text",
                    "",
                    "Senior engineer",
                ].join("\n"))
            })

        it("omits a blank RAG excerpt and keeps the Vietnamese instruction",
            () => {
                const vietnameseCv = "CV bằng tiếng Việt" // vn-ok: functional Vietnamese CV prompt fixture
                const targetLanguage = "Vietnamese (Tiếng Việt)" // vn-ok: production locale instruction
                const expectedHuman = `Below is the CV to grade:\n\n## CV text\n\n${vietnameseCv}`
                const { messages } = service.build({
                    cvText: vietnameseCv,
                    level: CvTargetLevel.Junior,
                    rubricContext: "   ",
                    targetLanguage,
                })

                expect(String(messages[0].content)).not.toContain("## Reference rubric")
                expect(String(messages[0].content)).toContain(
                    `in **${targetLanguage}**. JSON keys stay in English.`,
                )
                expect(messages[1].content).toBe(
                    expectedHuman,
                )
            })
    })
