import {
    MyFlashcardQuizHistoryItem, MyFlashcardQuizHistoryData 
} from "./response"
describe("flashcard quiz history response",
    () => { it("retains session score and completion date",
        () => { const item = Object.assign(new MyFlashcardQuizHistoryItem(),
            {
                sessionId: "s1", scorePercent: 90, completedAt: new Date() 
            }); const data = Object.assign(new MyFlashcardQuizHistoryData(),
            {
                items: [item], total: 1 
            }); expect(data).toMatchObject({
            items: [{
                sessionId: "s1", scorePercent: 90 
            }], total: 1 
        }) }) })
