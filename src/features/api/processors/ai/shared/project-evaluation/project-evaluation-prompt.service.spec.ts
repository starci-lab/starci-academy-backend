import {
    createHash,
} from "node:crypto"
import template from "../../review-milestone-task/steps/template.json"
import {
    ProjectEvaluationPromptService,
} from "./project-evaluation-prompt.service"

describe("ProjectEvaluationPromptService",
    () => {
        const service = new ProjectEvaluationPromptService()

        it("builds the exact V2 role content, critical rubric and source message",
            () => {
                const result = service.build({
                    kind: "v2",
                    taskTitle: "Build API",
                    targetLanguage: "Vietnamese (Tiếng Việt)",
                    sourceExcerpt: "src/main.ts:1\nbootstrap()",
                    gradeMaxScore: 50,
                    criteria: [
                        {
                            body: "Health endpoint returns 200",
                            score: 10,
                            critical: true,
                            kind: "outcome",
                        },
                        {
                            body: "Uses modules",
                            score: 40,
                            critical: false,
                            kind: "approach",
                        },
                    ],
                })

                expect(result.humanText).toBe([
                    "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
                    "",
                    "src/main.ts:1\nbootstrap()",
                ].join("\n"))
                expect(result.systemText).toContain("task: \"Build API\"")
                expect(result.systemText).toContain("### Criterion 0 [outcome] (CRITICAL) (maxScore: 10)\nHealth endpoint returns 200")
                expect(result.systemText).toContain("### Criterion 1 [approach] (maxScore: 40)\nUses modules")
                expect(result.systemText).toContain("## Scoring (max total: 50)")
                expect(result.systemText).toContain("all human-readable values (shortFeedback, message, suggestion) must be in Vietnamese (Tiếng Việt).")
                expect(result.systemText).toContain(JSON.stringify(template,
                    null,
                    2))
                expect(createHash("sha256").update(result.systemText).digest("hex")).toBe("7dcffad48d33272c2b221bbcfd705d2c41d0c0922db299292a7dd9cfa1fca2f8")
                expect(createHash("sha256").update(result.humanText).digest("hex")).toBe("0badc2160589554b8a082b2c33482267a7d993aba55630370cb1b207c5a9280d")
            })

        it("builds the exact sorted legacy rubric and empty-source fallback",
            () => {
                const result = service.build({
                    kind: "legacy",
                    taskTitle: "Legacy task",
                    targetLanguage: "English",
                    sourceExcerpt: "",
                    criteria: [
                        {
                            id: "second",
                            orderIndex: 1,
                            score: 20,
                            text: "Second display",
                            promptText: "Second rubric",
                        },
                        {
                            id: "first",
                            orderIndex: 0,
                            score: 30,
                            text: "First display",
                            promptText: "",
                        },
                    ],
                })

                expect(result.humanText).toBe([
                    "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
                    "",
                    "(empty repository excerpt)",
                ].join("\n"))
                const first = result.systemText.indexOf("### Criteria 0 (id: \"first\", maxScore: 30)")
                const second = result.systemText.indexOf("### Criteria 1 (id: \"second\", maxScore: 20)")
                expect(first).toBeGreaterThanOrEqual(0)
                expect(second).toBeGreaterThan(first)
                expect(result.systemText).toContain("**Grading Rubric:**\nSecond rubric")
                expect(result.systemText).toContain("all human-readable values (shortFeedback, feedback, suggestion) must be in English.")
                expect(result.systemText).toContain(JSON.stringify(template,
                    null,
                    2))
                expect(createHash("sha256").update(result.systemText).digest("hex")).toBe("d0f0066844240f63177f10bb799212a34c4aa627562f97f942e5fed0aeada0dc")
                expect(createHash("sha256").update(result.humanText).digest("hex")).toBe("0d41d36932a533b42a1e6388283ec91bffa013b39feb6c105099915df5973447")
            })
    })
