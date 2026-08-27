import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory
} from "@nestjs/graphql"
import {
    CompleteFlashcardQuizSessionResolver
} from "../complete-flashcard-quiz-session.resolver"
import {
    StartFlashcardQuizSessionResolver
} from "../../start-flashcard-quiz-session/start-flashcard-quiz-session.resolver"
import {
    SyncFlashcardQuizSessionProgressResolver
} from "../../sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.resolver"
import {
    FlashcardQuizEligibilityResolver
} from "../../../../queries/flashcard/flashcard-quiz-eligibility/flashcard-quiz-eligibility.resolver"
import {
    MyInProgressFlashcardQuizSessionResolver
} from "../../../../queries/flashcard/my-in-progress-flashcard-quiz-session/my-in-progress-flashcard-quiz-session.resolver"
import {
    CompleteFlashcardQuizSessionData, QuizSessionReadinessData
} from "./response"

describe("cloze GraphQL operation contract",
    () => {
        it("builds all five approved query and mutation operations",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule],
                }).compile()
                const schema = await moduleRef.get(GraphQLSchemaFactory).create([
                    StartFlashcardQuizSessionResolver,
                    SyncFlashcardQuizSessionProgressResolver,
                    CompleteFlashcardQuizSessionResolver,
                    FlashcardQuizEligibilityResolver,
                    MyInProgressFlashcardQuizSessionResolver,
                ])
                expect(schema.getMutationType()?.getFields()).toEqual(expect.objectContaining({
                    startFlashcardQuizSession: expect.anything(),
                    syncFlashcardQuizSessionProgress: expect.anything(),
                    completeFlashcardQuizSession: expect.anything(),
                }))
                expect(schema.getQueryType()?.getFields()).toEqual(expect.objectContaining({
                    flashcardQuizEligibility: expect.anything(),
                    myInProgressFlashcardQuizSession: expect.anything(),
                }))
            })

        it("carries the authoritative score and readiness result",
            () => {
                const readiness = Object.assign(new QuizSessionReadinessData(),
                    {
                        currentAvg: 55,
                        threshold: 40,
                        unlocked: true,
                    })
                const data = Object.assign(new CompleteFlashcardQuizSessionData(),
                    {
                        sessionId: "session-1",
                        status: "completed",
                        answerVersion: 2,
                        correctBlanks: 2,
                        totalBlanks: 2,
                        scorePercent: 100,
                        readiness,
                    })
                expect(data).toMatchObject({
                    scorePercent: 100,
                    readiness: {
                        unlocked: true
                    },
                })
            })
    })
