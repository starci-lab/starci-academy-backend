import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    FlashcardLevel,
    Locale,
} from "@modules/databases"
import {
    InterviewGradePromptService,
} from "./interview-grade-prompt.service"
import {
    type BuildInterviewGradePromptParams,
} from "./types/interview-grade"

describe("InterviewGradePromptService",
    () => {
        let service: InterviewGradePromptService

        /** Baseline params for the happy path (Senior, English). */
        const baseParams: BuildInterviewGradePromptParams = {
            question: "What is a database index?",
            modelAnswer: "A structure that speeds up lookups at write/space cost.",
            level: FlashcardLevel.Senior,
            transcript: "an index makes reads faster",
            locale: Locale.En,
        }

        beforeEach(() => {
            // the builder is pure — no DI / no I/O to mock
            service = new InterviewGradePromptService()
        })

        /** Pull the system + human text out of the built messages for assertions. */
        const buildTexts = (params: BuildInterviewGradePromptParams) => {
            const {
                messages,
            } = service.build(params)
            return {
                messages,
                systemText: messages[0].content as string,
                humanText: messages[1].content as string,
            }
        }

        it("builds an ordered [system, human] message pair from the question + answer + transcript",
            () => {
                const {
                    messages,
                    systemText,
                    humanText,
                } = buildTexts(baseParams)

                // exactly two messages, system first then human
                expect(messages).toHaveLength(2)
                expect(messages[0]).toBeInstanceOf(SystemMessage)
                expect(messages[1]).toBeInstanceOf(HumanMessage)

                // the question + model-answer rubric land in the system prompt
                expect(systemText).toContain(baseParams.question)
                expect(systemText).toContain(baseParams.modelAnswer)
                // the candidate's transcript lands in the human message
                expect(humanText).toContain(baseParams.transcript)
            })

        it("injects the level expectation matching the card's FlashcardLevel",
            () => {
                const {
                    systemText,
                } = buildTexts({
                    ...baseParams,
                    level: FlashcardLevel.Staff,
                })

                // staff level → its systemic-reasoning expectation line
                expect(systemText).toContain("Staff / Architect")
                // and not a different level's line
                expect(systemText).not.toContain("Junior — expect correct recall")
            })

        it("uses a neutral expectation when the level is null",
            () => {
                const {
                    systemText,
                } = buildTexts({
                    ...baseParams,
                    level: null,
                })

                expect(systemText).toContain("Unspecified level")
                // no concrete level line leaks in
                expect(systemText).not.toContain("Senior — expect tradeoffs")
            })

        it("instructs the model to write feedback in the locale's language (Vietnamese)",
            () => {
                const {
                    systemText,
                } = buildTexts({
                    ...baseParams,
                    locale: Locale.Vi,
                })

                expect(systemText).toContain("Vietnamese (Tiếng Việt)")
            })

        it("defaults the language to English for the English locale",
            () => {
                const {
                    systemText,
                } = buildTexts(baseParams)

                expect(systemText).toContain("**English**")
            })

        it("falls back to a no-answer placeholder when the transcript is empty/whitespace",
            () => {
                const {
                    humanText,
                } = buildTexts({
                    ...baseParams,
                    transcript: "   ",
                })

                expect(humanText).toContain("(the candidate gave no answer)")
            })
    })
