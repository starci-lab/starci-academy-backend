import {
    FlashcardByIdObject, FlashcardCardsByIdsData 
} from "./response"
describe("flashcard cards by ids response",
    () => { it("preserves card prompt, answer and scheduling state",
        () => { const card = Object.assign(new FlashcardByIdObject(),
            {
                id: "f1", front: "Q", back: "A", dueAt: null 
            }); const data = Object.assign(new FlashcardCardsByIdsData(),
            {
                cards: [card] 
            }); expect(data).toMatchObject({
            cards: [{
                id: "f1", front: "Q", back: "A", dueAt: null 
            }] 
        }) }) })
