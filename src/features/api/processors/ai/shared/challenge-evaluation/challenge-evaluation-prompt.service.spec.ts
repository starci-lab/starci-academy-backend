import {
    createHash,
} from "node:crypto"
import {
    ChallengeEvaluationPromptService,
} from "./challenge-evaluation-prompt.service"

const criteria = [
    {
        body: "The endpoint returns 201.",
        score: 60,
        critical: true,
        kind: "outcome",
    },
    {
        body: "Dependencies are injected.",
        score: 40,
        critical: false,
        kind: "approach",
    },
] as const

const sha256 = (value: string): string => createHash("sha256")
    .update(value)
    .digest("hex")

describe("ChallengeEvaluationPromptService",
    () => {
        const service = new ChallengeEvaluationPromptService()

        it("builds the exact ordered code prompt and score boundary",
            () => {
                const result = service.build({
                    source: "code",
                    challengeTitle: "Build the API",
                    targetLanguage: "English",
                    criteria: [...criteria],
                    sourceExcerpt: "src/main.ts:1 export const ready = true",
                })

                expect(result.maxScore).toBe(100)
                expect(result.messages.map((message) => message._getType())).toEqual([
                    "system",
                    "human",
                ])
                expect(sha256(String(result.messages[0].content))).toBe(
                    "02ac894c251d892dba7367c218dbdb697062f62e97f561d55ee1e295928de18a",
                )
                expect(String(result.messages[1].content)).toBe([
                    "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
                    "",
                    "src/main.ts:1 export const ready = true",
                ].join("\n"))
            })

        it("builds the exact ordered document prompt, locale and document template",
            () => {
                const result = service.build({
                    source: "document",
                    challengeTitle: "Explain the design",
                    targetLanguage: "Vietnamese (Tiếng Việt)", // vn-ok: verifies the functional locale prompt
                    criteria: [...criteria],
                    sourceExcerpt: "Tài liệu mô tả đầy đủ.", // vn-ok: verifies functional UTF-8 submission content
                })
                const systemText = String(result.messages[0].content)

                expect(result.maxScore).toBe(100)
                expect(result.messages.map((message) => message._getType())).toEqual([
                    "system",
                    "human",
                ])
                expect(systemText).toContain("\"criteriaId\"")
                expect(systemText).toContain("Vietnamese (Tiếng Việt)")
                expect(sha256(systemText)).toBe(
                    "60a208d4667d48af51dd746bc1b25c10cb7c8bca151346c494379f721d9adff9",
                )
                expect(String(result.messages[1].content)).toBe([
                    "Below is the content loaded from the submitted document (may be truncated):",
                    "",
                    "Tài liệu mô tả đầy đủ.", // vn-ok: expected functional UTF-8 submission content
                ].join("\n"))
            })

        it("keeps source bytes out of the cacheable system prefix and preserves empty fallbacks",
            () => {
                const first = service.build({
                    source: "code",
                    challengeTitle: "Cache-safe challenge",
                    targetLanguage: "English",
                    criteria: [],
                    sourceExcerpt: "",
                })
                const second = service.build({
                    source: "code",
                    challengeTitle: "Cache-safe challenge",
                    targetLanguage: "English",
                    criteria: [],
                    sourceExcerpt: "submission-specific",
                })

                expect(first.messages[0].content).toBe(second.messages[0].content)
                expect(first.messages[0].content).not.toContain("submission-specific")
                expect(first.messages[1].content).toContain("(empty repository excerpt)")
                expect(first.maxScore).toBe(0)
            })
    })
