import {
    FlashcardQuizSessionResultData, MyFlashcardQuizSessionBySessionIdData 
} from "./response"
describe("flashcard quiz session response DTOs",
    () => { it("returns session result and weak-tag state",
        () => { const result = Object.assign(new FlashcardQuizSessionResultData(),
            {
                cardId: "card1", correct: false, answer: "B", expected: "A" 
            }); const data = Object.assign(new MyFlashcardQuizSessionBySessionIdData(),
            {
                sessionId: "s1", results: [result], completed: true, scorePercent: 50 
            }); expect(data).toMatchObject({
            sessionId: "s1", results: [{
                correct: false 
            }], completed: true 
        }) }) })
