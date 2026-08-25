import {
    MyInProgressMockInterviewSessionData, MyInProgressMockInterviewSessionTurnItem 
} from "./response"
describe("in-progress mock interview response DTOs",
    () => { it("keeps turn ordering and nullable completion fields",
        () => { const turn = Object.assign(new MyInProgressMockInterviewSessionTurnItem(),
            {
                turnIndex: 0, question: "Tell me", answer: null, score: null 
            }); const data = Object.assign(new MyInProgressMockInterviewSessionData(),
            {
                sessionId: "s1", turns: [turn], completedAt: null 
            }); expect(data).toMatchObject({
            sessionId: "s1", turns: [{
                turnIndex: 0, answer: null 
            }], completedAt: null 
        }) }) })
