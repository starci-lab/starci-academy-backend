import {
    UserSolvedChallengeDetailAttemptData, UserSolvedChallengeDetailData 
} from "./response"
describe("solved challenge detail response DTOs",
    () => { it("retains attempt feedback and best-attempt summary",
        () => { const attempt = Object.assign(new UserSolvedChallengeDetailAttemptData(),
            {
                id: "a1", score: 80, passed: true, feedback: null, submittedAt: new Date() 
            }); const data = Object.assign(new UserSolvedChallengeDetailData(),
            {
                challengeId: "c1", title: "Two sum", attempts: [attempt], bestScore: 80 
            }); expect(data).toMatchObject({
            challengeId: "c1", attempts: [{
                passed: true, feedback: null 
            }], bestScore: 80 
        }) }) })
