import {
    MockInterviewPhaseScoreItem, MockInterviewGradeSessionData 
} from "./response"
describe("graded mock interview response DTOs",
    () => { it("exposes phase score and overall status",
        () => { const phase = Object.assign(new MockInterviewPhaseScoreItem(),
            {
                phase: "technical", score: 85, maxScore: 100 
            }); const data = Object.assign(new MockInterviewGradeSessionData(),
            {
                sessionId: "s1", phaseScores: [phase], overallScore: 85, feedback: "Good" 
            }); expect(data).toMatchObject({
            phaseScores: [{
                score: 85 
            }], overallScore: 85 
        }) }) })
