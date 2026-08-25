import {
    LearnAiCompanionData, LearnAiCompanionSessionType, LearnAiCompanionTurnType 
} from "./response"
describe("Learn AI companion response DTOs",
    () => { it("supports absent session and durable turn error state",
        () => { const turn = Object.assign(new LearnAiCompanionTurnType(),
            {
                streamId: "stream1", state: "failed", response: null, errorCode: "TIMEOUT", attemptCount: 2, updatedAt: new Date() 
            }); const data = Object.assign(new LearnAiCompanionData(),
            {
                session: null as LearnAiCompanionSessionType | null, messages: [], turns: [turn] 
            }); expect(data).toMatchObject({
            session: null, messages: [], turns: [{
                state: "failed", errorCode: "TIMEOUT", attemptCount: 2 
            }] 
        }) }) })
