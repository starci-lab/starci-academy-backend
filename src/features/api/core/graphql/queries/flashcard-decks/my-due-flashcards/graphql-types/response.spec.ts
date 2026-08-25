import {
    DueFlashcardObject, MyDueFlashcardsData 
} from "./response"
describe("due flashcards response",
    () => { it("projects due card identity and deck context",
        () => { const card = Object.assign(new DueFlashcardObject(),
            {
                id: "f1", deckId: "d1", front: "Q", dueAt: new Date() 
            }); const data = Object.assign(new MyDueFlashcardsData(),
            {
                cards: [card], total: 1 
            }); expect(data).toMatchObject({
            cards: [{
                id: "f1", deckId: "d1" 
            }], total: 1 
        }) }) })
