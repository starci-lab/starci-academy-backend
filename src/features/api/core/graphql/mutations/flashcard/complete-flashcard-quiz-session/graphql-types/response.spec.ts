import {
    CompleteFlashcardQuizSessionData, QuizSessionReadinessData 
} from "./response"
describe("complete flashcard quiz response",
    () => { it("returns score and readiness summary",
        () => { const readiness = Object.assign(new QuizSessionReadinessData(),
            {
                ready: true, weakTagCount: 0 
            }); const data = Object.assign(new CompleteFlashcardQuizSessionData(),
            {
                sessionId: "s1", scorePercent: 100, readiness 
            }); expect(data).toMatchObject({
            sessionId: "s1", scorePercent: 100, readiness: {
                ready: true 
            } 
        }) }) })
