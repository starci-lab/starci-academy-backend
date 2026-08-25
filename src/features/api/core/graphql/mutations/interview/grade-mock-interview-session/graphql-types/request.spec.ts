import {
    GradeMockInterviewSessionRequest, MockInterviewTurnInput 
} from "./request"
describe("grade mock interview request",
    () => { it("carries session and turn inputs",
        () => { const turn = Object.assign(new MockInterviewTurnInput(),
            {
                questionId: "q1", answer: "answer" 
            }); const request = Object.assign(new GradeMockInterviewSessionRequest(),
            {
                sessionId: "s1", turns: [turn] 
            }); expect(request).toMatchObject({
            sessionId: "s1", turns: [{
                questionId: "q1", answer: "answer" 
            }] 
        }) }) })
